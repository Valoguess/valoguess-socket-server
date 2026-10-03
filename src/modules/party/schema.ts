import * as z from "zod";

export const partyIdInput = z.object({
  partyId: z.string(),
});

export type PartyIdInput = z.infer<typeof partyIdInput>;

export const partyInviteSendInput = z.object({
  partyId: z.string(),
  invitedPlayerId: z.string(),
});

export type PartyInviteSendInput = z.infer<typeof partyInviteSendInput>;

export const partyInviteDeclineInput = z.object({
  partyId: z.string(),
  inviterId: z.string(),
});

export type PartyInviteDeclineInput = z.infer<typeof partyInviteDeclineInput>;

export const partyKickInput = z.object({
  kickedPlayerId: z.string(),
});

export type PartyKickInput = z.infer<typeof partyKickInput>;