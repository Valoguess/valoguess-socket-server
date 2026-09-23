import type { Server, Socket } from "socket.io";

import { roomMapper } from "@/shared/utils/mapper.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";
import { createRoom } from "../room/service.js";
import { acceptRoomInvite, invitePlayerToRoom } from "./service.js";

export function partyListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.INVITE_SEND, 
    asyncHandler(socket, async (payload) => {
      console.log('invite_send payload', payload)
      let { roomId, invitedPlayer } = payload;
      if (!roomId) {
        const room = await createRoom(socket.data);
        roomId = room.id;
      };
      

      const invitedPlayerSocketId = await invitePlayerToRoom(roomId, socket.data.id, invitedPlayer)
      io.to(invitedPlayerSocketId)
        .emit(ServerEvents.INVITE_SYNC, {
          roomId,
          otherPlayerId: socket.data.id,
          status: "PENDING"
        });
    })
  )

  socket.on(
    ClientEvents.INVITE_ACCEPT,
    asyncHandler(socket, async (payload: { roomId: string }) => {
      const { roomId } = payload;

      const room = await acceptRoomInvite(roomId, socket.data.id);
      await socket.join(room.id);

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      } 
    })
  )

  socket.on(
    ClientEvents.INVITE_REJECT,
    asyncHandler(socket, async (payload: { roomId: string, inviterId: string }) => {
      const { roomId, inviterId } = payload;
      io.to(inviterId).emit(ServerEvents.INVITE_SYNC, {
        roomId,
        otherPlayerId: socket.data.id,
        status: "DECLINED"
      });
    })
  )
}


