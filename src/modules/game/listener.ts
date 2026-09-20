import type { Server, Socket } from "socket.io";
import { startGame } from "./service.js";

import { roomMapper } from "@/shared/utils/mapper.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";

export function gameListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.GAME_START,
    asyncHandler(socket, async (roomId: string) => {
      const room = await startGame(roomId, socket.data.id);

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    }),
  );
  
}
