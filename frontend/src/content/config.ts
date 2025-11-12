/**
 * Content Collections Configuration
 *
 * Single nested collection for all quizzes.
 * Structure: quiz/{quiz-name}/question-XX.md
 */

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const quizCollection = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "!**/_*.md"],
    base: "./src/content/quiz",
  }),
  schema: z.object({
    type: z.enum(["multiple-choice", "short-answer"]),
    timeLimit: z.number(), // seconds
    points: z.number(),
    correctAnswer: z.array(z.string()), // array for flexibility with short-answer
    options: z.array(z.string()).optional(), // only for multiple-choice
    quizName: z.string().optional(), // a human-readable name of a quiz
    validationMethod: z.enum(["fuzzy", "semantic", "hybrid"]).optional(), // validation method for short-answer
    semanticThreshold: z.number().min(0).max(1).optional(), // threshold for semantic matching (0-1)
  }),
});

export const collections = {
  quiz: quizCollection,
};
