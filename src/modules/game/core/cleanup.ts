import type { Server } from "socket.io";

import type { Game } from "./types.js";
import { getGameById, deleteGame } from "./service.js";

import { updatePlayersGame } from "@/modules/player/service.js";
import { ServerEvents } from "@/shared/consts/events.js";

const CLEANUP_DELAY = 30_000;

export function scheduleGameCleanup(
  io: Server,
  gameIdentifier: string | Game,
  cleanupDelay: number = CLEANUP_DELAY,
) {
  setTimeout(async () => {
    try {
      await cleanupGame(io, gameIdentifier);
    } catch (error) {
      console.error(
        `Failed to cleanup game ${typeof gameIdentifier === "string" ? gameIdentifier : gameIdentifier.id}:`,
        error,
      );
    }
  }, cleanupDelay);
}

export async function cleanupGame(io: Server, gameIdentifier: string | Game) {
  const game =
    typeof gameIdentifier === "string"
      ? await getGameById(gameIdentifier)
      : gameIdentifier;

  if (!game) {
    return;
  }

  if (game.status !== "FINISHED") {
    return;
  }

  const playerIds = game.players.map((player) => player.id);

  await updatePlayersGame(playerIds, null);

  await deleteGame(game.id);

  for (const player of game.players) {
    io.to(player.socketId).emit(ServerEvents.GAME_SYNC, null);
  }
}
