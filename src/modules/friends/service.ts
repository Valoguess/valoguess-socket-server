import ENV from "@/env.js";
import { getPlayerById } from "../player/service.js";
import { getFriends } from "./repository.js";
import type { Friend, FriendsPayload, FriendsSyncPayload } from "./types.js";
import { redis } from "@/setup/redis.js";

export async function getFriendsPresence(playerId: string) { 
  const friends = await getFriends(playerId)

  return await Promise.all(
    friends.map(async (friend) => {
      const player = await getPlayerById(friend.friendId);
      return {
        userId: friend.friendId,
        online: player?.socketId != null,
        socketId: player?.socketId,
      };
    }),
  );
}

export async function getFriendsWithPresence(
  friends: Friend[],
) {
  if (friends.length === 0) return [];

  const keys = friends.map((friend) => `player:${friend.id}`);

  const players = await redis.mget(keys);

  return friends.map((friend, index) => ({
    ...friend,
    online: Boolean(players[index]),
  }));
}

export async function initialFriendsSync(userId: string) {
  const response = await fetch(`${ENV.NEXTJS_INTERNAL_URL}/api/internal/socket/friends/${userId}`, {
    headers: {
      Authorization: `Bearer ${ENV.INTERNAL_API_SECRET}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch friends: ${response.status}`);
  }

  const responseData = await response.json();
  const data = responseData.data;
  const friends = await getFriendsWithPresence(data.friends);

  const friendsData: FriendsSyncPayload = {
    ...data,
    friends,
  };

  return friendsData;
}