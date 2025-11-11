/**
 * Room Creation Module
 *
 * Handles creating a new quiz room via the backend API
 * and managing sessionStorage for host authentication.
 */

import { setHostSecret, setQuizId } from "./session-storage";

interface CreateRoomResponse {
  room_id: string;
  host_secret: string;
}

interface CreateRoomOptions {
  quizId: string;
  totalQuestions: number;
  onError?: (error: Error) => void;
}

/**
 * Creates a new quiz room and stores auth data in sessionStorage
 * @param options - Configuration for room creation
 */
export async function createRoom(options: CreateRoomOptions): Promise<void> {
  const { quizId, totalQuestions, onError } = options;
  const BACKEND_API = import.meta.env.PUBLIC_BACKEND_API || "http://localhost:8000";

  try {
    console.log(`Creating room for quiz: ${quizId}`);
    console.log(`Backend API: ${BACKEND_API}`);

    // Call backend API to create a room
    const response = await fetch(
      `${BACKEND_API}/api/rooms/create?quiz_id=${quizId}&total_questions=${totalQuestions}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data: CreateRoomResponse = await response.json();
    console.log("Room created:", data);

    // Store the host secret in sessionStorage so the host page can use it
    setHostSecret(data.room_id, data.host_secret);

    // Store the quizId in sessionStorage so that host and player's page can access it
    setQuizId(data.room_id, quizId);

    // Redirect to the room page with the quizId query parameter
    console.log(`Redirecting to /room/${data.room_id}/host (${quizId})`);
    window.location.href = `/room/${data.room_id}/host?quiz=${quizId}`;
  } catch (error) {
    console.error("Failed to create room:", error);

    if (onError && error instanceof Error) {
      onError(error);
    }
  }
}

/**
 * Shows the error UI when room creation fails
 * @param errorMessage - The error message to display
 */
export function showError(errorMessage: string): void {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const errorMessageEl = document.getElementById("error-message");

  if (loadingEl) loadingEl.classList.add("hidden");
  if (errorEl) errorEl.classList.remove("hidden");
  if (errorMessageEl) errorMessageEl.textContent = errorMessage;
}
