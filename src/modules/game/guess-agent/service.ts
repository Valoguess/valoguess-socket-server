import type { GuessAgentSettings } from "./types.js";
import type { Game, GamePlayer } from "../core/types.js";
import { createBaseGame, getGameById, saveGame } from "../core/service.js";
import { clearTurnTimer, restartTurnTimer, startTurnTimer } from "./timer.js";

import { AppError } from "@/shared/utils/error.js";
import { AGENTS } from "@/shared/consts/agents.js";
import { getPlayerById } from "@/modules/player/service.js";

import {
  DIFFICULTY_PERCENTAGES,
  QUESTIONS,
  type QuestionDifficulty,
  type QuestionId,
} from "@/shared/consts/questions.js";

function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result;
}

export function selectQuestionIds(count: number): QuestionId[] {
  const questionsByDifficulty: Record<QuestionDifficulty, QuestionId[]> = {
    low: [],
    medium: [],
    high: [],
  };

  for (const [id, question] of Object.entries(QUESTIONS)) {
    questionsByDifficulty[question.difficulty].push(id);
  }

  const lowCount = Math.round(count * DIFFICULTY_PERCENTAGES.low);
  const mediumCount = Math.round(count * DIFFICULTY_PERCENTAGES.medium);
  const highCount = count - lowCount - mediumCount;

  const selected: QuestionId[] = [
    ...shuffle(questionsByDifficulty.low).slice(0, lowCount),
    ...shuffle(questionsByDifficulty.medium).slice(0, mediumCount),
    ...shuffle(questionsByDifficulty.high).slice(0, highCount),
  ];

  return shuffle(selected);
}

export async function createGuessAgentGame(
  hostId: string,
  players: GamePlayer[],
  settings: GuessAgentSettings,
) {
  const baseGame = createBaseGame(hostId, players);

  if (settings.questionMode === "FREEFORM") {
    settings.questionCount = 0;
    settings.timePerRound = -1;
  }

  const game: Game = {
    ...baseGame,
    mode: "GUESS_AGENT",
    settings,
  };

  return await saveGame(game);
}

export async function startGuessAgentGame(gameId: string, playerId: string) {
  const game = await getGameById(gameId);

  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.status !== "WAITING") {
    throw new AppError("Game cannot be started", "GAME_ALREADY_STARTED");
  }

  if (game.hostId !== playerId) {
    throw new AppError(
      "Only the host can start the game",
      "NOT_GAME_HOST",
      403,
    );
  }

  game.status = "STARTING";
  game.startingAt = Date.now();
  game.startingEndsAt = game.startingAt + 15000; // 15 seconds countdown

  game.state = {
    history: [],
    playerStates: {},
  };

  const availableAgents = [...AGENTS];
  for (const player of game.players) {
    const randomIndex = Math.floor(Math.random() * availableAgents.length);
    const secretAgent = availableAgents[randomIndex]!.id;
    availableAgents.splice(randomIndex, 1);

    game.state.playerStates[player.id] = {
      secretAgent,
      guess: null,
      nosRemaining: game.settings.maxNos,
      guessesRemaining: game.settings.maxGuesses,
    };
  }

  return game;
}

export async function beginGuessAgentGame(game: Game, playerId: string) {
  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.status !== "STARTING") {
    throw new AppError("Game cannot be started", "GAME_ALREADY_STARTED");
  }

  if (game.hostId !== playerId) {
    throw new AppError(
      "Only the host can start the game",
      "NOT_GAME_HOST",
      403,
    );
  }

  game.status = "PLAYING";
  game.startedAt = Date.now();

  if (!game.state) {
    throw new AppError("Game state is missing", "GAME_STATE_MISSING", 500);
  }

  if (game.settings.questionMode === "PRESET") {
    const questionPool = selectQuestionIds(game.settings.questionCount);
    const currentTurn = game.players[Math.floor(Math.random() * 2)]!.id;

    game.state = {
      ...game.state,
      currentTurn,
      turnNumber: 1,
      questionPool,
    };
  }

  if (game.settings.timePerRound !== -1) {
    startTurnTimer(game.id, game.settings.timePerRound * 1000);
    game.state.turnEndTime = Date.now() + game.settings.timePerRound * 1000;
  }

  return await saveGame(game);
}

export async function consumeNo(playerId: string) {
  const player = await getPlayerById(playerId);

  if (!player) {
    throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  }

  if (!player.gameId) {
    throw new AppError("Player is not in a game", "PLAYER_NOT_IN_GAME", 400);
  }

  const game = await getGameById(player.gameId);

  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.mode !== "GUESS_AGENT") {
    throw new AppError(
      "Game is not in Guess Agent mode",
      "GAME_NOT_GUESS_AGENT_MODE",
      400,
    );
  }

  if (game.settings.questionMode !== "FREEFORM") {
    throw new AppError(
      "Game is not in freeform question mode",
      "GAME_NOT_FREEFORM_MODE",
      400,
    );
  }

  if (!game.state) {
    throw new AppError("Game state is missing", "GAME_STATE_MISSING", 500);
  }

  if (
    game.state.playerStates[player.id]?.nosRemaining &&
    game.state.playerStates[player.id]!.nosRemaining > 0
  ) {
    game.state.playerStates[player.id]!.nosRemaining -= 1;
    return await saveGame(game);
  } else {
    throw new AppError("No more nos available", "NO_NOS_AVAILABLE", 400);
  }
}

export async function changeTurn(gameIdentifier: string | Game): Promise<Game> {
  let game =
    typeof gameIdentifier === "string"
      ? await getGameById(gameIdentifier)
      : gameIdentifier;

  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.status !== "PLAYING") {
    throw new AppError(
      "Game is not currently in progress",
      "GAME_NOT_IN_PROGRESS",
    );
  }

  if (!game.state) {
    throw new AppError("Game state is missing", "GAME_STATE_MISSING", 500);
  }

  const currentTurn = game.state.currentTurn;
  const nextTurnPlayer = game.players.find(
    (player: GamePlayer) => player.id !== currentTurn,
  );
  if (!nextTurnPlayer) {
    throw new AppError(
      "Next turn player not found",
      "NEXT_TURN_PLAYER_NOT_FOUND",
      404,
    );
  }

  game.state.currentTurn = nextTurnPlayer.id;
  game.state.turnNumber = (game.state.turnNumber ?? 0) + 1;

  if (game.settings.timePerRound !== -1) {
    game.state.turnEndTime = Date.now() + game.settings.timePerRound * 1000;
    restartTurnTimer(game.id, game.settings.timePerRound * 1000);
  }

  return await saveGame(game);
}

export async function finishGame(game: Game, winnerId?: string) {
  if (!game.state) {
    throw new AppError("Game state is missing", "GAME_STATE_MISSING", 500);
  }

  if (winnerId) {
    game.state.result = {
      result: "WIN",
      winnerId,
    };
  } else {
    game.state.result = {
      result: "TIE",
      winnerId: null,
    };
  }

  game.status = "FINISHED";
  game.endedAt = Date.now();

  if (game.settings.timePerRound !== -1) {
    clearTurnTimer(game.id);
  }

  return await saveGame(game);
}

export async function resetGame(
  gameId: string,
  playerId: string,
): Promise<Game> {
  const game = await getGameById(gameId);

  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  const player = game.players.find((player) => player.id === playerId);
  if (player?.id !== game.hostId) {
    throw new AppError(
      "Only the host can reset the game",
      "NOT_GAME_HOST",
      403,
    );
  }

  if (game.status !== "FINISHED") {
    throw new AppError("Game is not finished", "GAME_NOT_FINISHED");
  }

  game.status = "WAITING";
  delete game.state;

  await saveGame(game);
  return game;
}
