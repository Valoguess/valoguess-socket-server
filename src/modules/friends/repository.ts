import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import { friendship } from "@/db/schema.js";
import type { Friend } from "./types.js";

export async function getFriendships(userId: string) {
  if (!userId) return [];

  const friendships = await db.query.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { receiverId: userId },
      ],
    },
    with: {
      requester: {
        columns: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      receiver: {
        columns: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });

  
  const friends: Omit<Friend, "online">[] = [];
  const incoming: Omit<Friend, "online">[] = [];
  const outgoing: Omit<Friend, "online">[] = [];

  if (friendships.length === 0) {
    return {
      friends,
      requests: {
        incoming,
        outgoing,
      },
    };
  }
  
  for (const f of friendships) {
    const isRequester = f.requesterId === userId;

    const friend = isRequester
      ? f.receiver
      : f.requester;

    if (!friend) continue;

    if (f.status === "ACCEPTED") {
      friends.push(friend);
    } else if (f.status === "PENDING") {
      if (isRequester) {
        outgoing.push(friend);
      } else {
        incoming.push(friend);
      }
    }
  }

  return {
    friends,
    requests: {
      incoming,
      outgoing,
    },
  };
}

export async function getFriends(playerId: string) {
  const friends = await db
    .select({
      id: friendship.id,
      requesterId: friendship.requesterId,
      receiverId: friendship.receiverId,
    })
    .from(friendship)
    .where(
      and(
        or(
          eq(friendship.receiverId, playerId),
          eq(friendship.requesterId, playerId),
        ),
        eq(friendship.status, "ACCEPTED"),
      ),
    );

  const filteredFriends = friends.map((friend) => {
    if (friend.requesterId === playerId) {
      return {
        id: friend.id,
        friendId: friend.receiverId,
      };
    } else {
      return {
        id: friend.id,
        friendId: friend.requesterId,
      };
    }
  });
  return filteredFriends;
}

export async function areFriends(userId: string, friendId: string) {
  const friendshipRecord = await db
    .select()
    .from(friendship)
    .where(
      and(
        or(
          and(
            eq(friendship.receiverId, userId),
            eq(friendship.requesterId, friendId),
          ),
          and(
            eq(friendship.receiverId, friendId),
            eq(friendship.requesterId, userId),
          ),
        ),
        eq(friendship.status, "ACCEPTED"),
      ),
    );

  if (friendshipRecord.length === 1) {
    return true;
  } else {
    return false;
  }
}
