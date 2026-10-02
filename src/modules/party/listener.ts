import type { Server, Socket } from "socket.io";

import { getPlayerById, savePlayer } from "../player/service.js";
import { partyInviteSendInput, partyInviteDeclineInput } from "./schema.js";

import {
  acceptPartyInvite,
  createParty,
  getPartyById,
  invitePlayerToParty,
} from "./service.js";

import { AppError } from "@/shared/utils/error.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";

export function partyListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.PARTY_CREATE,
    asyncHandler(socket, async () => {
      const currPlayer = await getPlayerById(socket.data.id);
      if (!currPlayer) {
        throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
      }

      const leader = {
        id: currPlayer.id,
        name: currPlayer.name,
        socketId: socket.id,
      };

      const party = await createParty(leader);
      socket.join(party.id);

      currPlayer.partyId = party.id;
      await savePlayer(currPlayer);

      io.to(party.id).emit(ServerEvents.PARTY_SYNC, party);
    }),
  );

  socket.on(
    ClientEvents.PARTY_INVITE_SEND,
    asyncHandler(socket, async (payload) => {
      const { partyId, invitedPlayerId } = partyInviteSendInput.parse(payload);
      let party = await getPartyById(partyId);

      const currPlayer = await getPlayerById(socket.data.id);
      if (!currPlayer) {
        throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
      }

      if (!party) {
        party = await createParty({
          id: currPlayer.id,
          name: currPlayer.name,
          socketId: socket.id,
        });
      }

      const invitedPlayerSocketId = await invitePlayerToParty(
        party.id,
        currPlayer.id,
        invitedPlayerId,
      );

      io.to(invitedPlayerSocketId).emit(ServerEvents.PARTY_INVITE_SYNC, {
        partyId,
        inviterId: currPlayer.id,
        status: "PENDING",
      });
    }),
  );

  socket.on(
    ClientEvents.PARTY_INVITE_ACCEPT,
    asyncHandler(socket, async (payload) => {
      const { partyId } = partyInviteSendInput.parse(payload);

      const currPlayerId = socket.data.id;
      const currPlayer = await getPlayerById(currPlayerId);

      if (!currPlayer) {
        throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
      }

      const party = await acceptPartyInvite(partyId, currPlayerId);

      socket.join(party.id);
      io.to(party.id).emit(ServerEvents.PARTY_SYNC, party);
    }),
  );

  socket.on(
    ClientEvents.PARTY_INVITE_DECLINE,
    asyncHandler(socket, async (payload) => {
      const { partyId, inviterId } = partyInviteDeclineInput.parse(payload);

      const inviter = await getPlayerById(inviterId);
      if (!inviter?.socketId) {
        return;
      }

      io.to(inviter.socketId).emit(ServerEvents.PARTY_INVITE_SYNC, {
        partyId,
        otherPlayerId: socket.data.id,
        status: "DECLINED",
      });
    }),
  );

  // socket.on(
  //   ClientEvents.PARTY_CHAT,
  //   asyncHandler(socket, async (message: string) => {
  //     const currPlayer = await getPlayerById(socket.data.id);

  //     if (!currPlayer) {
  //       throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  //     }

  //     if (message.length === 0) {
  //       throw new AppError("Message not found", "MESSAGE_NOT_FOUND", 400);
  //     }

  //     if (!currPlayer.partyId) {
  //       throw new AppError(
  //         "User not in party, or party not found",
  //         "USER_NOT_IN_PARTY",
  //         404,
  //       );
  //     }

  //     const party = await getPartyById(currPlayer.partyId);
  //     if (!party) {
  //       throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
  //     }

  //     io.to(party.id).emit(ServerEvents.PARTY_CHAT_SYNC, {
  //       userId: currPlayer.id,
  //       message,
  //     });
  //   }),
  // )
}
