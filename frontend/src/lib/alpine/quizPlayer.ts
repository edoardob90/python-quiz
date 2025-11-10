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
    currentQuestion: 0, // Index of current question (renamed from currentQuestionIndex for consistency)
    currentQuestionData: null as Question | null, // The actual question object
    selectedAnswer: "",
    hasAnswered: false,
    waitingForHost: true,
    quizComplete: false,
    result: null as AnswerResult | null,
    pendingResult: null as AnswerResult | null,
    pendingTimeoutData: null as any, // Store backend timeout until timer reaches 0
    startTime: Date.now(),
    ws: null as QuizWebSocket | null,
    hasTimedOut: false,
    correctAnswer: [] as string[],
    timeLeft: 0,
    focusedOptionIndex: 0, // Tracks keyboard-navigated option
    keydownHandler: null as ((e: KeyboardEvent) => void) | null, // Store handler for cleanup
    $el: null as any, // Alpine.js magic property

    init() {
      // Read participantId from data attribute (client-side only)
      this.participantId = this.$el.dataset.participantId || "";

      // Set current question from questions array
      if (this.questions.length > 0) {
        this.currentQuestionData = this.questions[this.currentQuestion];
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
            this.currentQuestion = data.question_index;
            this.currentQuestionData = this.questions[this.currentQuestion];
          }

          this.waitingForHost = false;
          this.resetAnswer();

          // Start timer with time_limit from backend
          const timeLimit =
            data.time_limit || this.currentQuestionData?.time_limit || 30;
          window.dispatchEvent(
            new CustomEvent("timer-start", {
              detail: { timeLimit },
            }),
          );

          // Notify timer about the current question for display
          window.dispatchEvent(
            new CustomEvent("question-changed-index", {
              detail: {
                currentQuestionIndex: this.currentQuestion,
                totalQuestions: this.questions.length,
              },
            }),
          );
        });

        this.ws.on("question_changed", (data: any) => {
          console.log("Question changed", data);
          // Update to the new question index
          if (data.question_index !== undefined) {
            this.currentQuestion = data.question_index;
            this.currentQuestionData = this.questions[this.currentQuestion];
          }

          this.waitingForHost = true;
          this.resetAnswer();

          // Stop timer
          window.dispatchEvent(new CustomEvent("timer-stop"));

          // Notify timer about the current question for display
          window.dispatchEvent(
            new CustomEvent("question-changed-index", {
              detail: {
                currentQuestionIndex: this.currentQuestion,
                totalQuestions: this.questions.length,
              },
            }),
          );
        });

        // Listen for question timeout event (reveals correct answer)
        this.ws.on("question_timeout", (data: any) => {
          console.log("Question timeout received from backend");

          // Store timeout data but don't reveal yet
          this.pendingTimeoutData = data;

          // If timer already reached 0, process immediately
          if (this.timeLeft === 0) {
            this.processTimeout();
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

      // Listen for timer reaching zero
      window.addEventListener("timer-reached-zero", () => {
        // Auto-submit if not answered
        if (!this.waitingForHost && !this.hasAnswered) {
          this.handleSubmit(true);
        }

        // If backend timeout already arrived, process it now
        if (this.pendingTimeoutData) {
          this.processTimeout();
        }
        // Otherwise, wait for backend event to arrive
      });

      // Listen for timer updates
      window.addEventListener("timer-update", (e: any) => {
        this.timeLeft = e.detail.timeLeft;
      });

      // Create keyboard handler for cleanup
      this.keydownHandler = (e: KeyboardEvent) => {
        if (e.key === "Enter" && this.canSubmit) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.handleSubmit(false);
          return;
        }

        // Listen for arrow keys to navigate multiple-choice options
        if (
          this.isMultipleChoice &&
          !this.hasAnswered &&
          !this.waitingForHost &&
          this.currentQuestionData?.options
        ) {
          const optionsCount = this.currentQuestionData.options.length;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            e.stopImmediatePropagation();
            // Circular navigation: wrap to first when at last
            this.focusedOptionIndex =
              (this.focusedOptionIndex + 1) % optionsCount;
            this.selectedAnswer =
              this.currentQuestionData.options[this.focusedOptionIndex];
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            e.stopImmediatePropagation();
            // Circular navigation: wrap to last when at first
            this.focusedOptionIndex =
              (this.focusedOptionIndex - 1 + optionsCount) % optionsCount;
            this.selectedAnswer =
              this.currentQuestionData.options[this.focusedOptionIndex];
          }
        }
      };

      // Listen for Enter key to submit and arrow keys to navigate
      window.addEventListener("keydown", this.keydownHandler);
    },

    processTimeout() {
      if (!this.pendingTimeoutData) return;

      console.log("Processing timeout - revealing answer");

      // Show "Time's up!" message
      window.dispatchEvent(new CustomEvent("show-time-up"));

      // Reveal correct answer
      if (this.pendingTimeoutData.correct_answer) {
        this.correctAnswer = this.pendingTimeoutData.correct_answer;
        this.hasTimedOut = true;
      }

      // Reveal pending result if exists
      if (this.pendingResult) {
        this.result = this.pendingResult;
      }

      // Clear pending timeout data
      this.pendingTimeoutData = null;
    },

    resetAnswer() {
      this.hasAnswered = false;
      this.result = null;
      this.pendingResult = null;
      this.pendingTimeoutData = null;
      this.selectedAnswer = "";
      this.startTime = Date.now();
      this.hasTimedOut = false;
      this.correctAnswer = [];
      this.focusedOptionIndex = 0;
    },

    async handleSubmit(isTimeout = false) {
      if (this.hasAnswered || !this.currentQuestionData) return;

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
              time_limit: this.currentQuestionData.time_limit,
              question_index: this.currentQuestionData.index,
              correct_answer: this.currentQuestionData.correct_answer,
              question_type: this.currentQuestionData.type,
              max_points: this.currentQuestionData.points,
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
      return this.currentQuestionData?.type === "multiple-choice";
    },

    get isShortAnswer(): boolean {
      return this.currentQuestionData?.type === "short-answer";
    },

    destroy() {
      // Cleanup event listeners to prevent memory leaks
      if (this.keydownHandler) {
        window.removeEventListener("keydown", this.keydownHandler);
      }
      // Disconnect WebSocket
      if (this.ws) {
        this.ws.disconnect();
      }
    },
  };
}
