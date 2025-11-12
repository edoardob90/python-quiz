"""Answer validation with fuzzy matching and semantic similarity for short-answer questions."""

import logging
from enum import Enum

from rapidfuzz import fuzz

from models import QuestionType

logger = logging.getLogger(__name__)


class ValidationMethod(Enum):
    """Validation methods for answer checking."""

    FUZZY = "fuzzy"  # String similarity (rapidfuzz)
    SEMANTIC = "semantic"  # Meaning similarity (embeddings)
    HYBRID = "hybrid"  # Try fuzzy first, then semantic


class ValidationResult:
    """Result of answer validation with metadata."""

    def __init__(
        self,
        is_correct: bool,
        method_used: str,
        confidence: float,
        matched_answer: str | None = None,
    ):
        self.is_correct = is_correct
        self.method_used = method_used
        self.confidence = confidence
        self.matched_answer = matched_answer

    def to_dict(self) -> dict:
        """Convert to dictionary for logging/response."""
        return {
            "is_correct": self.is_correct,
            "method_used": self.method_used,
            "confidence": self.confidence,
            "matched_answer": self.matched_answer,
        }


def _fuzzy_match(
    user_answer: str, correct_answers: list[str], threshold: float
) -> ValidationResult:
    """
    Check answer using fuzzy string matching.

    Args:
        user_answer: User's submitted answer
        correct_answers: List of acceptable answers
        threshold: Minimum similarity score (0-100)

    Returns:
        ValidationResult with match details
    """
    best_score = 0.0
    best_match = None

    for correct in correct_answers:
        similarity = fuzz.ratio(
            user_answer, correct, processor=lambda s: s.strip().lower()
        )
        if similarity > best_score:
            best_score = similarity
            best_match = correct

    is_correct = best_score >= threshold
    return ValidationResult(
        is_correct=is_correct,
        method_used="fuzzy",
        confidence=best_score / 100.0,  # Normalize to 0-1
        matched_answer=best_match if is_correct else None,
    )


def _semantic_match(
    user_answer: str, correct_answers: list[str], threshold: float
) -> ValidationResult:
    """
    Check answer using semantic similarity (embeddings).

    Args:
        user_answer: User's submitted answer
        correct_answers: List of acceptable answers
        threshold: Minimum similarity score (0-1)

    Returns:
        ValidationResult with match details
    """
    try:
        from embeddings import embedding_service

        # Compute similarity with each correct answer
        similarities = embedding_service.batch_similarity(user_answer, correct_answers)

        # Find best match
        best_idx = max(range(len(similarities)), key=lambda i: similarities[i])
        best_score = similarities[best_idx]
        best_match = correct_answers[best_idx]

        is_correct = best_score >= threshold

        logger.debug(
            f"Semantic match: '{user_answer}' vs '{best_match}' = {best_score:.3f}"
        )

        return ValidationResult(
            is_correct=is_correct,
            method_used="semantic",
            confidence=best_score,
            matched_answer=best_match if is_correct else None,
        )

    except Exception as e:
        logger.error(f"Semantic matching failed: {e}")
        # Fallback to fuzzy if embeddings fail
        logger.warning("Falling back to fuzzy matching")
        return _fuzzy_match(user_answer, correct_answers, threshold * 100)


def validate_answer(
    user_answer: str,
    correct_answers: list[str],
    question_type: QuestionType,
    validation_method: ValidationMethod = ValidationMethod.HYBRID,
    fuzzy_threshold: float = 80.0,
    semantic_threshold: float = 0.75,
) -> ValidationResult:
    """
    Validate user answer against correct answer(s).

    For multiple choice: exact match required
    For short answer: configurable validation (fuzzy, semantic, or hybrid)

    Args:
        user_answer: The answer provided by the user
        correct_answers: List of acceptable correct answers
        question_type: "multiple-choice" or "short-answer"
        validation_method: Method to use for validation
        fuzzy_threshold: Minimum similarity for fuzzy matching (0-100)
        semantic_threshold: Minimum similarity for semantic matching (0-1)

    Returns:
        ValidationResult with is_correct flag and metadata

    Examples:
        >>> result = validate_answer("Paris", ["Paris"], "short-answer")
        >>> result.is_correct
        True

        >>> result = validate_answer("Pari", ["Paris"], "short-answer")
        >>> result.is_correct  # Fuzzy match
        True

        >>> result = validate_answer("list", ["array"], "short-answer", validation_method=ValidationMethod.SEMANTIC)
        >>> result.is_correct  # Semantic match (synonyms)
        True
    """
    # Multiple choice always uses exact match
    if question_type == QuestionType.MULTI:
        is_correct = user_answer in correct_answers
        return ValidationResult(
            is_correct=is_correct,
            method_used="exact",
            confidence=1.0 if is_correct else 0.0,
            matched_answer=user_answer if is_correct else None,
        )

    # Short answer: use specified validation method
    match validation_method:
        case ValidationMethod.FUZZY:
            return _fuzzy_match(user_answer, correct_answers, fuzzy_threshold)

        case ValidationMethod.SEMANTIC:
            return _semantic_match(user_answer, correct_answers, semantic_threshold)

        case ValidationMethod.HYBRID:
            # Try fuzzy first (faster)
            fuzzy_result = _fuzzy_match(user_answer, correct_answers, fuzzy_threshold)
            if fuzzy_result.is_correct:
                return fuzzy_result

            # If fuzzy fails, try semantic
            semantic_result = _semantic_match(
                user_answer, correct_answers, semantic_threshold
            )
            if semantic_result.is_correct:
                return semantic_result

            # Return whichever had higher confidence
            if semantic_result.confidence > fuzzy_result.confidence:
                return semantic_result
            return fuzzy_result

        case _:
            logger.warning(f"Unknown validation method: {validation_method}")
            return _fuzzy_match(user_answer, correct_answers, fuzzy_threshold)
