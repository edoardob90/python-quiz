/**
 * Alpine.js Entrypoint for Astro
 *
 * Registers all Alpine components globally so they can be used
 * with x-data="componentName()" syntax throughout the app.
 *
 * This file is loaded automatically by @astrojs/alpinejs integration.
 */

import type { Alpine } from 'alpinejs'

import { timer } from './timer';
import { leaderboard } from './leaderboard';
import { quizHost } from './quizHost';
import { quizPlayer } from './quizPlayer';

export default (Alpine: Alpine) => {
  // Register all components
  Alpine.data('timer', timer);
  Alpine.data('leaderboard', leaderboard);
  Alpine.data('quizHost', quizHost);
  Alpine.data('quizPlayer', quizPlayer);

  console.log('✅ Alpine components registered via entrypoint:', ['timer', 'leaderboard', 'quizHost', 'quizPlayer']);
}
