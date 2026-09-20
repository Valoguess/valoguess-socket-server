export interface Settings {
  maxNos: number;
  timePerRound: number;
  maxGuesses: number;
  questionCount: number;
  // questionPool?: string[] | undefined;
}

export const DefaultSettings: Settings = {
  maxNos: 5,
  timePerRound: -1,
  maxGuesses: 1,
  questionCount: 15,
}

export interface Player {
  id: string;
  name: string;
  roomId: string | null;
  socketId: string | null;
  lastHeartbeatAt: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  socketId: string;
}

export type RoomState = "waiting" | "playing" | "finished";

export interface Room {
  id: string;
  state: RoomState;
  hostId: string;
  players: RoomPlayer[];
  settings: Settings;
  game?: GameState;
  createdAt: number;
}

export interface GameState {
  startedAt: number;
  currentTurn: string;
  turnNumber: number;
  turnEndTime?: number;
  pendingQuestion?: PendingQuestion;
  history: QuestionHistory[];
  questionPool: string[];
  playerStates: Record<RoomPlayer["id"], PlayerState>;
  winnerId?: string;
  endedAt?: number;
}

export interface PlayerState {
  secretAgent: string;
  guess: string | null;
  isGuessCorrect?: boolean;
  nosRemaining: number;
  guessesRemaining: number;
}

export interface PendingQuestion {
  askedBy: string;
  targetPlayer: string;
  questionId: string;
}

export interface QuestionHistory {
  askedBy: string;
  targetPlayer: string;
  questionId: string;
  answer: "yes" | "no";
  timestamp: number;
}