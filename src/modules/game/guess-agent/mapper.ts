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
  state: GuessAgentPrivateStateDTO;
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
  players: GuessAgentPlayerDTO[];
  settings: {
    maxNos: number;
    maxGuesses: number;
    questionCount: number;
    timePerRound: number;
    questionMode: "PRESET" | "FREEFORM";
  };
  startedAt?: number;

  turnNumber: number;
  currentTurn: string;
  turnEndTime?: number | null;
  pendingQuestion?: GuessAgentState["pendingQuestion"];
  history: GuessAgentState["history"];

  result?: GuessAgentResult | undefined;
  endedAt?: number | undefined;
}

export function guessAgentMapper(
  game: Game,
  playerId: string,
): GuessAgentGameDTO {
  const state = game.state!;

  const players = game.players.map((player) => {
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
      ),
    };
  });

  return {
    id: game.id,
    status: game.status,
    players,
    settings: game.settings,
    startedAt: state.startedAt,
    turnNumber: state.turnNumber,
    currentTurn: state.currentTurn,
    turnEndTime: state.turnEndTime ?? null,
    pendingQuestion: state.pendingQuestion,
    history: state.history,
    result: state.result,
    endedAt: state.endedAt,
  };
}

function mapPlayerState(
  state: GuessAgentPlayerState,
  isMe: boolean,
  isMyTurn: boolean,
): GuessAgentPrivateStateDTO {
  return {
    isMyTurn,
    secretAgent: isMe ? state.secretAgent : null,
    guess: state.guess,
    nosRemaining: state.nosRemaining,
    guessesRemaining: state.guessesRemaining,
  };
}
