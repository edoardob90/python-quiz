"""Pydantic data models for the quiz application."""

from datetime import datetime, timedelta
from enum import Enum

from pydantic import BaseModel, Field


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


class ValidationMethod(Enum):
    """Validation methods for answer checking."""

    EXACT = "exact"  # Exact string match (multiple-choice)
    FUZZY = "fuzzy"  # String similarity (rapidfuzz)
    SEMANTIC = "semantic"  # Meaning similarity (embeddings)
    HYBRID = "hybrid"  # Try fuzzy first, then semantic


class Room(BaseModel):
    """Quiz room/session model."""

    id: str  # Unique identifier for the room
    quiz_id: str  # Quiz identifier from markdown filename
    host_secret: str  # Authentication token for host
    total_questions: int = 0
    current_question: int = 0
    question_order: list[int] = Field(default_factory=list)
    status: RoomStatus = RoomStatus.WAITING
    question_started_at: datetime | None = None
    question_ends_at: datetime | None = None
    participant_ids: list[str] = Field(default_factory=list)
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

    def set_question_order(self) -> None:
        """
        Generate and store a randomized order for the questions in this room.
        This ensures all participants in the same room will see questions in the same order.
        """
        import random

        if self.question_order or self.total_questions == 0:
            return

        self.question_order = sorted(
            range(self.total_questions), key=lambda _: random.random()
        )


class Participant(BaseModel):
    """Quiz participant model."""

    id: str  # Unique participant ID
    room_id: str  # Room they belong to
    nickname: str
    score: int = 0
    current_streak: int = 0
    joined_at: datetime


class LeaderboardEntry(BaseModel):
    """Leaderboard entry model."""

    participant_id: str
    nickname: str
    score: int
    rank: int
    streak: int

    @classmethod
    def from_participant(
        cls, participant: Participant, rank: int = -1
    ) -> "LeaderboardEntry":
        """
        Construct from a Participant instance.

        Args:
            participant: The participant instance to construct from.
            rank: The rank of the participant in the leaderboard. Defaults to -1.

        Returns:
            LeaderboardEntry: The constructed leaderboard entry.
        """
        return cls(
            participant_id=participant.id,
            nickname=participant.nickname,
            score=participant.score,
            rank=rank,
            streak=participant.current_streak,
        )


class Leaderboard(BaseModel):
    """Leaderboard base model with business logic."""

    room_id: str
    entries: list[LeaderboardEntry] = Field(default_factory=list)

    def _sort_and_rank(self) -> None:
        """Sort entries by score and assign ranks."""
        self.entries.sort(key=lambda e: e.score, reverse=True)
        for i, entry in enumerate(self.entries):
            entry.rank = i + 1

    def add_participant(self, participant: Participant) -> None:
        """Add a new participant with default score."""
        entry = LeaderboardEntry.from_participant(participant)
        self.entries.append(entry)

    def recalculate(self, participants: dict[str, Participant], room: Room) -> None:
        """Recalculate the scores from participants storage."""
        self.entries = [
            LeaderboardEntry.from_participant(participants[pid])
            for pid in room.participant_ids
            if pid in participants
        ]
        self._sort_and_rank()

    def to_response(self) -> "LeaderboardResponse":
        """Convert the leaderboard to a response model."""
        return LeaderboardResponse(leaderboard=self.entries)


class LeaderboardResponse(BaseModel):
    """Leaderboard response model."""

    leaderboard: list[LeaderboardEntry]


class Answer(BaseModel):
    """Submitted answer model."""

    participant_id: str
    question_index: int
    answer: str
    is_correct: bool
    points_earned: int
    response_time: int  # Milliseconds
    submitted_at: datetime
    # Validation metadata (for dataset collection)
    validation_method: ValidationMethod | None = None
    validation_confidence: float | None = Field(
        default=None, ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )
    matched_answer: str | None = None


class QuestionData(BaseModel):
    """Question data structure."""

    index: int
    type: QuestionType
    text: str
    options: list[str] | None = None  # For multiple choice
    time_limit: int  # Seconds
    points: int
    image_url: str | None = None
    validation_method: str | None = None  # "fuzzy", "semantic", or "hybrid"
    semantic_threshold: float | None = None  # 0-1 for semantic matching


class ValidationResult(BaseModel):
    """Result of answer validation with metadata."""

    is_correct: bool
    method_used: ValidationMethod
    confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )
    matched_answer: str | None = None


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
    time_limit: int  # Seconds
    question_index: int
    correct_answer: list[str]
    question_type: QuestionType
    max_points: int
    validation_method: str | None = None  # "fuzzy", "semantic", or "hybrid"
    semantic_threshold: float | None = None  # 0-1 for semantic matching
