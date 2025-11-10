/**
 * Quiz Host Component - Alpine.js Logic
 *
 * Controls quiz flow, manages participants, and broadcasts updates.
 */

import { QuizWebSocket } from "../websocket";

const BACKEND_API =
  import.meta.env.PUBLIC_BACKEND_API || "http://localhost:8000";

interface QuestionData {
  index: number;
  type: string;
  options: string[];
  timeLimit: number;
  points: number;
  correctAnswer: string[];
}

interface Participant {
  id: string;
  nickname: string;
  joined_at: string;
}

export function quizHost({
  roomId = "",
  totalQuestions = 0,
  questionsData = [] as QuestionData[],
} = {}) {
  return {
    roomId,
    hostSecret: "", // Set via data attribute from sessionStorage
    totalQuestions,
    currentQuestion: 0,
    participants: [] as Participant[],
    questionStatus: "idle" as "idle" | "active" | "over" | "complete",
    ws: null as QuizWebSocket | null,
    questionsData,
    hostTimeLeft: 0,
    hostTimerInterval: null as number | null,
    $el: null as any, // Alpine.js magic property

    async init() {
      // Read hostSecret from data attribute (client-side only)
      this.hostSecret = this.$el.dataset.hostSecret || "";

      // Connect to WebSocket
      if (this.roomId) {
        this.ws = new QuizWebSocket(this.roomId);
        this.ws.connect();

        // Listen for participant joins
        this.ws.on("participant_joined", (data: any) => {
          console.log("Participant joined:", data);
          this.fetchRoomState();
        });

        // Listen for question timeout
        this.ws.on("question_timeout", (data: any) => {
          console.log("Question timeout received from backend", data);
          this.questionStatus = "over";

          // Stop host timer
          if (this.hostTimerInterval !== null) {
            clearInterval(this.hostTimerInterval);
            this.hostTimerInterval = null;
          }
          this.hostTimeLeft = 0;
        });

        // Listen for quiz complete
        this.ws.on("quiz_complete", () => {
          console.log("Quiz complete!");
          this.questionStatus = "complete";
        });
      }

      // Fetch initial room state
      await this.fetchRoomState();

      // Fallback: Listed for local timer timeout event
      window.addEventListener("timer-timeout", () => {
        if (this.questionStatus === "active") {
          console.log(
            "Timer expired (local fallback), marking question as 'over'",
          );
          this.questionStatus = "over";
        }
      });
    },

    async fetchRoomState() {
      if (!this.roomId) return;

      try {
        const response = await fetch(`${BACKEND_API}/api/rooms/${this.roomId}`);
        if (!response.ok) throw new Error("Failed to fetch room state");

        const data = await response.json();
        this.currentQuestion = data.current_question || 0;
        this.participants = (data.participants || []).sort(
          (a: Participant, b: Participant) => {
            return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
          },
        );
      } catch (error) {
        console.error("Error fetching room state:", error);
      }
    },

    async startQuestion(timeLimit: number) {
      if (!this.roomId || !this.hostSecret) {
        console.error("Missing roomId or hostSecret");
        return;
      }

      // Get current question data
      const currentQuestionData = this.questionsData[this.currentQuestion];
      if (!currentQuestionData) {
        console.error("No question data available for current question");
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_API}/api/rooms/${this.roomId}/start`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host_secret: this.hostSecret,
              time_limit: timeLimit,
              correct_answer: currentQuestionData.correctAnswer,
              question_index: this.currentQuestion,
            }),
          },
        );

        if (!response.ok) throw new Error("Failed to start question");

        this.questionStatus = "active";

        // Start host timer
        this.hostTimeLeft = currentQuestionData.timeLimit;
        this.hostTimerInterval = window.setInterval(() => {
          this.hostTimeLeft--;
          if (this.hostTimeLeft <= 0) {
            clearInterval(this.hostTimerInterval!);
            this.hostTimerInterval = null;
          }
        }, 1000);

        console.log(
          "Question started. Correct answer:",
          currentQuestionData.correctAnswer,
        );
      } catch (error) {
        console.error("Error starting question:", error);
        alert("Failed to start question. Check console for details.");
      }
    },

    async nextQuestion() {
      // Stop the host timer if running
      if (this.hostTimerInterval !== null) {
        clearInterval(this.hostTimerInterval);
        this.hostTimerInterval = null;
      }

      // Check room is valid and we have set a host secret
      if (!this.roomId || !this.hostSecret) {
        console.error("Missing roomId or hostSecret");
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_API}/api/rooms/${this.roomId}/next`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host_secret: this.hostSecret,
            }),
          },
        );

        if (!response.ok) throw new Error("Failed to advance question");

        const data = await response.json();
        if (data.status === "complete") {
          this.questionStatus = "complete";
          console.log("Quiz complete!");
        } else {
          this.currentQuestion = data.current_question || 0;
          this.questionStatus = "idle";
          console.log("Advanced to question", this.currentQuestion);
        }
      } catch (error) {
        console.error("Error advancing question:", error);
        alert("Failed to advance question. Check console for details.");
      }
    },

    get isFinalQuestion(): boolean {
      return this.currentQuestion >= this.totalQuestions - 1;
    },

    get participantCount(): number {
      return this.participants.length;
    },
  };
}
