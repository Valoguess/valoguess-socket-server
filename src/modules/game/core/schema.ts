import * as z from "zod";
import { GuessAgentSettingsSchema } from "../guess-agent/schema.js";

export const GameSettingsSchema = GuessAgentSettingsSchema;

export type GameSettings = z.infer<typeof GameSettingsSchema>;

export const createGameSchema = z.object({
  partyId: z.string(),
  mode: z.enum(["GUESS_AGENT"]),
  settings: GameSettingsSchema,
});

export type CreateGamePayload = z.infer<typeof createGameSchema>;

export const gameIdSchema = z.object({
  gameId: z.string(),
});

export type GameIdInput = z.infer<typeof gameIdSchema>;