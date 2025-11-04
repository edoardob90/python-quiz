/**
 * Quiz Player Component - Alpine.js Logic
 *
 * Handles question display, answer submission, and score feedback.
 */

import { QuizWebSocket } from "../websocket";

const BACKEND_API =
  import.meta.env.PUBLIC_BACKEND_API || "http://localhost:8000";

interface Question {
  index: number;
  type: "multiple-choice" | "short-answer";
  text: string;
  options?: string[];
  time_limit: number;
  points: number;
  correct_answer: string[];
}

interface AnswerResult {
  is_correct: boolean;
  points_earned: number;
  current_score: number;
  streak: number;
}

export function quizPlayer({ roomId = "", questions = [] as Question[] } = {}) {
  return {
    roomId,
    participantId: "", // Set via data attribute from sessionStorage
    questions,
    currentQuestionIndex: 0,
    currentQuestion: null as Question | null,
    selectedAnswer: "",
    hasAnswered: false,
    waitingForHost: true,
    quizComplete: false,
    result: null as AnswerResult | null,
    pendingResult: null as AnswerResult | null,
    startTime: Date.now(),
    ws: null as QuizWebSocket | null,
    hasTimedOut: false,
    correctAnswer: [] as string[],
    timeLeft: 0,
    $el: null as any, // Alpine.js magic property

    init() {
      // Read participantId from data attribute (client-side only)
      this.participantId = this.$el.dataset.participantId || "";

      // Set current question from questions array
      if (this.questions.length > 0) {
        this.currentQuestion = this.questions[this.currentQuestionIndex];
      }

      // Connect to WebSocket
      if (this.roomId) {
        this.ws = new QuizWebSocket(this.roomId);
        this.ws.connect();

        // Listen for question events
        this.ws.on("question_started", (data: any) => {
          console.log("Question started", data);
          // Update to the current question index from host
          if (data.question_index !== undefined) {
            this.currentQuestionIndex = data.question_index;
            this.currentQuestion = this.questions[this.currentQuestionIndex];
          }

          this.waitingForHost = false;
          this.resetAnswer();

          // Start timer with time_limit from backend
          const timeLimit =
            data.time_limit || this.currentQuestion?.time_limit || 30;
          window.dispatchEvent(
            new CustomEvent("timer-start", {
              detail: { timeLimit },
            }),
          );

          // Notify timer about the current question for display
          window.dispatchEvent(
            new CustomEvent("question-changed-index", {
              detail: {
                currentQuestionIndex: this.currentQuestionIndex,
                totalQuestions: this.questions.length,
              },
            }),
          );
        });

        this.ws.on("question_changed", (data: any) => {
          console.log("Question changed", data);
          // Update to the new question index
          if (data.question_index !== undefined) {
            this.currentQuestionIndex = data.question_index;
            this.currentQuestion = this.questions[this.currentQuestionIndex];
          }

          this.waitingForHost = true;
          this.resetAnswer();

          // Stop timer
          window.dispatchEvent(new CustomEvent("timer-stop"));

          // Notify timer about the current question for display
          window.dispatchEvent(
            new CustomEvent("question-changed-index", {
              detail: {
                currentQuestionIndex: this.currentQuestionIndex,
                totalQuestions: this.questions.length,
              },
            }),
          );
        });

        // Listen for question timeout event (reveals correct answer)
        this.ws.on("question_timeout", (data: any) => {
          console.log("Question timeout received");
          if (data.correct_answer) {
            this.correctAnswer = data.correct_answer;
            this.hasTimedOut = true;
          }
          // Reveal the correct answer now that time expired
          if (this.pendingResult) {
            this.result = this.pendingResult;
          }
        });

        // Listen for the quiz complete event
        this.ws.on("quiz_complete", () => {
          console.log("Quiz complete!");
          this.quizComplete = true;
          this.waitingForHost = false;
          window.dispatchEvent(new CustomEvent("quiz-complete"));
        });
      }

      // Listen for timer timeout
      window.addEventListener("timer-timeout", () => {
        if (!this.waitingForHost) {
          this.handleSubmit(true);
        }
      });

      // Listen for timer updates
      window.addEventListener("timer-update", (e: any) => {
        this.timeLeft = e.detail.timeLeft;
      });
    },

    resetAnswer() {
      this.hasAnswered = false;
      this.result = null;
      this.pendingResult = null;
      this.selectedAnswer = "";
      this.startTime = Date.now();
      this.hasTimedOut = false;
      this.correctAnswer = [];
    },

    async handleSubmit(isTimeout = false) {
      if (this.hasAnswered || !this.currentQuestion) return;

      const answer = isTimeout ? "" : this.selectedAnswer;
      const responseTime = Date.now() - this.startTime;

      try {
        const response = await fetch(
          `${BACKEND_API}/api/rooms/${this.roomId}/answer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participant_id: this.participantId,
              answer: answer,
              response_time: responseTime,
              time_limit: this.currentQuestion.time_limit,
              question_index: this.currentQuestion.index,
              correct_answer: this.currentQuestion.correct_answer,
              question_type: this.currentQuestion.type,
              max_points: this.currentQuestion.points,
            }),
          },
        );

        if (!response.ok) throw new Error("Failed to submit answer");

        const data = await response.json();
        this.pendingResult = data;
        if (!isTimeout) {
          this.hasAnswered = true;
        }
        console.log("Answer submitted successfully");
      } catch (error) {
        console.error("Error submitting answer:", error);
        alert("Failed to submit answer. Check console for details.");
      }
    },

    get canSubmit(): boolean {
      return (
        !(this.hasAnswered || this.hasTimedOut) &&
        this.selectedAnswer.length > 0
      );
    },

    get isMultipleChoice(): boolean {
      return this.currentQuestion?.type === "multiple-choice";
    },

    get isShortAnswer(): boolean {
      return this.currentQuestion?.type === "short-answer";
    },
  };
}
