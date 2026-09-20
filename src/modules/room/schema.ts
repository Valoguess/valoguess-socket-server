import * as z from "zod";

export const roomIdInputSchema = z.object({
  roomId: z.string(),
});

export type RoomIdInput = z.infer<typeof roomIdInputSchema>;

export const updateRoomSchema = z.object({
  roomId: z.string(),
  settings: z.object({
    maxNos: z.union([
      z.number().int().min(1).max(10),
      z.literal(-1)
    ]),
    maxGuesses: z.union([
      z.number().int().min(1).max(10),
      z.literal(-1)
    ]),
    timePerRound: z.union([
      z.number().int().min(10).max(1000),
      z.literal(-1)
    ]),
    questionCount: z.number().int().min(5).max(60),
  }),
});

export type updateRoomPayload = z.infer<typeof updateRoomSchema>;