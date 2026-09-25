import { getPlayerById } from "../player/service.js";
import { getFriends } from "./repository.js";

export async function getPresenceWithSocketIds(playerId: string) { 
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

export async function initialFriendPresenceSync(playerId: string) {
  const presenceWithSocketIds = await getPresenceWithSocketIds(playerId);

  const presence = presenceWithSocketIds.map((friend) => ({
    userId: friend.userId,
    online: friend.online,
  }));

  return {presence, presenceWithSocketIds };
}
