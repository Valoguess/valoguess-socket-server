import type { Party, PartyMember } from "./types.js";

import { getPlayerById, savePlayer, updatePlayerParty } from "../player/service.js";

import { redis } from "@/setup/redis.js";
import { AppError } from "@/shared/utils/error.js";
import { areFriends } from "@/modules/friends/repository.js";
import { generateId } from "@/shared/utils/generateId.js";

const PARTY_PREFIX = "party:";
const PARTY_TTL = 60 * 10; // 10 minutes

const partyKey = (partyId: string) => `${PARTY_PREFIX}${partyId}`;

export async function partyExists(partyId: string) {
  return (await redis.exists(partyKey(partyId))) === 1;
}

export async function getPartyById(partyId: string) {
  const party = await redis.get(partyKey(partyId));

  if (!party) return null;

  return JSON.parse(party) as Party;
}

export async function saveParty(party: Party) {
  await redis.setex(partyKey(party.id), PARTY_TTL, JSON.stringify(party));
  return party;
}

export async function deleteParty(partyId: string) {
  await redis.del(partyKey(partyId));
}

export async function createParty(leader: PartyMember) {
  const partyId = generateId();
  const party = {
    id: partyId,
    leaderId: leader.id,
    members: [leader],
  };

  return await saveParty(party);
}

export async function leaveParty(partyId: string, playerId: string) {
  const party = await getPartyById(partyId);

  if (!party) {
    throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
  }

  const playerIndex = party.members.findIndex((p) => p.id === playerId);
  
  if (playerIndex === -1) {
    throw new AppError("Player not found in party", "PLAYER_NOT_FOUND", 404);
  }

  party.members.splice(playerIndex, 1);

  if (party.leaderId === playerId && party.members.length > 0) {
    party.leaderId = party.members[0]!.id;
  }

  await updatePlayerParty(playerId, null);

  if (party.members.length === 0) {
    await deleteParty(partyId);
    return null;
  } else {
    return await saveParty(party);
  }
}

export async function reconnectPlayerToParty(
  partyId: string,
  playerId: string,
  socketId: string,
) {
  const party = await getPartyById(partyId);

  if (!party) {
    throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
  }

  const player = party.members.find((p) => p.id === playerId);

  if (!player) {
    throw new AppError("Player not found in party", "PLAYER_NOT_FOUND", 404);
  }

  player.socketId = socketId;

  return await saveParty(party);
}

export async function invitePlayerToParty(
  partyId: string,
  inviterId: string,
  invitedPlayerId: string,
) {
  const party = await getPartyById(partyId);
  if (!party) {
    throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
  }

  const inviter = party.members.find((p) => p.id === inviterId);
  if (!inviter) {
    throw new AppError("Inviter not found in party", "INVITER_NOT_FOUND", 404);
  }

  const friendsOrNot = await areFriends(inviterId, invitedPlayerId);

  if (!friendsOrNot) {
    throw new AppError(
      "Inviter and invited player are not friends",
      "NOT_FRIENDS",
    );
  }

  const invitedPlayerState = await getPlayerById(invitedPlayerId);
  if (!invitedPlayerState) {
    throw new AppError("Invited player not found", "INVITED_PLAYER_NOT_FOUND", 404);
  }

  if (!invitedPlayerState.socketId) {
    throw new AppError(
      "Invited player is not online",
      "INVITED_PLAYER_NOT_ONLINE",
    );
  }

  if (invitedPlayerState.partyId === partyId) {
    throw new AppError(
      "Invited player is already in the party",
      "INVITED_PLAYER_ALREADY_IN_PARTY",
    );
  }

  return invitedPlayerState.socketId;
}

export async function acceptPartyInvite(partyId: string, playerId: string) {
  const player = await getPlayerById(playerId);
  if (!player) {
    throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  }
  if (player.partyId != null) {
    await leaveParty(player.partyId, player.id);
  }

  const party = await getPartyById(partyId);
  if (!party) {
    throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
  }

  const partyMember = {
    id: player.id,
    name: player.name,
    socketId: player.socketId!,
  };

  party.members.push(partyMember);
  await updatePlayerParty(player.id, party.id);

  return await saveParty(party);
}


export async function kickPlayerFromParty(partyId: string, currPlayerId: string, kickedPlayerId: string) {
  const currPlayer = await getPlayerById(currPlayerId);
  if (!currPlayer) {
    throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
  }
  
  const party = await getPartyById(partyId);
  if (!party) {
    throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
  }
  
  if (party.leaderId !== currPlayer.id) {
    throw new AppError(
      "Only the party leader can kick players",
      "NOT_PARTY_LEADER",
      403,
    );
  }
  
  const kickedPlayer = await getPlayerById(kickedPlayerId);
  if (!kickedPlayer) {
    throw new AppError("Kicked player not found", "PLAYER_NOT_FOUND", 404);
  }
  
  if (kickedPlayer.partyId !== party.id) {
    throw new AppError(
      "Kicked player is not in the party",
      "PLAYER_NOT_IN_PARTY",
      400,
    );
  }

  party.members = party.members.filter((member) => member.id !== kickedPlayerId);
  
  kickedPlayer.partyId = null;

  const [updatedParty, updatedPlayer] = await Promise.all([
    saveParty(party),
    savePlayer(kickedPlayer),
  ]);

  return { updatedParty, kickedPlayerSocketId: updatedPlayer.socketId };
  
}