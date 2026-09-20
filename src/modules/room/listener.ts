import type { Server, Socket } from "socket.io";

import { roomMapper } from "@/shared/utils/mapper.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";

import {
  roomIdInputSchema,
  updateRoomSchema,
} from "./schema.js";

import {
  createRoom,
  addPlayerToRoom,
  updateRoomSettings,
  leaveRoom,
  kickPlayerFromRoom,
  reconnectPlayerToRoom,
} from "./service.js";


export function roomListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.ROOM_CREATE,
    asyncHandler(socket, async () => {
      const player = {
        id: socket.data.id,
        name: socket.data.name,
        socketId: socket.id,
      }

      console.log('socket_data ', socket.data)

      const room = await createRoom(player);

      await socket.join(room.id);
      io.to(room.id).emit(ServerEvents.ROOM_SYNC, roomMapper(room, player.id));
    }),
  );

  socket.on(
    ClientEvents.ROOM_JOIN,
    asyncHandler(socket, async (payload) => {
      const { roomId } = roomIdInputSchema.parse(payload);
      const player = {
        id: socket.data.id,
        name: socket.data.name,
        socketId: socket.id,
      }

      const room = await addPlayerToRoom(roomId, player);

      await socket.join(room.id);

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }

    }),
  );

  socket.on(
    ClientEvents.ROOM_LEAVE,
    asyncHandler(socket, async (payload) => {
      const { roomId } = roomIdInputSchema.parse(payload);
      const room = await leaveRoom(roomId, socket.id);

      await socket.leave(roomId);
      if (!room) return;

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    }),
  );

  socket.on(
    ClientEvents.ROOM_UPDATE,
    asyncHandler(socket, async (payload) => {
      const { roomId, settings } = updateRoomSchema.parse(payload);

      const room = await updateRoomSettings(roomId, socket.id, settings);

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    }),
  );

  socket.on(
    ClientEvents.ROOM_KICK,
    asyncHandler(socket, async ({ roomId, kickedPlayerId }) => {
      const { room, kickedPlayer } = await kickPlayerFromRoom(roomId, kickedPlayerId, socket.data.id);

      const kickedPlayerSocket = io.sockets.sockets.get(kickedPlayer.socketId);
      if (kickedPlayerSocket) {
        kickedPlayerSocket.leave(roomId);
      }

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    })
  )
}
