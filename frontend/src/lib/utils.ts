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
