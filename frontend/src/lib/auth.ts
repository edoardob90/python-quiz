/**
 * Authentication Helper
 *
 * Unified auth checking for both host and player roles.
 * Handles sessionStorage validation and modal display.
 */

import { getHostSecret, getParticipantId, getParticipantNickname } from "@lib/session-storage";

type HostAuthResult =
  | { type: "host"; authorized: true; hostSecret: string }
  | { type: "host"; authorized: false };

type PlayerAuthResult =
  | { type: "player"; authorized: true; participantId: string; nickname: string }
  | { type: "player"; authorized: false };

type AuthResult = HostAuthResult | PlayerAuthResult;

/**
 * Checks authorization for host or player role
 * @param roomId - The room ID to check authorization for
 * @param role - Either 'host' or 'player'
 * @returns AuthResult with authorization status and data
 */
export function checkAuth(roomId: string, role: "host"): HostAuthResult;
export function checkAuth(roomId: string, role: "player"): PlayerAuthResult;
export function checkAuth(roomId: string, role: "host" | "player"): AuthResult {
  if (role === "host") {
    const hostSecret = getHostSecret(roomId);

    if (!hostSecret) {
      console.error("No host secret found for this room");
      return { type: "host", authorized: false };
    }

    return { type: "host", authorized: true, hostSecret };
  } else {
    const participantId = getParticipantId(roomId);
    const nickname = getParticipantNickname(roomId);

    if (!participantId || !nickname) {
      console.error("No participant data found for this room");
      return { type: "player", authorized: false };
    }

    return { type: "player", authorized: true, participantId, nickname };
  }
}

/**
 * Shows the unauthorized modal
 * @param role - Either 'host' or 'player'
 */
export function showUnauthorizedModal(role: "host" | "player"): void {
  const modalId =
    role === "host" ? "no-secret-warning" : "no-participant-warning";
  const modal = document.getElementById(modalId);

  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex"); // Tailwind flex centering
  }
}

/**
 * Injects auth data into a component via data-attributes
 * @param containerId - The container element ID
 * @param attributeName - The data attribute name (without 'data-' prefix)
 * @param value - The value to inject
 */
export function injectAuthData(
  containerId: string,
  attributeName: string,
  value: string
): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container not found: ${containerId}`);
    return;
  }

  const element = container.querySelector(`[data-${attributeName}]`);
  if (!element) {
    console.error(`Element with data-${attributeName} not found in container`);
    return;
  }

  element.setAttribute(`data-${attributeName}`, value);
}
