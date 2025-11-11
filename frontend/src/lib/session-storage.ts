/**
 * Session Storage Utility
 *
 * Type-safe sessionStorage access for quiz-related data.
 * All keys are namespaced by room ID to prevent conflicts.
 */

export interface SessionData {
  hostSecret?: string;
  participantId?: string;
  participantNickname?: string;
  quizId?: string;
}

/**
 * Gets the host secret for a given room
 */
export function getHostSecret(roomId: string): string | null {
  return sessionStorage.getItem(`host_secret_${roomId}`);
}

/**
 * Sets the host secret for a given room
 */
export function setHostSecret(roomId: string, secret: string): void {
  sessionStorage.setItem(`host_secret_${roomId}`, secret);
}

/**
 * Gets the participant ID for a given room
 */
export function getParticipantId(roomId: string): string | null {
  return sessionStorage.getItem(`participant_id_${roomId}`);
}

/**
 * Sets the participant ID for a given room
 */
export function setParticipantId(roomId: string, participantId: string): void {
  sessionStorage.setItem(`participant_id_${roomId}`, participantId);
}

/**
 * Gets the participant nickname for a given room
 */
export function getParticipantNickname(roomId: string): string | null {
  return sessionStorage.getItem(`participant_nickname_${roomId}`);
}

/**
 * Sets the participant nickname for a given room
 */
export function setParticipantNickname(roomId: string, nickname: string): void {
  sessionStorage.setItem(`participant_nickname_${roomId}`, nickname);
}

/**
 * Gets the quiz ID for a given room
 */
export function getQuizId(roomId: string): string | null {
  return sessionStorage.getItem(`quiz_id_${roomId}`);
}

/**
 * Sets the quiz ID for a given room
 */
export function setQuizId(roomId: string, quizId: string): void {
  sessionStorage.setItem(`quiz_id_${roomId}`, quizId);
}

/**
 * Gets all session data for a given room
 */
export function getSessionData(roomId: string): SessionData {
  return {
    hostSecret: getHostSecret(roomId) ?? undefined,
    participantId: getParticipantId(roomId) ?? undefined,
    participantNickname: getParticipantNickname(roomId) ?? undefined,
    quizId: getQuizId(roomId) ?? undefined,
  };
}

/**
 * Clears all session data for a given room
 */
export function clearSessionData(roomId: string): void {
  sessionStorage.removeItem(`host_secret_${roomId}`);
  sessionStorage.removeItem(`participant_id_${roomId}`);
  sessionStorage.removeItem(`participant_nickname_${roomId}`);
  sessionStorage.removeItem(`quiz_id_${roomId}`);
}
