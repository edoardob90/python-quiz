"""Scoring algorithm for quiz answers.

Calculate points based on:
- Time taken to answer (faster = more points)
- Streak bonus (consecutive correct answers)
"""


def calculate_score(
    max_points: int,
    response_time: int,
    time_limit: int,
    streak: int
) -> int:
    """
    Calculate points for a correct answer.

    Time-based scoring: Faster answers get more points
    Streak bonus: Consecutive correct answers boost points

    Args:
        max_points: Maximum points for question (e.g., 1000)
        response_time: Time taken to answer in milliseconds
        time_limit: Question time limit in seconds
        streak: Number of consecutive correct answers

    Returns:
        Final points earned (int)

    Example:
        >>> calculate_score(1000, 5000, 30, 3)
        1083

        - Max points: 1000
        - Answer in 5s of 30s limit = 833 base points
        - With 3-answer streak = 833 * 1.3 = 1,083 points
    """
    # Convert time limit to milliseconds
    time_limit_ms = time_limit * 1000

    # Time bonus: 1.0 at instant answer, 0.5 at timeout
    time_ratio = response_time / time_limit_ms
    time_bonus = max(0.5, 1 - time_ratio)

    # Calculate base points
    base_points = int(max_points * time_bonus)

    # Streak multiplier: +10% per correct answer, max +50%
    streak_multiplier = 1 + min(0.5, streak * 0.1)

    # Final score
    final_points = int(base_points * streak_multiplier)

    return final_points
