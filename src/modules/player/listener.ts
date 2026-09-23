import type { Server, Socket } from "socket.io";
import { handleHeartbeat } from "./service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents } from "@/shared/consts/events.js";

export function playerListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.PLAYER_HEARTBEAT,
    asyncHandler(socket, async () => {
      await handleHeartbeat(socket.data.id);
    }),
  )
}


