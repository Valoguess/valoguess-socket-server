import ENV from "@/env.js";
import { getPlayerById } from "../player/service.js";
import { getFriends, getFriendships } from "./repository.js";
import type { Friend, FriendsPayload, FriendsSyncPayload } from "./types.js";
import { redis } from "@/setup/redis.js";

export async function getFriendsPresence(playerId: string) {
  const friends = await getFriends(playerId);
  if (friends.length === 0) return [];

  const keys = friends.map((friend) => `player:${friend.friendId}`);
  const players = await redis.mget(keys);

  return friends.map((friend, index) => ({
    userId: friend.friendId,
    online: Boolean(players[index]),
    socketId: players[index] ? JSON.parse(players[index]!).socketId : null,
  }));
}

export async function getFriendsWithPresence(
  friends: Omit<Friend, "online">[],
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
  const friendships = await getFriendships(userId);
  if (!friendships || Array.isArray(friendships)) {
    return {
      friends: [],
      requests: {
        incoming: [],
        outgoing: [],
      },
    };
  }

  const friends = await getFriendsWithPresence(friendships.friends);

  const friendsData: FriendsSyncPayload = {
    friends,
    requests: friendships.requests,
  };

  return friendsData;
}
