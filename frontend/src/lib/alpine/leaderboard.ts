/**
 * Leaderboard Component - Alpine.js Logic
 *
 * Displays real-time leaderboard with polling and WebSocket updates.
 */

import { QuizWebSocket } from "../websocket";

const BACKEND_API =
  import.meta.env.PUBLIC_BACKEND_API || "http://localhost:8000";

interface LeaderboardEntry {
  participant_id: string;
  nickname: string;
  score: number;
  streak: number;
  rank: number;
}

export function leaderboard({ roomId = "" } = {}) {
  return {
    roomId,
    leaderboard: [] as LeaderboardEntry[],
    pollInterval: null as number | null,
    ws: null as QuizWebSocket | null,

    init() {
      // Fetch initial leaderboard data
      this.fetchLeaderboard();

      // Connect to WebSocket for real-time updates
      if (this.roomId) {
        this.ws = new QuizWebSocket(this.roomId);
        this.ws.connect();

        this.ws.on("leaderboard_updated", (data: any) => {
          if (data.leaderboard) {
            this.leaderboard = data.leaderboard;
          }
        });
      }
    },

    async fetchLeaderboard() {
      if (!this.roomId) return;

      try {
        const response = await fetch(
          `${BACKEND_API}/api/leaderboard/${this.roomId}`,
        );
        if (!response.ok) throw new Error("Failed to fetch leaderboard");

        const data = await response.json();
        this.leaderboard = data.leaderboard || [];
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    },

    destroy() {
      if (this.ws) {
        this.ws.disconnect();
        this.ws = null;
      }
    },

    getRankEmoji(rank: number): string {
      // No scores yet
      if (!this.hasAnyScore) {
        return "🐍";
      }

      // With scores: show medals or default
      if (rank === 1) return "🥇";
      if (rank === 2) return "🥈";
      if (rank === 3) return "🥉";
      return "🐍";
    },

    get isEmpty(): boolean {
      return this.leaderboard.length === 0;
    },

    get hasAnyScore(): boolean {
      return this.leaderboard.some((participant) => participant.score > 0);
    },
  };
}
