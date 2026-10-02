import { changeTurn } from "./service.js";

const turnTimers = new Map<string, NodeJS.Timeout>();

export function startTurnTimer(roomId: string, duration: number) {
  clearTurnTimer(roomId);

  if (duration <= 0) {
    return;
  }

  const timeout = setTimeout(async () => {
    try {
      await changeTurn(roomId);
    } catch (err) {
      console.error(`[Timer] Failed to change turn for room ${roomId}`, err);
    }
  }, duration);

  turnTimers.set(roomId, timeout);
}

export function restartTurnTimer(roomId: string, duration: number) {
  clearTurnTimer(roomId);

  startTurnTimer(roomId, duration);
}

export function clearTurnTimer(roomId: string) {
  const timeout = turnTimers.get(roomId);

  if (!timeout) {
    return;
  }

  clearTimeout(timeout);

  turnTimers.delete(roomId);
}

export function hasTurnTimer(roomId: string) {
  return turnTimers.has(roomId);
}

export function clearAllTurnTimers() {
  for (const timeout of turnTimers.values()) {
    clearTimeout(timeout);
  }

  turnTimers.clear();
}
