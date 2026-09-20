import { generateUniqueRoomCode } from "./utils.js";

import { redis } from "@/setup/redis.js";
import { AppError } from "@/shared/utils/error.js";
import { DefaultSettings } from "@/shared/consts/types.js";
import type { Room, RoomPlayer, Settings } from "@/shared/consts/types.js";
import { updatePlayerRoom } from "../player/service.js";

  const ROOM_PREFIX = "room:";
  const ROOM_TTL = 60 * 10; // 10 minutes

  const roomKey = (roomId: string) => `${ROOM_PREFIX}${roomId}`;

  export async function roomExists(roomId: string) {
    return (await redis.exists(roomKey(roomId))) === 1;
  }

  export async function getRoomById(roomId: string) {
    const room = await redis.get(roomKey(roomId));

    if (!room) return null;

    return JSON.parse(room) as Room;
  }

  export async function saveRoom(room: Room) {
    await redis.setex(roomKey(room.id), ROOM_TTL, JSON.stringify(room));
    return room;
  }

  export async function getActiveRooms() {
    const keys = await redis.keys(`${ROOM_PREFIX}*`);
    const rooms = await Promise.all(
      keys.map(async (key) => {
        const room = await redis.get(key);
        return room ? JSON.parse(room) as Room : null;
      }),
    );

    return rooms.filter((room): room is Room => room !== null);
  }

  export async function deleteRoom(roomId: string) {
    await redis.del(roomKey(roomId));
  }

export async function createRoom(player: RoomPlayer) {
  const roomId = await generateUniqueRoomCode();

  const room: Room = {
    id: roomId,
    state: "waiting",
    hostId: player.id,
    players: [player],
    settings: DefaultSettings,
    createdAt: Date.now(),
  };

  await updatePlayerRoom(player.id, roomId);
  await saveRoom(room);

  return room;
}

export async function addPlayerToRoom(roomId: string, player: RoomPlayer) {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  if (room.players.length >= 2) {
    throw new AppError("Room is full");
  }

  room.players.push(player);
  await updatePlayerRoom(player.id, roomId);

  await saveRoom(room);

  return room;
}

export async function updateRoomSettings(
  roomId: string,
  socketId: string,
  settings: Settings,
) {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new AppError("Room not found");
  }

  const currentPlayer = room.players.find((p) => p.socketId === socketId);
  if (room.hostId !== currentPlayer?.id) {
    throw new AppError("Only the host can update room settings");
  }

  room.settings = settings;

  await saveRoom(room);

  return room;
}

export async function kickPlayerFromRoom(
  roomId: string,
  kickedPlayerId: string,
  playerId: string,
) {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  const currentPlayer = room.players.find((p) => p.id === playerId);
  if (room.hostId !== currentPlayer?.id) {
    throw new AppError("Only the host can kick players");
  }

  const kickedPlayer = room.players.find((p) => p.id === kickedPlayerId);
  if (!kickedPlayer) {
    throw new AppError("Player to kick not found in room");
  }

  room.players = room.players.filter((player) => player.id !== kickedPlayerId);
  await updatePlayerRoom(kickedPlayer.id, null);
  await saveRoom(room);

  return {room , kickedPlayer};
}

export async function leaveRoom(roomId: string, socketId: string) {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) {
    throw new AppError("Player not found in room");
  }

  room.players = room.players.filter((p) => p.id !== player.id);

  if (room.players.length === 0) {
    await deleteRoom(room.id);
    return null;
  }

  if (!room.players.find((p) => p.id === room.hostId)) {
    room.hostId = room.players[0]!.id;
  }

  await updatePlayerRoom(player.id, null);
  await saveRoom(room);

  return room;
}

export async function reconnectPlayerToRoom(
  roomId: string,
  playerId: string,
  // reconnectToken: string,
  socketId: string,
) {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  const player = room.players.find((p) => p.id === playerId);

  if (!player) {
    throw new AppError("Player not found in room");
  }

  player.socketId = socketId;
  // player.lastHeartbeatAt = Date.now();

  await saveRoom(room);

  return room;
}
