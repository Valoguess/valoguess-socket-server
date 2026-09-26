import { getPlayerById } from "../player/service.js";
import { addPlayerToRoom, getRoomById, leaveRoom } from "../room/service.js";

import { areFriends } from "@/modules/friends/repository.js";
import { AppError } from "@/shared/utils/error.js";

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
    await leaveRoom(player.roomId, player.id);
  }

  const roomPlayer = {
    id: player.id,
    name: player.name,
    socketId: player.socketId!,
  };

  const room = await addPlayerToRoom(roomId, roomPlayer);
  return room;
}
