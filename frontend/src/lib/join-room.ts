/**
 * Join Room Module
 *
 * Handles joining a quiz room as a participant.
 * Manages form submission, validation, and sessionStorage.
 */

import { setParticipantId, setParticipantNickname, setQuizId } from "@lib/session-storage";

interface JoinRoomResponse {
  participant_id: string;
  quiz_id: string;
  room_id: string;
}

interface JoinRoomOptions {
  roomCode: string;
  nickname: string;
}

interface JoinRoomResult {
  success: boolean;
  error?: string;
}

/**
 * Joins a quiz room as a participant
 * @param options - Room code and nickname
 * @returns Result object with success status and optional error message
 */
export async function joinRoom(options: JoinRoomOptions): Promise<JoinRoomResult> {
  const { roomCode, nickname } = options;
  const BACKEND_API = import.meta.env.PUBLIC_BACKEND_API || "http://localhost:8000";

  try {
    console.log(`Joining room: ${roomCode} as ${nickname}`);

    // Call backend API to join room
    const response = await fetch(`${BACKEND_API}/api/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Room "${roomCode}" not found. Check the code with your host.`,
        };
      }
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to join room: ${errorText}`,
      };
    }

    const data: JoinRoomResponse = await response.json();
    console.log("Joined room:", data);

    // Store participant data in sessionStorage
    setParticipantId(roomCode, data.participant_id);
    setParticipantNickname(roomCode, nickname);
    setQuizId(roomCode, data.quiz_id);

    // Redirect to play page
    console.log(`Redirecting to /room/${roomCode}/play (${data.quiz_id})`);
    window.location.href = `/room/${roomCode}/play?quiz=${data.quiz_id}`;

    return { success: true };
  } catch (error) {
    console.error("Failed to join room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Validates form input before submitting
 * @param roomCode - The room code to validate
 * @param nickname - The nickname to validate
 * @returns Error message if validation fails, null if valid
 */
export function validateJoinForm(roomCode: string, nickname: string): string | null {
  if (!roomCode || !nickname) {
    return "Please fill in all fields";
  }

  if (roomCode.length < 4) {
    return "Room code must be at least 4 characters";
  }

  if (nickname.length < 2) {
    return "Nickname must be at least 2 characters";
  }

  if (nickname.length > 20) {
    return "Nickname must be at most 20 characters";
  }

  return null;
}

/**
 * Shows or hides the loading state
 */
export function setLoadingState(isLoading: boolean): void {
  const loading = document.getElementById("loading");
  const submitButton = document.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  );

  if (loading) {
    if (isLoading) {
      loading.classList.remove("hidden");
    } else {
      loading.classList.add("hidden");
    }
  }

  if (submitButton) {
    submitButton.disabled = isLoading;
  }
}

/**
 * Shows an error message to the user
 */
export function showError(message: string): void {
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.classList.remove("hidden");
    const p = errorMessage.querySelector("p");
    if (p) {
      p.textContent = message;
    }
  }
}

/**
 * Hides the error message
 */
export function hideError(): void {
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.classList.add("hidden");
  }
}
