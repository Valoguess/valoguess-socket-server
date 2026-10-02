export type GuessAgentQuestionMode =
  | "PRESET"
  | "FREEFORM";

export interface GuessAgentSettings {
  questionMode: GuessAgentQuestionMode;

  maxNos: number;
  maxGuesses: number;
  questionCount: number;

  timePerRound: number;

  questionPool?: string[];
}

export const DefaultGuessAgentSettings: GuessAgentSettings = {
  questionMode: "PRESET",

  maxNos: 5,
  maxGuesses: 1,
  questionCount: 15,

  timePerRound: -1,
};

export interface GuessAgentState {
  startedAt: number;

  currentTurn: string;
  turnNumber: number;

  turnEndTime?: number;

  pendingQuestion?: PendingQuestion;

  history: QuestionHistory[];

  playerStates: Record<string, GuessAgentPlayerState>;

  result?: GuessAgentResult;
  endedAt?: number;
}

export interface GuessAgentPlayerState {
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
  answer: "YES" | "NO";
  timestamp: number;
}

export type GuessAgentResult =
  | {
      result: "WIN";
      winnerId: string;
    }
  | {
      result: "TIE";
      winnerId: null;
    };