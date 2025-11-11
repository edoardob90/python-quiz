/**
 * Alpine.js Helpers
 *
 * Type-safe helpers for Alpine.js event handling and custom events.
 */

// Extend the Window interface to include Alpine
declare global {
  interface Window {
    Alpine: {
      $data: (element: HTMLElement) => any;
    };
  }
}

/**
 * Custom event detail for question change events
 */
interface QuestionChangedEventDetail {
  questionIndex: number;
}

/**
 * Sets up a listener for question-changed custom events
 * @param coordinatorId - The ID of the coordinator element
 */
export function setupQuestionChangeListener(coordinatorId: string): void {
  document.addEventListener("alpine:initialized", () => {
    const coordinator = document.getElementById(coordinatorId);

    if (!coordinator) {
      console.error(`Coordinator element not found: ${coordinatorId}`);
      return;
    }

    // Listen for custom event emitted by QuizHost when currentQuestion changes
    window.addEventListener("question-changed", (event: Event) => {
      const customEvent = event as CustomEvent<QuestionChangedEventDetail>;
      const coordinatorData = window.Alpine.$data(coordinator) as any;

      if (coordinatorData) {
        coordinatorData.currentQuestion = customEvent.detail.questionIndex;
      }
    });
  });
}

/**
 * Updates debug info with truncated secret
 * @param elementId - The element ID to update
 * @param secret - The secret to display (will be truncated)
 */
export function updateDebugSecret(elementId: string, secret: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = secret.substring(0, 10) + "...";
  }
}
