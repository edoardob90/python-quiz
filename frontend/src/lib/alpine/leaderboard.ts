/**
 * Leaderboard Component - Alpine.js Logic
 *
 * Displays real-time leaderboard with polling and WebSocket updates.
 */

import { QuizWebSocket } from '../websocket';

const BACKEND_API = import.meta.env.PUBLIC_BACKEND_API || 'http://localhost:8000';

interface LeaderboardEntry {
  participant_id: string;
  nickname: string;
  score: number;
  streak: number;
  rank: number;
}

export function leaderboard({ roomId = '' } = {}) {
  return {
    roomId,
    leaderboard: [] as LeaderboardEntry[],
    pollInterval: null as number | null,
    ws: null as QuizWebSocket | null,

    init() {
      // Start polling immediately
      this.fetchLeaderboard();

      // Poll every 2 seconds as fallback
      this.pollInterval = window.setInterval(() => {
        this.fetchLeaderboard();
      }, 2000);

      // Connect to WebSocket for real-time updates
      if (this.roomId) {
        this.ws = new QuizWebSocket(this.roomId);
        this.ws.connect();

        this.ws.on('leaderboard_updated', (data: any) => {
          if (data.leaderboard) {
            this.leaderboard = data.leaderboard;
          }
        });
      }
    },

    async fetchLeaderboard() {
      if (!this.roomId) return;

      try {
        const response = await fetch(`${BACKEND_API}/api/leaderboard/${this.roomId}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');

        const data = await response.json();
        this.leaderboard = data.leaderboard || [];
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    },

    destroy() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      if (this.ws) {
        this.ws.disconnect();
        this.ws = null;
      }
    },

    getRankEmoji(rank: number): string {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return '🏅';
    },

    get isEmpty(): boolean {
      return this.leaderboard.length === 0;
    }
  };
}
