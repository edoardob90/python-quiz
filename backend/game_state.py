"""Game state management utilities.

Helper functions for managing room state transitions and broadcasting.
"""

from datetime import datetime, timedelta
from typing import Optional
from models import Room


def start_question_timer(room: Room, time_limit: int) -> Room:
    """
    Start the timer for the current question.

    Args:
        room: The room to update
        time_limit: Question time limit in seconds

    Returns:
        Updated room with timer started
    """
    now = datetime.now()
    room.question_started_at = now
    room.question_ends_at = now + timedelta(seconds=time_limit)
    room.status = "active"
    return room


def advance_to_next_question(room: Room) -> Room:
    """
    Move to the next question in the quiz.

    Args:
        room: The room to update

    Returns:
        Updated room with incremented question index
    """
    room.current_question += 1
    room.question_started_at = None
    room.question_ends_at = None
    room.status = "waiting"
    return room


def finish_quiz(room: Room) -> Room:
    """
    Mark the quiz as finished.

    Args:
        room: The room to update

    Returns:
        Updated room marked as finished
    """
    room.status = "finished"
    room.question_started_at = None
    room.question_ends_at = None
    return room


def get_time_remaining(room: Room) -> Optional[int]:
    """
    Get remaining time for current question in seconds.

    Args:
        room: The room to check

    Returns:
        Seconds remaining, or None if timer not started
    """
    if not room.question_ends_at:
        return None

    now = datetime.now()
    remaining = (room.question_ends_at - now).total_seconds()

    return max(0, int(remaining))
