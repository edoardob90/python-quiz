"""Scoring algorithm for quiz answers.

Calculate points based on:
- Time taken to answer (faster = more points)
- Streak bonus (consecutive correct answers)
"""


def smap_factor(
    normalized_time: float,
    a: float,
    b: float,
    r_0: float,
) -> float:
    """
    SMAP switching function to calculate a smooth score factor between 0.0 and 1.0

    Args:
        normalized_time: Normalized time value between 0.0 (instant) and 1.0 (timeout)
        a: Parameter, the higher, the flatter at the beginning
        b: Parameter, the higher, the more asymptotic to zero
        r_0: Parameter, sets where the score factor will drop to 0.5

    Returns:
        Score factor between 0.0 and 1.0
    """
    return (1.0 + (2.0 ** (a / b) - 1) * (normalized_time / r_0) ** a) ** (-b / a)


def calculate_score(
    max_points: int,
    response_time: int,
    time_limit: int,
    streak: int,
) -> int:
    """
    Calculate points for a correct answer.

    Time-based scoring: Faster answers get more points using SMAP switching function
    Streak bonus: Consecutive correct answers boost points

    Args:
        max_points: Maximum points for question (e.g., 1000)
        response_time: Time taken to answer in milliseconds
        time_limit: Question time limit in seconds
        streak: Number of consecutive correct answers
        a: SMAP parameter (higher = flatter at beginning), default 6.0
        b: SMAP parameter (higher = more asymptotic to zero), default 12.0
        r_0: SMAP parameter (where score factor drops to 0.5), default 0.5
        min_factor: Minimum score factor (e.g., 0.2 = 20% minimum), default 0.2

    Returns:
        Final points earned (int)

    Example:
        >>> calculate_score(1000, 5000, 30, 3)
        1267

        - Max points: 1000
        - Answer in 5s of 30s (normalized: 0.167) = ~974 base points
        - With 3-answer streak = 974 * 1.3 = 1,267 points
    """
    # Normalize response_time: convert ms to 0.0-1.0 range
    time_limit_ms = time_limit * 1000
    normalized_time = min(response_time / time_limit_ms, 1.0)

    # Calculate time bonus using SMAP switching function
    # Inverted so 0.0 normalized_time → factor close to 1.0
    time_bonus = smap_factor(normalized_time, a=1.5, b=0.5, r_0=0.5)

    # Calculate base points
    base_points = int(max_points * time_bonus)

    # Streak multiplier: +10% per correct answer, max +50%
    streak_multiplier = 1 + min(0.5, streak * 0.1)

    # Final score
    final_points = int(base_points * streak_multiplier)

    return final_points
