import { leaveRoom } from "../room/service.js";

import { redis } from "@/setup/redis.js";
import { getFriends } from "@/modules/friends/repository.js";
import { AppError } from "@/shared/utils/error.js";
import type { Player } from "@/shared/consts/types.js";

const PLAYER_PREFIX = "player:";
const PLAYER_TTL = 60 * 10; // 10 minutes

const playerKey = (playerId: string) => `${PLAYER_PREFIX}${playerId}`;

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
      return player ? (JSON.parse(player) as Player) : null;
    }),
  );

  return players.filter((player): player is Player => player !== null);
}

export async function deletePlayer(playerId: string) {
  await redis.del(playerKey(playerId));
}

export async function handleHeartbeat(playerId: string) {
  const player = await getPlayerById(playerId);

  if (!player) {
    throw new AppError("Player not found");
  }

  player.lastHeartbeatAt = Date.now();
  await savePlayer(player);
}

export async function updatePlayerRoom(
  playerId: string,
  roomId: string | null,
) {
  const player = await getPlayerById(playerId);
  if (!player) {
    throw new AppError("Player not found");
  }

  player.roomId = roomId;
  await savePlayer(player);
}

export async function getFriendsWithPresence(playerId: string) {
  const friends = await getFriends(playerId);

  const presenceWithSocketIds = await Promise.all(
    friends.map(async (friend) => {
      const player = await getPlayerById(friend.friendId);
      return {
        userId: friend.friendId,
        online: player?.socketId != null,
        socketId: player?.socketId,
      };
    }),
  );

  return presenceWithSocketIds;
}

export async function handlePlayerInactive(player: Player) {
  if (player.roomId) {
    await leaveRoom(player.roomId, player.id);
  }

  await deletePlayer(player.id);
}
