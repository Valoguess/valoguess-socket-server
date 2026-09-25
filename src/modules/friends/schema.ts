import * as z from "zod";

export const requesterIdInput = z.object({
  requesterId: z.string(),
});

export type RequesterIdInput = z.infer<typeof requesterIdInput>;

export const receiverIdInput = z.object({
  receiverId: z.string(),
});

export type ReceiverIdInput = z.infer<typeof receiverIdInput>;