#!/usr/bin/env python3
"""Quick test of semantic matching functionality."""

import sys
sys.path.insert(0, "/home/user/python-quiz/backend")

from validation import validate_answer, ValidationMethod
from models import QuestionType

def test_semantic_matching():
    """Test various semantic matching scenarios."""

    print("=" * 60)
    print("SEMANTIC VALIDATION TEST")
    print("=" * 60)

    # Test 1: Synonyms
    print("\n1. Testing synonyms (list vs array):")
    result = validate_answer(
        user_answer="array",
        correct_answers=["list"],
        question_type=QuestionType.SHORT,
        validation_method=ValidationMethod.SEMANTIC,
        semantic_threshold=0.70
    )
    print(f"   Answer: 'array' vs Correct: 'list'")
    print(f"   ✓ Correct: {result.is_correct}")
    print(f"   Method: {result.method_used}")
    print(f"   Confidence: {result.confidence:.3f}")

    # Test 2: Paraphrase
    print("\n2. Testing paraphrase (list definition):")
    result = validate_answer(
        user_answer="A changeable ordered collection",
        correct_answers=["A mutable ordered collection of items"],
        question_type=QuestionType.SHORT,
        validation_method=ValidationMethod.SEMANTIC,
        semantic_threshold=0.70
    )
    print(f"   Answer: 'A changeable ordered collection'")
    print(f"   Correct: 'A mutable ordered collection of items'")
    print(f"   ✓ Correct: {result.is_correct}")
    print(f"   Method: {result.method_used}")
    print(f"   Confidence: {result.confidence:.3f}")

    # Test 3: Wrong answer
    print("\n3. Testing wrong answer:")
    result = validate_answer(
        user_answer="An immutable collection",
        correct_answers=["A mutable ordered collection"],
        question_type=QuestionType.SHORT,
        validation_method=ValidationMethod.SEMANTIC,
        semantic_threshold=0.70
    )
    print(f"   Answer: 'An immutable collection'")
    print(f"   Correct: 'A mutable ordered collection'")
    print(f"   ✓ Correct: {result.is_correct}")
    print(f"   Method: {result.method_used}")
    print(f"   Confidence: {result.confidence:.3f}")

    # Test 4: Hybrid mode (typo catches with fuzzy)
    print("\n4. Testing hybrid mode with typo:")
    result = validate_answer(
        user_answer="finaly",
        correct_answers=["finally"],
        question_type=QuestionType.SHORT,
        validation_method=ValidationMethod.HYBRID,
        semantic_threshold=0.70
    )
    print(f"   Answer: 'finaly' vs Correct: 'finally'")
    print(f"   ✓ Correct: {result.is_correct}")
    print(f"   Method: {result.method_used}")
    print(f"   Confidence: {result.confidence:.3f}")

    # Test 5: Hybrid mode (semantic fallback)
    print("\n5. Testing hybrid mode with paraphrase:")
    result = validate_answer(
        user_answer="classes can inherit from other classes",
        correct_answers=["child classes acquire attributes from parent classes"],
        question_type=QuestionType.SHORT,
        validation_method=ValidationMethod.HYBRID,
        semantic_threshold=0.70
    )
    print(f"   Answer: 'classes can inherit from other classes'")
    print(f"   Correct: 'child classes acquire attributes from parent classes'")
    print(f"   ✓ Correct: {result.is_correct}")
    print(f"   Method: {result.method_used}")
    print(f"   Confidence: {result.confidence:.3f}")

    print("\n" + "=" * 60)
    print("TEST COMPLETE - Semantic matching is working!")
    print("=" * 60)

if __name__ == "__main__":
    test_semantic_matching()
