/**
 * Timer Component - Alpine.js Logic
 *
 * Countdown timer with visual progress bar.
 */

export function timer({
  timeLimit = 30,
  currentQuestionIndex = 0,
  totalQuestions = 1,
} = {}) {
  return {
    timeLimit,
    timeLeft: timeLimit,
    interval: null as number | null,
    currentQuestionIndex,
    totalQuestions,
    showTimeUp: false,
    timeUpDuration: 2, // seconds to show the "Time's up" message
    timeUpTimeout: null as number | null, // store setTimeout ID for cleanup later
    waitingForNext: false,
    quizComplete: false,
    isStarted: false,

    init() {
      // Don't auto-start - wait for 'timer-start' event from QuizPlayer

      // Listen for timer start event from QuizPlayer
      window.addEventListener("timer-start", ((e: CustomEvent) => {
        const timeLimit = e.detail?.timeLimit || this.timeLimit;
        this.resetTimer(timeLimit);
      }) as EventListener);

      // Listen for timer stop event (when question changes)
      window.addEventListener("timer-stop", (() => {
        this.stopTimer();
      }) as EventListener);

      // Listen for question index update from QuizPlayer
      window.addEventListener("question-changed-index", ((e: CustomEvent) => {
        this.currentQuestionIndex = e.detail.currentQuestionIndex;
        this.totalQuestions = e.detail.totalQuestions;
      }) as EventListener);

      // Listen for quiz complete event
      window.addEventListener("quiz-complete", () => {
        this.isStarted = false;
        this.quizComplete = true;
      });
    },

    startTimer() {
      if (this.interval) clearInterval(this.interval);
      this.isStarted = true;

      this.interval = window.setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
          window.dispatchEvent(
            new CustomEvent("timer-update", {
              detail: { timeLeft: this.timeLeft },
            }),
          );
        } else {
          clearInterval(this.interval!);
          this.interval = null;
          this.isStarted = false;
          this.showTimeUp = true;
          // Dispatch timeout event
          window.dispatchEvent(new CustomEvent("timer-timeout"));
          // Transition from "Time's up" to "Waiting for next question"
          this.timeUpTimeout = window.setTimeout(() => {
            this.showTimeUp = false;
            this.waitingForNext = true;
          }, this.timeUpDuration * 1000);
        }
      }, 1000);
    },

    stopTimer() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      if (this.timeUpTimeout) {
        clearTimeout(this.timeUpTimeout);
      }

      this.isStarted = false;
      this.waitingForNext = false;
      this.showTimeUp = false;
    },

    resetTimer(newTimeLimit?: number) {
      this.stopTimer();
      if (newTimeLimit !== undefined) {
        this.timeLimit = newTimeLimit;
      }
      this.timeLeft = this.timeLimit;
      this.waitingForNext = false;
      this.showTimeUp = false;
      this.startTimer();
    },

    get percentage(): number {
      return this.timeLimit > 0 ? (this.timeLeft / this.timeLimit) * 100 : 0;
    },

    get isUrgent(): boolean {
      return this.timeLeft <= 10;
    },
  };
}
