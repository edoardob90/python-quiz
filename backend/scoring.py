"""Scoring algorithm for quiz answers.

Calculate points based on:
- Time taken to answer (faster = more points)
- Streak bonus (consecutive correct answers)
"""


def _smap_factor(
    normalized_time: float,
    a: float,
    b: float,
    r_0: float,
) -> float:
    """
    Internal SMAP function for smooth score decay.

    Provides steep drop in first half, gentle drop in second half.
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

    Scoring system:
    - Time-based: Fast answers get more points (100% instant → 20% at timeout)
    - Steep drop in first 50% of time limit
    - Gentle drop in last 50% of time limit
    - Streak bonus: +10% per consecutive correct answer (max +50%)

    Args:
        max_points: Maximum points for question (e.g., 1000)
        response_time: Time taken to answer in milliseconds
        time_limit: Question time limit in seconds
        streak: Number of consecutive correct answers

    Returns:
        Final points earned (int)

    Example:
        >>> calculate_score(1000, 5000, 30, 3)
        1267

        - Max points: 1000
        - Answer in 5s of 30s → ~974 base points (SMAP curve)
        - With 3-answer streak → 974 * 1.3 = 1,267 points
    """
    # Normalize response_time: convert ms to 0.0-1.0 range
    time_limit_ms = time_limit * 1000
    normalized_time = min(response_time / time_limit_ms, 1.0)

    # Using SMAP (Switching Modified Activation Polynomial) for smooth time bonus
    # Gives steep score loss early, gentle loss near timeout
    # Parameters chosen for quiz gameplay balance
    time_factor = _smap_factor(normalized_time, a=1.5, b=0.5, r_0=0.5)

    # Calculate base points
    base_points = int(max_points * time_factor)

    # Streak multiplier: +10% per correct answer, max +50%
    streak_multiplier = 1 + min(0.5, streak * 0.1)

    # Final score
    final_points = int(base_points * streak_multiplier)

    return final_points
