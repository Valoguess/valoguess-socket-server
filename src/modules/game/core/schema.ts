import * as z from "zod";
import { GuessAgentSettingsSchema } from "../guess-agent/schema.js";
import { gameModeEnum } from "@/db/schema.js";

export const GameSettingsSchema = GuessAgentSettingsSchema;

export type GameSettings = z.infer<typeof GameSettingsSchema>;

export const createGameSchema = z.object({
  mode: z.enum(gameModeEnum.enumValues),
  settings: GameSettingsSchema,
});