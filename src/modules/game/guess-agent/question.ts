import type { Game } from "../core/types.js";
import { changeTurn, finishGame } from "./service.js";
import { getGameById, saveGame } from "../core/service.js";

import { AppError } from "@/shared/utils/error.js";

export async function askQuestion(
  gameId: string,
  playerId: string,
  questionId: string,
): Promise<Game> {
  const game = await getGameById(gameId);
  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.status !== "PLAYING" || !game.state) {
    throw new AppError("Game not started", "GAME_NOT_STARTED");
  }

  const currPlayer = game.players.find((player) => player.id === playerId);
  if (!currPlayer) {
    throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  }
  if (game.state.currentTurn !== currPlayer.id) {
    throw new AppError("It's not your turn", "NOT_YOUR_TURN");
  }

  const currPlayerState = game.state.playerStates[currPlayer.id];
  if (!currPlayerState) {
    throw new AppError("Player state not found", "PLAYER_STATE_NOT_FOUND");
  }
  if (
    currPlayerState.nosRemaining <= 0 ||
    currPlayerState.guessesRemaining <= 0
  ) {
    throw new AppError("No questions remaining", "NO_QUESTIONS_REMAINING");
  }

  const questionAlreadyAsked = game.state.history.some(
    (history) =>
      history.questionId === questionId && history.askedBy === currPlayer.id,
  );

  if (questionAlreadyAsked) {
    throw new AppError("Question already asked", "QUESTION_ALREADY_ASKED");
  }

  if (game.state.pendingQuestion) {
    throw new AppError(
      "There is already a pending question",
      "PENDING_QUESTION_EXISTS",
    );
  }

  if (!game.settings.questionPool) {
    return await saveGame(game);
  }

  if (!game.settings.questionPool.includes(questionId)) {
    throw new AppError(
      "The question is not in the pool",
      "QUESTION_NOT_IN_POOL",
    );
  }

  game.state.pendingQuestion = {
    askedBy: currPlayer.id,
    targetPlayer: game.players.find((player) => player.id !== currPlayer.id)!
      .id,
    questionId,
  };

  await saveGame(game);
  return game;
}

export async function answerQuestion(
  gameId: string,
  playerId: string,
  answer: "YES" | "NO",
): Promise<Game> {
  const game = await getGameById(gameId);
  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.status !== "PLAYING" || !game.state) {
    throw new AppError("Game not started", "GAME_NOT_STARTED");
  }

  if (!game.state.pendingQuestion) {
    throw new AppError("No pending question", "NO_PENDING_QUESTION");
  }

  const currPlayer = game.players.find((player) => player.id === playerId);
  if (!currPlayer) {
    throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  }

  if (game.state.pendingQuestion.targetPlayer !== currPlayer.id) {
    throw new AppError("You are not the target player", "NOT_TARGET_PLAYER");
  }

  if (answer === "NO") {
    const playerThatAskedState =
      game.state.playerStates[game.state.pendingQuestion.askedBy];
    if (!playerThatAskedState) {
      throw new AppError("Player state not found", "PLAYER_STATE_NOT_FOUND");
    }
    playerThatAskedState.nosRemaining--;
  }

  game.state.history.push({
    askedBy: game.state.pendingQuestion.askedBy,
    targetPlayer: game.state.pendingQuestion.targetPlayer,
    questionId: game.state.pendingQuestion.questionId,
    answer,
    timestamp: Date.now(),
  });

  delete game.state.pendingQuestion;
  await saveGame(game);

  return changeTurn(gameId);
}

export async function makeGuess(
  gameId: string,
  playerId: string,
  guess: string,
): Promise<Game> {
  const game = await getGameById(gameId);
  if (!game) {
    throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
  }

  if (game.status !== "PLAYING" || !game.state) {
    throw new AppError("Game not started", "GAME_NOT_STARTED");
  }

  const currPlayer = game.players.find((player) => player.id === playerId);
  if (!currPlayer) {
    throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  }

  if (game.state.currentTurn !== playerId) {
    throw new AppError("It's not your turn", "NOT_YOUR_TURN");
  }

  const playerState = game.state.playerStates[playerId];

  if (!playerState) {
    throw new AppError("Player state not found", "PLAYER_STATE_NOT_FOUND");
  }

  if (playerState.guessesRemaining <= 0) {
    throw new AppError("No guesses remaining", "NO_GUESSES_REMAINING");
  }

  if (playerState.guess) {
    throw new AppError("You have already made a guess", "GUESS_ALREADY_MADE");
  }

  playerState.guessesRemaining--;
  playerState.guess = guess;

  const opponentPlayer = game.players.find((player) => player.id !== playerId);
  if (!opponentPlayer) {
    throw new AppError("Opponent not found", "OPPONENT_NOT_FOUND");
  }

  const opponentState = game.state.playerStates[opponentPlayer.id];

  if (!opponentState) {
    throw new AppError(
      "Opponent Player state not found",
      "OPPONENT_PLAYER_STATE_NOT_FOUND",
    );
  }

  const isGuessCorrect = guess === opponentState.secretAgent;
  const hasOpponentGuessed = opponentState.guess !== null;
  const isOpponentGuessCorrect = opponentState.isGuessCorrect;
  const playerGuessesExhausted = playerState.guessesRemaining <= 0;
  const opponentGuessesExhausted = opponentState.guessesRemaining <= 0;

  if (isGuessCorrect) {
    if (!hasOpponentGuessed) {
      return await finishGame(game, playerId);
    } else if (!isOpponentGuessCorrect) {
      return await finishGame(game, playerId);
    }
  } else {
    if (!playerGuessesExhausted) {
      playerState.guessesRemaining--;
      return await changeTurn(game);
    } else {
      if (!opponentGuessesExhausted) {
        return await changeTurn(game);
      } else {
        return await finishGame(game);
      }
    }
  }

  return await saveGame(game);
}
