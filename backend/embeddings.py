"""Embedding service for semantic similarity matching."""

import logging
import os
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating text embeddings and computing semantic similarity.

    Uses sentence-transformers (all-MiniLM-L6-v2) to encode text into
    384-dimensional vectors and compute cosine similarity.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service.

        Args:
            model_name: Name of the sentence-transformers model to use
        """
        self.model_name = model_name
        self._model = None
        logger.info(f"EmbeddingService initialized with model: {model_name}")

    @property
    def model(self) -> SentenceTransformer:
        """
        Lazy-load the model on first use.

        Returns:
            SentenceTransformer: The loaded model
        """
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}...")
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def encode(self, text: str) -> np.ndarray:
        """
        Encode text into an embedding vector.

        Args:
            text: Input text to encode

        Returns:
            numpy array of shape (384,) containing the embedding
        """
        # Normalize: strip whitespace and lowercase for consistency
        normalized = text.strip().lower()
        embedding = self.model.encode(normalized, convert_to_numpy=True)
        return embedding

    def cosine_similarity(
        self, embedding1: np.ndarray, embedding2: np.ndarray
    ) -> float:
        """
        Compute cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score between 0 and 1 (1 = identical meaning)
        """
        # Cosine similarity formula: dot(a, b) / (norm(a) * norm(b))
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)
        # Clamp to [0, 1] range (should already be in this range, but just in case)
        return float(max(0.0, min(1.0, similarity)))

    def similarity(self, text1: str, text2: str) -> float:
        """
        Compute semantic similarity between two text strings.

        Args:
            text1: First text string
            text2: Second text string

        Returns:
            Similarity score between 0 and 1
        """
        emb1 = self.encode(text1)
        emb2 = self.encode(text2)
        return self.cosine_similarity(emb1, emb2)

    def batch_similarity(self, text: str, candidates: list[str]) -> list[float]:
        """
        Compute similarity between one text and multiple candidates.

        Args:
            text: Input text to compare
            candidates: List of candidate texts

        Returns:
            List of similarity scores (one per candidate)
        """
        text_emb = self.encode(text)
        return [
            self.cosine_similarity(text_emb, self.encode(candidate))
            for candidate in candidates
        ]


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService | None:
    """
    Get or create the global embedding service instance.

    Uses LRU cache to ensure singleton pattern (only one instance).

    Returns:
        EmbeddingService: The global embedding service or None if not required
    """
    mode = os.getenv("VALIDATION_METHOD", "hybrid")
    if mode not in ["hybrid", "semantic"]:
        logger.info(f"Semantic validation disabled (VALIDATION_MODE={mode})")
        return None

    logger.info("Initializing embedding service singleton")
    return EmbeddingService()
