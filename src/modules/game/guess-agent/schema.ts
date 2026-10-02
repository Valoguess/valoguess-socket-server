import * as z from "zod";

export const GuessAgentSettingsSchema = z.object({
  questionMode: z.enum(["PRESET", "FREEFORM"]),

  maxNos: z.number().int().min(1),
  maxGuesses: z.number().int().min(1),
  questionCount: z.number().int().min(1),

  timePerRound: z.number().int(),
});

export type GuessAgentSettings = z.infer<typeof GuessAgentSettingsSchema>;

export const askQuestionSchema = z.object({
  gameId: z.string(),
  questionId: z.string(),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;

export const answerQuestionSchema = z.object({
  gameId: z.string(),
  answer: z.enum(["YES", "NO"]),
});

export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;

export const makeGuessSchema = z.object({
  gameId: z.string(),
  guess: z.string(),
});

export type MakeGuessInput = z.infer<typeof makeGuessSchema>;
