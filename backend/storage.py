"""In-memory storage for quiz sessions.

Data is ephemeral and exists only during server runtime.
"""

from models import Answer, Leaderboard, Participant, Room

# For now, just dictionaries stored in-memory
rooms: dict[str, Room] = {}
participants: dict[str, Participant] = {}
answers: dict[str, list[Answer]] = {}  # Key is room_id
active_question_answers: dict[str, list[str]] = {}
cached_leaderboards: dict[str, Leaderboard] = {}
