"""Pydantic data models for the quiz application."""

from datetime import datetime, timedelta
from enum import Enum

from pydantic import BaseModel


class RoomStatus(Enum):
    """The status any given room can be set to"""

    WAITING = "waiting"
    ACTIVE = "active"
    PAUSED = "paused"
    FINISHED = "finished"


class QuestionType(Enum):
    """The available question types"""

    MULTI = "multiple-choice"
    SHORT = "short-answer"


class Room(BaseModel):
    """Quiz room/session model."""

    id: str  # Room code like "GAME1234"
    quiz_id: str  # Quiz identifier from markdown filename
    host_secret: str  # Authentication token for host
    total_questions: int = 0
    current_question: int = 0
    status: RoomStatus = RoomStatus.WAITING  # waiting | active | paused | finished
    question_started_at: datetime | None = None
    question_ends_at: datetime | None = None
    participant_ids: list[str] = []
    created_at: datetime = datetime.now()

    def is_complete(self) -> bool:
        """Check if quiz is complete"""
        return self.current_question >= self.total_questions

    def advance_question(self) -> bool:
        """
        Move to the next question in the quiz.

        Returns:
            True if advanced to next question, False if quiz is now complete
        """
        self.current_question += 1

        if self.is_complete():
            self.finish_quiz()
            return False

        self.question_started_at = None
        self.question_ends_at = None
        self.status = RoomStatus.WAITING

        return True

    def start_question_timer(self, time_limit: int) -> None:
        """
        Start the timer for the current question.

        Args:
            time_limit: Question time limit in seconds

        Returns:
            None
        """
        now = datetime.now()
        self.question_started_at = now
        self.question_ends_at = now + timedelta(seconds=time_limit)
        self.status = RoomStatus.ACTIVE

    def finish_quiz(self) -> None:
        """
        Mark the quiz as finished.

        Args:
            None

        Returns:
            None
        """
        self.status = RoomStatus.FINISHED
        self.question_started_at = None
        self.question_ends_at = None


class Participant(BaseModel):
    """Quiz participant model."""

    id: str  # Unique participant ID
    room_id: str  # Room they belong to
    nickname: str
    score: int = 0
    current_streak: int = 0
    joined_at: datetime


class Answer(BaseModel):
    """Submitted answer model."""

    participant_id: str
    question_index: int
    answer: str
    is_correct: bool
    points_earned: int
    response_time: int  # Milliseconds
    submitted_at: datetime


class QuestionData(BaseModel):
    """Question data structure."""

    index: int
    type: str  # "multiple-choice" | "short-answer"
    text: str
    options: list[str] | None = None  # For multiple choice
    time_limit: int  # Seconds
    points: int
    image_url: str | None = None


# Request Models (for API endpoints)
# These models tell FastAPI to expect data in the request BODY as JSON


class JoinRoomRequest(BaseModel):
    """Request body for joining a room as a participant."""

    nickname: str


class StartQuestionRequest(BaseModel):
    """Request body for starting a question (host only)."""

    host_secret: str
    time_limit: int
    correct_answer: list[str]
    question_index: int


class NextQuestionRequest(BaseModel):
    """Request body for advancing to next question (host only)."""

    host_secret: str


class SubmitAnswerRequest(BaseModel):
    """Request body for submitting an answer."""

    participant_id: str
    answer: str
    response_time: int  # Milliseconds
    question_index: int
    correct_answer: list[str]
    question_type: QuestionType
    max_points: int
