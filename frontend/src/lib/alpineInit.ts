/**
 * Alpine.js Component Registration
 *
 * Registers all Alpine components globally so they can be used
 * with x-data="componentName()" syntax throughout the app.
 */

import type { Alpine } from "alpinejs";
import { timer } from "./alpine/timer";
import { leaderboard } from "./alpine/leaderboard";
import { quizHost } from "./alpine/quizHost";
import { quizPlayer } from "./alpine/quizPlayer";

export default (Alpine: Alpine) => {
  Alpine.data("timer", timer);
  Alpine.data("leaderboard", leaderboard);
  Alpine.data("quizHost", quizHost);
  Alpine.data("quizPlayer", quizPlayer);

  console.log("✅ Alpine components registered:", [
    "timer",
    "leaderboard",
    "quizHost",
    "quizPlayer",
  ]);
};
