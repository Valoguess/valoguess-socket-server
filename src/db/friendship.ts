import { and, eq, or } from "drizzle-orm";
import { db } from "./index.js";
import { friendship } from "./schema.js";

export async function getFriends(playerId: string) {
  const friends = await db
    .select({
      id: friendship.id,
      requesterId: friendship.requesterId,
      receiverId: friendship.receiverId,
    })
    .from(friendship)
    .where(and(
      or(
        eq(friendship.receiverId, playerId),
        eq(friendship.requesterId, playerId),
      ),
      eq(friendship.status, "ACCEPTED"),
    ))
  
  const filteredFriends = friends.map((friend) => {
    if (friend.requesterId === playerId) {
      return {
        id: friend.id,
        friendId: friend.receiverId,
      }
    } else {
      return {
        id: friend.id,
        friendId: friend.requesterId,
      }
    }
  });
  return filteredFriends;
}

export async function areFriends(userId: string, friendId: string) {
  const friendshipRecord = await db.select().from(friendship)
    .where(and(
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
    ));

  if (friendshipRecord.length === 1) {
    return true;
  } else {
    return false;
  }
}