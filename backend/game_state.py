"""Game state management utilities.

Helper functions for managing room state transitions and broadcasting.
"""

from datetime import datetime

from models import Room


def get_time_remaining(room: Room) -> int | None:
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
