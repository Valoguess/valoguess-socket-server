import * as z from "zod";

export const partyIdInput = z.object({
  partyId: z.string(),
});

export const partyInviteSendInput = z.object({
  invitedPlayerId: z.string(),
});

export const partyInviteDeclineInput = z.object({
  partyId: z.string(),
  inviterId: z.string(),
});

export const partyKickInput = z.object({
  kickedPlayerId: z.string(),
});

export const partyChatMessageInput = z.object({
  message: z.string().min(1).max(500),
});