import type { Server, Socket } from "socket.io";

import { getPlayerById } from "../player/service.js";
import { requesterIdInput, receiverIdInput } from "./schema.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";
import { getUserDetails } from "@/db/user.js";

export function friendsListener(io: Server, socket: Socket) {

  socket.on(
    ClientEvents.FRIEND_REQUEST_SEND,
    asyncHandler(socket, async (payload) => {
      const { receiverId } = receiverIdInput.parse(payload);

      const receiver = await getPlayerById(receiverId);

      if (!receiver?.socketId) {
        return;
      }

      const requesterDetails = await getUserDetails(socket.data.id);

      io.to(receiver.socketId).emit(ServerEvents.FRIEND_REQUEST, {
        ...(requesterDetails ? requesterDetails : {
          id: socket.data.id,
          name: socket.data.name,
        }),
      });
    }),
  );

  socket.on(
    ClientEvents.FRIEND_REQUEST_ACCEPT,
    asyncHandler(socket, async (payload) => {
      const accepterId = socket.data.id;
      const { requesterId } = requesterIdInput.parse(payload);

      const requester = await getPlayerById(requesterId);

      socket.emit(ServerEvents.FRIEND_REQUEST_ACCEPTED, {
        userId: requesterId,
      });

      if (!requester?.socketId) {
        return;
      }

      io.to(requester.socketId).emit(
        ServerEvents.FRIEND_REQUEST_ACCEPTED,
        {
          userId: accepterId,
        },
      );
    }),
  );

  socket.on(
    ClientEvents.FRIEND_REQUEST_DECLINE,
    asyncHandler(socket, async (payload) => {
      const declinerId = socket.data.id;
      const { requesterId } = requesterIdInput.parse(payload);

      const requester = await getPlayerById(requesterId);

      socket.emit(ServerEvents.FRIEND_REQUEST_DECLINED, {
        userId: requesterId,
      });

      if (!requester?.socketId) {
        return;
      }

      io.to(requester.socketId).emit(
        ServerEvents.FRIEND_REQUEST_DECLINED,
        {
          userId: declinerId,
        },
      );
    }),
  );
} 