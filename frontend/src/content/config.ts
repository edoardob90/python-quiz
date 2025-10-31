/**
 * Content Collections Configuration
 *
 * Defines collections for quiz questions.
 * Each quiz has its own collection (one folder = one quiz).
 */

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// A test collection
const testQuizCollection = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/test-quiz" }),
  schema: z.object({
    type: z.enum(["multiple-choice", "short-answer"]),
    timeLimit: z.number(), // seconds
    points: z.number(),
    correctAnswer: z.array(z.string()), // array for flexibility with short-answer
    options: z.array(z.string()).optional(), // only for multiple-choice
  }),
});

// Don't forget to export the collections object!
export const collections = {
  testQuiz: testQuizCollection,
};
