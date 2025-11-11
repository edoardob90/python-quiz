/**
 * Utility functions for quiz hosting and playing
 */

import type { CollectionEntry } from "astro:content";

// Helper function to get or build a human-readable quiz name
export const getQuizName = (
  quizId: string,
  questions: CollectionEntry<"quiz">[],
) => {
  const firstQuestion = questions.find((q) => q.id.startsWith(`${quizId}/`));
  return firstQuestion?.data.quizName
    ? firstQuestion.data.quizName
    : quizId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
};

/**
 * Fisher-Yates shuffle algorithm.
 * Randomly shuffle an array in place
 * @param array - The array to shuffle
 * @returns The shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
