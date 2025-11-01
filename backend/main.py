"""FastAPI Quiz Backend - Real-time quiz platform with WebSocket support.

This is the main application file that students will see to understand
how Python powers the quiz backend.
"""

import asyncio
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from game_state import advance_to_next_question, start_question_timer
from models import (
    Answer,
    JoinRoomRequest,
    NextQuestionRequest,
    Participant,
    Room,
    StartQuestionRequest,
    SubmitAnswerRequest,
)
from scoring import calculate_score
from storage import active_question_answers, answers, participants, rooms
from validation import validate_answer


# Lifespan event replacing @app.on_event()
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run on application startup."""
    print("🚀 Quiz Backend starting up!")
    print("📚 API Docs available at: http://localhost:8000/docs")
    print("🐍 Python-powered real-time quiz platform ready!")
    yield


# Create FastAPI app
app = FastAPI(
    title="Quiz Backend - Python Powered! 🐍",
    description="Real-time quiz platform backend using FastAPI and WebSockets",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware - Configure allowed origins via CORS_ORIGINS environment variable
# Format: comma-separated list like "http://localhost:4321,https://your-app.railway.app"
cors_origins_str = os.getenv(
    "CORS_ORIGINS", "http://localhost:4321,http://localhost:3000,http://localhost"
)
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
connected_clients: dict[str, list[WebSocket]] = {}


# === REST API Endpoints ===


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Quiz Backend is running! 🎯",
        "docs": "/docs",
        "active_rooms": len(rooms),
    }


@app.post("/api/rooms/create")
async def create_room(quiz_id: str):
    """
    Create a new quiz room.

    Args:
        quiz_id: Identifier for the quiz (e.g., "javascript-basics")

    Returns:
        room_id: Generated room code
        host_secret: Secret token for host authentication
    """
    # Generate random room code (8 characters)
    room_id = secrets.token_hex(4).upper()
    host_secret = secrets.token_urlsafe(16)

    room = Room(
        id=room_id, quiz_id=quiz_id, host_secret=host_secret, created_at=datetime.now()
    )

    rooms[room_id] = room

    return {"room_id": room_id, "host_secret": host_secret}


@app.post("/api/rooms/{room_id}/join")
async def join_room(room_id: str, request: JoinRoomRequest):
    """
    Join a room as a participant.

    Args:
        room_id: The room code to join
        request: Request body containing nickname

    Returns:
        participant_id: Unique identifier for this participant
    """
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    nickname = request.nickname

    # Generate participant ID
    participant_id = secrets.token_urlsafe(8)

    participant = Participant(
        id=participant_id, room_id=room_id, nickname=nickname, joined_at=datetime.now()
    )

    participants[participant_id] = participant
    rooms[room_id].participant_ids.append(participant_id)

    # Broadcast participant joined
    await broadcast_to_room(
        room_id,
        {
            "type": "participant_joined",
            "participant": {"id": participant_id, "nickname": nickname},
            "total_participants": len(rooms[room_id].participant_ids),
        },
    )

    return {"participant_id": participant_id}


@app.get("/api/rooms/{room_id}")
async def get_room_state(room_id: str):
    """Get current room state."""
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    return rooms[room_id]


@app.post("/api/rooms/{room_id}/start")
async def start_question(room_id: str, request: StartQuestionRequest):
    """
    Start timer for current question (host only).

    Args:
        room_id: The room ID
        request: Request body containing host_secret, time_limit, correct_answer, question_index
    """
    host_secret = request.host_secret
    time_limit = request.time_limit

    room = rooms.get(room_id)
    if not room or room.host_secret != host_secret:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # This will be used later when the timeout broadcast is triggered
    active_question_answers[room_id] = request.correct_answer

    # Start the timer
    _ = start_question_timer(room, time_limit)

    # This task will run independently and broadcast the correct answer when time expires
    _ = asyncio.create_task(
        schedule_timeout_broadcast(
            room_id,
            time_limit,
            request.question_index,  # or use request.question_index
            request.correct_answer,
        )
    )

    # Broadcast to all participants
    await broadcast_to_room(
        room_id,
        {
            "type": "question_started",
            "question_index": room.current_question,
            "time_limit": time_limit,
            "ends_at": room.question_ends_at.isoformat()
            if room.question_ends_at
            else None,
        },
    )

    return {"success": True, "ends_at": room.question_ends_at}


@app.post("/api/rooms/{room_id}/next")
async def next_question(room_id: str, request: NextQuestionRequest):
    """
    Move to next question (host only).

    Args:
        room_id: The room ID
        request: Request body containing host_secret
    """
    host_secret = request.host_secret

    room = rooms.get(room_id)
    if not room or room.host_secret != host_secret:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # This frees up memory and ensures old answers don't linger
    if room_id in active_question_answers:
        del active_question_answers[room_id]

    advance_to_next_question(room)

    await broadcast_to_room(
        room_id, {"type": "question_changed", "question_index": room.current_question}
    )

    return {"current_question": room.current_question}


@app.post("/api/rooms/{room_id}/answer")
async def submit_answer(room_id: str, request: SubmitAnswerRequest):
    """
    Submit an answer and calculate score.

    This endpoint demonstrates the scoring algorithm to students!

    Args:
        room_id: The room ID
        request: Request body containing all answer submission data
    """
    participant_id = request.participant_id
    answer = request.answer
    response_time = request.response_time
    question_index = request.question_index
    correct_answer = request.correct_answer
    question_type = request.question_type
    max_points = request.max_points

    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    if participant_id not in participants:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant = participants[participant_id]

    # Validate answer
    is_correct = validate_answer(answer, correct_answer, question_type)

    points = 0
    if is_correct:
        # Calculate score using the scoring algorithm
        points = calculate_score(
            max_points=max_points,
            response_time=response_time,
            time_limit=30,  # Could be passed as parameter
            streak=participant.current_streak,
        )
        participant.score += points
        participant.current_streak += 1
    else:
        participant.current_streak = 0

    # Store answer
    answer_obj = Answer(
        participant_id=participant_id,
        question_index=question_index,
        answer=answer,
        is_correct=is_correct,
        points_earned=points,
        response_time=response_time,
        submitted_at=datetime.now(),
    )

    if room_id not in answers:
        answers[room_id] = []
    answers[room_id].append(answer_obj)

    # Broadcast updated leaderboard
    await broadcast_leaderboard(room_id)

    return {
        "is_correct": is_correct,
        "points_earned": points,
        "current_score": participant.score,
        "streak": participant.current_streak,
    }


@app.get("/api/leaderboard/{room_id}")
async def get_leaderboard(room_id: str):
    """
    Get current leaderboard for a room.

    Returns participants sorted by score (descending).
    """
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[room_id]
    leaderboard = []

    for pid in room.participant_ids:
        if pid in participants:
            p = participants[pid]
            leaderboard.append(
                {
                    "participant_id": pid,
                    "nickname": p.nickname,
                    "score": p.score,
                    "streak": p.current_streak,
                }
            )

    # Sort by score descending
    leaderboard.sort(key=lambda x: x["score"], reverse=True)

    # Add ranks
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return {"leaderboard": leaderboard}


# === WebSocket Endpoints ===


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket connection for real-time updates.

    This shows students how Python handles multiple concurrent connections!
    """
    await websocket.accept()

    # Add to room's client list
    if room_id not in connected_clients:
        connected_clients[room_id] = []
    connected_clients[room_id].append(websocket)

    try:
        # Keep connection alive, listen for messages
        while True:
            data = await websocket.receive_json()
            # Handle any client messages if needed
            # For now, we mainly use WebSocket for server -> client broadcasts

    except WebSocketDisconnect:
        # Connection closed
        if room_id in connected_clients:
            connected_clients[room_id].remove(websocket)


async def broadcast_to_room(room_id: str, message: dict):
    """
    Broadcast message to all clients in a room.

    This is how real-time updates work!

    Args:
        room_id: Room to broadcast to
        message: JSON message to send
    """
    if room_id not in connected_clients:
        return

    disconnected = []

    for client in connected_clients[room_id]:
        try:
            await client.send_json(message)
        except:
            # Client disconnected
            disconnected.append(client)

    # Clean up disconnected clients
    for client in disconnected:
        connected_clients[room_id].remove(client)


async def broadcast_leaderboard(room_id: str):
    """Broadcast updated leaderboard to all participants."""
    leaderboard_data = await get_leaderboard(room_id)

    await broadcast_to_room(
        room_id,
        {"type": "leaderboard_updated", "leaderboard": leaderboard_data["leaderboard"]},
    )


async def schedule_timeout_broadcast(
    room_id: str, delay: int, question_index: int, correct_answer: list[str]
) -> None:
    """
    Schedule a timeout broadcast after delay seconds.

    This runs as a background task and broadcasts when the question timer expires,
    allowing all players to see the correct answer simultaneously.

    Args:
        room_id: The room to broadcast to
        delay: Time in seconds to wait before broadcasting
        question_index: Which question timed out
        correct_answer: The correct answer(s) to reveal to players
    """
    await asyncio.sleep(delay)
    await broadcast_to_room(
        room_id,
        {
            "type": "question_timeout",
            "question_index": question_index,
            "correct_answer": correct_answer,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
