import type { Server, Socket } from "socket.io";

import { getPlayerById } from "../player/service.js";
import { requesterIdInput, receiverIdInput } from "./schema.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";

export function friendsListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.FRIEND_REQUEST_SEND,
    asyncHandler(socket, async (payload) => {
      const { receiverId } = receiverIdInput.parse(payload);
      const receiver = await getPlayerById(receiverId);

      if (!receiver || !receiver.socketId) {
        return;
      }

      io.to(receiver.socketId).emit(ServerEvents.FRIEND_REQUEST, {
        requesterId: socket.data.id,
      });
    }),
  );

  socket.on(
    ClientEvents.FRIEND_REQUEST_ACCEPT,
    asyncHandler(socket, async (payload) => {
      const accepterId = socket.data.id;
      const { requesterId } = requesterIdInput.parse(payload);

      const requester = await getPlayerById(requesterId);

      if (!requester || !requester.socketId) {
        return;
      }

      socket.emit(ServerEvents.FRIEND_PRESENCE, {
        userId: requesterId,
        online: true,
      });

      io.to(requester.socketId).emit(ServerEvents.FRIEND_REQUEST_ACCEPTED, {
        accepterId,
      });
    }),
  );

  socket.on(
    ClientEvents.FRIEND_REQUEST_DECLINE,
    asyncHandler(socket, async (payload) => {
      const declinerId = socket.data.id;
      const { requesterId } = requesterIdInput.parse(payload);

      const requester = await getPlayerById(requesterId);

      if (!requester || !requester.socketId) {
        return;
      }

      io.to(requester.socketId).emit(ServerEvents.FRIEND_REQUEST_DECLINED, {
        declinerId,
      });

    }),
  );
}
