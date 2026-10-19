import type { Game } from "./types.js";
import { getGameById, deleteGame } from "./service.js";
import { updatePlayersGame } from "@/modules/player/service.js";

export async function cleanupGame(gameIdentifier: string | Game) {
  try {
    const game =
      typeof gameIdentifier === "string"
        ? await getGameById(gameIdentifier)
        : gameIdentifier;

    if (!game || game.status !== "FINISHED") {
      return;
    }

    const playerIds = game.players.map((player) => player.id);

    await updatePlayersGame(playerIds, null);
    await deleteGame(game.id);
  } catch (error) {
    console.error(
      `Failed to cleanup game ${typeof gameIdentifier === "string" ? gameIdentifier : gameIdentifier.id}:`,
      error,
    );
  }
}
