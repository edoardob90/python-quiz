"""Answer validation with fuzzy matching for short-answer questions."""

from rapidfuzz import fuzz

from models import QuestionType


def validate_answer(
    user_answer: str,
    correct_answers: list[str],
    question_type: QuestionType,
    ratio_threshold: float = 80.0,
) -> bool:
    """
    Validate user answer against correct answer(s).

    For multiple choice: exact match required
    For short answer: fuzzy matching (handles typos)

    Args:
        user_answer: The answer provided by the user
        correct_answers: List of acceptable correct answers
        question_type: "multiple-choice" or "short-answer"

    Returns:
        True if answer is correct, False otherwise

    Examples:
        >>> validate_answer("Paris", ["Paris", "paris"], "short-answer")
        True

        >>> validate_answer("Pari", ["Paris"], "short-answer")
        True  # 80% similarity due to fuzzy matching

        >>> validate_answer("Option A", ["Option A"], "multiple-choice")
        True
    """
    match question_type:
        case QuestionType.SHORT:
            for correct in correct_answers:
                similarity = fuzz.ratio(
                    user_answer, correct, processor=lambda s: s.strip().lower()
                )
                if similarity >= ratio_threshold:
                    return True
            return False

        case QuestionType.MULTI:
            return user_answer in correct_answers
