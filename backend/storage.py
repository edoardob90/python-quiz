"""In-memory storage for quiz sessions.

No database needed - everything stored in Python dictionaries.
Data is ephemeral and exists only during server runtime.
"""

from models import Answer, Participant, Room

# Simple Python dictionaries - that's it!
rooms: dict[str, Room] = {}
participants: dict[str, Participant] = {}
answers: dict[str, list[Answer]] = {}  # Key is room_id
active_question_answers: dict[str, list[str]] = {}

# Note: Rooms auto-expire after 2 hours of inactivity
# (cleanup task should be implemented in main.py)
