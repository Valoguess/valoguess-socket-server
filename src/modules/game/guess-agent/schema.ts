import * as z from "zod";

export const GuessAgentSettingsSchema = z.object({
  questionMode: z.enum(["PRESET", "FREEFORM"]),

  maxNos: z.number().int().min(1),
  maxGuesses: z.number().int().min(1),
  questionCount: z.number().int().min(1),

  timePerRound: z.number().int(),
});

export const askQuestionSchema = z.object({
  questionId: z.string(),
});

export const answerQuestionSchema = z.object({
  answer: z.enum(["YES", "NO"]),
});

export const makeGuessSchema = z.object({
  guess: z.string(),
});

