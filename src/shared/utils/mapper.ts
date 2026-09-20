import type {
  PendingQuestion,
  PlayerState,
  QuestionHistory,
  Room,
  RoomState,
  Settings,
} from "@/shared/consts/types.js";
import { AppError } from "./error.js";

export interface RoomPlayerDTO {
  id: string;
  name: string;
}

export interface PlayerGameStateDTO {
  isMyTurn: boolean;

  secretAgent: string | null;
  guess: string | null;

  nosRemaining: number;
  guessesRemaining: number;
}

export interface PlayerDTO {
  player: RoomPlayerDTO;
  state: PlayerGameStateDTO;
}


export interface GameStateDTO {
  startedAt: number;
  turnNumber: number;
  turnEndTime?: number | null;

  questionPool: string[];
  pendingQuestion?: PendingQuestion | undefined;
  history: QuestionHistory[];

  winnerId?: string | undefined;
  endedAt?: number | undefined;
}

export interface RoomDTO {
  id: string;
  state: RoomState;
  hostId: string;

  me: PlayerDTO;
  opponent?: PlayerDTO;


  settings: Settings;
  createdAt: number;

  game?: GameStateDTO;
}

export function roomMapper(
  room: Room,
  playerId: string,
): RoomDTO {

  const me = room.players.find((p) => p.id === playerId);

  if (!me) {
    throw new AppError("Current player not found.");
  }

  const opponent = room.players.find((p) => p.id !== playerId);

  const dto: RoomDTO = {
    id: room.id,
    state: room.state,
    hostId: room.hostId,

    me: {
      player: {
        id: me.id,
        name: me.name,
      },
      state: {
        isMyTurn: false,
        secretAgent: null,
        guess: null,
        nosRemaining: 0,
        guessesRemaining: 0,
      },
    },
    settings: room.settings,
    createdAt: room.createdAt,
  };

  if (opponent) {
    dto.opponent = {
      player: {
        id: opponent.id,
        name: opponent.name,
      },
      state: {
        isMyTurn: false,
        secretAgent: null,
        guess: null,
        nosRemaining: 0,
        guessesRemaining: 0,
      },
    }
  }

  if (!room.game) {
    return dto;
  }

  if (!dto.opponent || !opponent) {
    throw new AppError("Opponent not found")
  }

  dto.me.state = mapPlayerState(
    room.game.playerStates[me.id]!,
    room.game.currentTurn === me.id,
    true,
  );

  dto.opponent.state = mapPlayerState(
    room.game.playerStates[opponent.id]!,
    room.game.currentTurn === opponent.id,
    room.state === "finished" || room.game.endedAt !== undefined,
  );

  dto.game = {
    startedAt: room.game.startedAt,
    turnNumber: room.game.turnNumber,
    turnEndTime: room.game.turnEndTime ?? null,

    questionPool: room.game.questionPool,
    pendingQuestion: room.game.pendingQuestion,
    history: room.game.history,

    winnerId: room.game.winnerId,
    endedAt: room.game.endedAt,
  };

  return dto;
}

function mapPlayerState(
  state: PlayerState,
  isMyTurn: boolean,
  includeSecretAgent: boolean,
): PlayerGameStateDTO {

  return {
    isMyTurn,

    secretAgent: includeSecretAgent
      ? state.secretAgent
      : null,

    guess: state.guess,
    nosRemaining: state.nosRemaining,
    guessesRemaining: state.guessesRemaining,
  };
}