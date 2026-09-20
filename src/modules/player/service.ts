import { AppError } from "@/shared/utils/error.js";
import { addPlayerToRoom, getRoomById, leaveRoom, reconnectPlayerToRoom } from "../room/service.js";
import { redis } from "@/setup/redis.js";
import { areFriends } from "@/db/friendship.js";
import type { Player, RoomPlayer } from "@/shared/consts/types.js";
import type { Socket } from "socket.io";

const PLAYER_PREFIX = "player:";
const PLAYER_TTL = 60 * 10; // 10 minutes

const playerKey = (playerId: string) => `${PLAYER_PREFIX}${playerId}`;

export async function handleConnection(socket: Socket) {
  const player = await getPlayerById(socket.data.id);

  if (player) {
    player.socketId = socket.id;
    await savePlayer(player);

    if (player.roomId) {
      const room = await reconnectPlayerToRoom(player.roomId, player.id, socket.id);
      socket.join(player.roomId);
      return room;
    }
  } else {
    await savePlayer({...socket.data, socketId: socket.id})
  }
}

export async function playerExists(playerId: string) {
  return (await redis.exists(playerKey(playerId))) === 1;
}

export async function getPlayerById(playerId: string) {
  const player = await redis.get(playerKey(playerId));

  if (!player) return null;

  return JSON.parse(player) as Player;
}

export async function savePlayer(player: Player) {
  await redis.setex(playerKey(player.id), PLAYER_TTL, JSON.stringify(player));
  return player;
}

export async function getActivePlayers() {
  const keys = await redis.keys(`${PLAYER_PREFIX}*`);
  const players = await Promise.all(
    keys.map(async (key) => {
      const player = await redis.get(key);
      return player ? JSON.parse(player) as Player : null;
    }),
  );

  return players.filter((player): player is Player => player !== null);
}

export async function deletePlayer(playerId: string) {
  await redis.del(playerKey(playerId));
}

export async function updatePlayerRoom(playerId: string, roomId: string | null) {
  const player = await getPlayerById(playerId);
  if (!player) {
    throw new AppError("Player not found");
  }

  player.roomId = roomId;
  await savePlayer(player);
}

export async function invitePlayerToRoom(
  roomId: string,
  inviterId: string,
  invitedPlayer: { id: string; username: string },
) {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new AppError("Room not found");
  }

  const inviter = room.players.find((p) => p.id === inviterId);
  if (!inviter) {
    throw new AppError("Inviter not found in room");
  }

  const friendsOrNot = await areFriends(inviterId, invitedPlayer.id);

  if (!friendsOrNot) {
    throw new AppError("Inviter and invited player are not friends");
  }

  const invitedPlayerState = await getPlayerById(invitedPlayer.id);
  console.log("Invited Player State", invitedPlayerState);
  if (!invitedPlayerState) {
    throw new AppError("Invited player not found");
  }

  if (!invitedPlayerState.socketId) {
    throw new AppError("Invited player is not online");
  }

  if (invitedPlayerState.roomId === roomId) { 
    throw new AppError("Invited player is already in the room");
  }
  return invitedPlayerState.socketId;
}

export async function acceptRoomInvite(roomId: string, playerId: string) {
  const player = await getPlayerById(playerId);
  if (!player) {
    throw new AppError("Player not found");
  }
  if (player.roomId != null) {
    await leaveRoom(player.roomId, player.socketId!);
  } 

  const roomPlayer = {
    id: player.id,
    name: player.name,
    socketId: player.socketId!,
  }

  const room = await addPlayerToRoom(roomId, roomPlayer);
  return room;
}