import type { Game } from "../core/types.js";

import type {
  GuessAgentState,
  GuessAgentPlayerState,
  GuessAgentResult,
} from "./types.js";

import { AppError } from "@/shared/utils/error.js";

export interface GuessAgentPlayerDTO {
  id: string;
  name: string;
  state?: GuessAgentPrivateStateDTO;
}

export interface GuessAgentPrivateStateDTO {
  isMyTurn: boolean;
  secretAgent: string | null;
  guess: string | null;
  nosRemaining: number;
  guessesRemaining: number;
}

export interface GuessAgentGameDTO {
  id: string;
  status: string;
  startingAt?: number;
  startingEndsAt?: number;
  players: GuessAgentPlayerDTO[];

  settings: {
    maxNos: number;
    maxGuesses: number;
    questionCount: number;
    timePerRound: number;
    questionMode: "PRESET" | "FREEFORM";
  };

  state?: GuessAgentStateDTO;
}

export interface GuessAgentStateDTO {
  turnNumber: number;
  currentTurn: string;
  turnEndTime: number | null;

  pendingQuestion?: GuessAgentState["pendingQuestion"];
  history: GuessAgentState["history"];

  result?: GuessAgentResult;
}

export function guessAgentMapper(
  game: Game,
  playerId: string,
): GuessAgentGameDTO {
  const dto: GuessAgentGameDTO = {
    id: game.id,
    status: game.status,
    startingAt: game.startingAt!,
    startingEndsAt: game.startingEndsAt!,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
    })),
    settings: game.settings,
  };

  if (!game.state) {
    return dto;
  }

  const state = game.state;

  dto.players = game.players.map((player) => {
    const playerState = state.playerStates[player.id];

    if (!playerState) {
      throw new AppError(
        "Player state not found",
        "PLAYER_STATE_NOT_FOUND",
        500,
      );
    }

    return {
      id: player.id,
      name: player.name,
      state: mapPlayerState(
        playerState,
        player.id === playerId,
        state.currentTurn === player.id,
        game.status === "FINISHED",
      ),
    };
  });

  dto.state = {
    turnNumber: state.turnNumber ?? 1,
    currentTurn: state.currentTurn ?? "",
    turnEndTime: state.turnEndTime ?? null,
    ...(state.pendingQuestion && { pendingQuestion: state.pendingQuestion }),
    history: state.history,
    ...(state.result && { result: state.result }),
  };

  return dto;
}

function mapPlayerState(
  state: GuessAgentPlayerState,
  isMe: boolean,
  isMyTurn: boolean,
  isFinished: boolean,
): GuessAgentPrivateStateDTO {
  return {
    isMyTurn,
    secretAgent: isFinished || isMe ? state.secretAgent : null,
    guess: state.guess,
    nosRemaining: state.nosRemaining,
    guessesRemaining: state.guessesRemaining,
  };
}
