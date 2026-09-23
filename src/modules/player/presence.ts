import type { Server, Socket } from "socket.io";
import { AppError } from "@/shared/utils/error.js";
import { roomMapper } from "@/shared/utils/mapper.js";
import { ServerEvents } from "@/shared/consts/events.js";
import { reconnectPlayerToRoom } from "../room/service.js";
import { handlePlayerInactive, syncFriends } from "./service.js";
import {
  savePlayer,
  getPlayerById,
  getFriendsWithPresence
} from "./service.js";

const RECONNECT_GRACE_PERIOD = 60_000;

export async function handleConnection(
  io: Server,
  socket: Socket,
) {
  try {
    let room;
    const player = await getPlayerById(socket.data.id);
  
    if (player) {
      player.socketId = socket.id;
      await savePlayer(player);
  
      if (player.roomId) {
        room = await reconnectPlayerToRoom(player.roomId, player.id, socket.id);
        socket.join(player.roomId);
      }
    } else {
      await savePlayer({...socket.data, socketId: socket.id})
    }
  
    await syncFriends(socket);

    if (room) {
      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    } else {
      io.to(socket.id).emit(ServerEvents.ROOM_SYNC, null);
    }
  }
  catch (error) {
    if (error instanceof AppError) {
      socket.emit(ServerEvents.ERROR, {
        message: error.message,
      });
    }
  }
}

export async function handleDisconnect(
  socket: Socket,
) {
  try {
    const player = await getPlayerById(socket.data.id);
  
    if (player) {
      player.socketId = null;
      await savePlayer(player);
  
      const friends = await getFriendsWithPresence(player.id);
  
      for (const friend of friends) {
        if (friend.online && friend.socketId) {
          socket.to(friend.socketId).emit(ServerEvents.FRIENDS_PRESENCE, {
            userId: player.id,
            online: false,
          });
        }
      }
      setTimeout(() => {
        checkInactivePlayer(player.id);
      }, RECONNECT_GRACE_PERIOD);
    }
  }
  catch (error) {
    if (error instanceof AppError) {
      socket.emit(ServerEvents.ERROR, {
        message: error.message,
      });
    }
  }
}

async function checkInactivePlayer(playerId: string) {
  try {
    const player = await getPlayerById(playerId);

    if (!player) {
      return;
    }

    // Player reconnected during the grace period.
    if (player.socketId !== null) {
      return;
    }

    await handlePlayerInactive(player);
  } catch (error) {
    console.error(
      `[Presence] Failed to handle inactive player ${playerId}:`,
      error,
    );
  }
}