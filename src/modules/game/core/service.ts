import type { BaseGame, Game, GamePlayer } from "./types.js";
import { finishGame as finishGuessAgentGame } from "../guess-agent/service.js";

import { redis } from "@/setup/redis.js";
import { AppError } from "@/shared/utils/error.js";
import { generateId } from "@/shared/utils/generateId.js";
import { updatePlayerGame } from "@/modules/player/service.js";

const GAME_PREFIX = "game:";
const GAME_TTL = 60 * 10; // 10 minutes

const gameKey = (gameId: string) => `${GAME_PREFIX}${gameId}`;

export async function gameExists(gameId: string) {
  return (await redis.exists(gameKey(gameId))) === 1;
}

export async function getGameById(gameId: string) {
  const game = await redis.get(gameKey(gameId));

  if (!game) return null;

  return JSON.parse(game) as Game;
}

export async function saveGame(game: Game) {
  await redis.setex(gameKey(game.id), GAME_TTL, JSON.stringify(game));
  return game;
}

export async function getActiveGames() {
  const keys = await redis.keys(`${GAME_PREFIX}*`);
  const games = await Promise.all(
    keys.map(async (key) => {
      const game = await redis.get(key);
      return game ? (JSON.parse(game) as Game) : null;
    }),
  );

  return games.filter((game): game is Game => game !== null);
}

export async function deleteGame(gameId: string) {
  await redis.del(gameKey(gameId));
}

export async function leaveGame(gameId: string, playerId: string) {
  const game = await getGameById(gameId);

  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  const playerIndex = game.players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) {
    throw new AppError("Player not found in game", "PLAYER_NOT_FOUND", 404);
  }

  game.players.splice(playerIndex, 1);
  await updatePlayerGame(playerId, null);

  if (game.players.length === 0) {
    await deleteGame(game.id);
    return null;
  }

  if (game.hostId === playerId) {
    game.hostId = game.players[0]!.id;
  }

  if (game.status === "WAITING" && game.players.length === 1) {
    await deleteGame(game.id);
    return null;
  }

  switch (game.mode) {
    case "GUESS_AGENT":
      await finishGuessAgentGame(game, game.players[0]!.id);
      break;
  }

  return await saveGame(game);
}

export async function reconnectPlayerToGame(
  gameId: string,
  playerId: string,
  socketId: string,
) {
  const game = await getGameById(gameId);

  if (!game) {
    return null;
  }

  const player = game.players.find((p) => p.id === playerId);

  if (!player) {
    return null;
  }

  player.socketId = socketId;

  return await saveGame(game);
}

export function createBaseGame(hostId: string, players: GamePlayer[]) {
  const gameId = generateId();

  const game: BaseGame = {
    id: gameId,
    status: "WAITING",
    hostId,
    players,
    createdAt: Date.now(),
  };

  return game;
}
