import type {
  GuessAgentSettings,
  GuessAgentState,
} from "../guess-agent/types.js";

export type GameMode = "GUESS_AGENT" | "CODENAMES" | "IMPOSTER";
export type GameStatus = "WAITING" | "STARTING" | "PLAYING" | "FINISHED";

export interface GamePlayer {
  id: string;
  name: string;
  socketId: string;
}

export interface BaseGame {
  id: string;

  status: GameStatus;
  hostId: string;

  players: GamePlayer[];

  createdAt: number;
  startingAt?: number;
  startingEndsAt?: number;

  startedAt?: number;
  endedAt?: number;
}

export type GameData =
  | {
    mode: "GUESS_AGENT";
    settings: GuessAgentSettings;
    state?: GuessAgentState;
  };
// | {
//     mode: "CODENAMES";
//     settings: CodenamesSettings;
//     state: CodenamesState;
//   }
// | {
//     mode: "IMPOSTER";
//     settings: ImposterSettings;
//     state: ImposterState;
//   };

export type Game = BaseGame & GameData;
