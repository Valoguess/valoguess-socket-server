import { db } from "@/db";
import { game as gameSchema, gamePlayer } from "@/db/schema";
import type { Game } from "./types.js";

export async function saveGameToDB(game: Game) {
  try {
    if (game.status !== "FINISHED" || !game.endedAt) {
      throw new Error("Cannot save an unfinished game");
    }

    const history = (() => {
      switch (game.mode) {
        case "GUESS_AGENT":
          return prepareGuessAgentHistory(game);

        default:
          throw new Error(`History preparation not implemented for ${game.mode}`);
      }
    })();

    await db.transaction(async (tx) => {
      const gameRecord = await tx.insert(gameSchema).values({
        mode: game.mode,
        hostId: game.hostId,
        settings: game.settings,
        summary: history.summary,
        startedAt: new Date(game.startedAt!),
        endedAt: new Date(game.endedAt!),
        createdAt: new Date(game.createdAt),
      }).returning();

      if (history.players.length > 0) {
        await tx.insert(gamePlayer).values(
          history.players.map((player) => ({
            gameId: gameRecord[0]!.id,
            userId: player.userId,
            name: player.name,
            outcome: player.outcome,
            details: player.details,
          })),
        );
      }
    });
  } catch (error) {
    console.error("Failed to save game to database:", error);
  }
}

export function prepareGuessAgentHistory(game: Game) {
  if (game.mode !== "GUESS_AGENT") {
    throw new Error("Invalid game mode");
  }

  const state = game.state;

  if (!state || !("result" in state)) {
    throw new Error("Game has no final result");
  }

  const { result } = state;

  return {
    summary: {
      result: result.result,
      winnerId: result.winnerId,
    },

    players: game.players.map((player) => {
      const playerState = state.playerStates[player.id];

      if (!playerState) {
        throw new Error(`Missing player state: ${player.id}`);
      }

      const outcome: "WIN" | "DRAW" | "LOSS" =
        result.result === "TIE"
          ? "DRAW"
          : result.winnerId === player.id
            ? "WIN"
            : "LOSS";

      return {
        userId: player.id,
        name: player.name,
        outcome,
        details: {
          secretAgent: playerState.secretAgent,
          guess: playerState.guess,
          nosUsed: game.settings.maxNos - playerState.nosRemaining,
          guessesUsed: game.settings.maxGuesses - playerState.guessesRemaining,
        },
      };
    }),
  };
}
