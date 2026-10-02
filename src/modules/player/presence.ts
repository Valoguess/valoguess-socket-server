import type { Server, Socket } from "socket.io";

import { guessAgentMapper } from "../game/guess-agent/mapper.js";
import { savePlayer, getPlayerById, deletePlayer } from "./service.js";
import { getFriendsPresence, initialFriendsSync } from "../friends/service.js";

import {
  getGameById,
  leaveGame,
  reconnectPlayerToGame,
} from "../game/core/service.js";

import {
  getPartyById,
  leaveParty,
  reconnectPlayerToParty,
} from "../party/service.js";

import { AppError } from "@/shared/utils/error.js";
import { ServerEvents } from "@/shared/consts/events.js";

const RECONNECT_GRACE_PERIOD = 60_000;

export async function handleConnection(io: Server, socket: Socket) {
  try {
    let game, party;
    const userId = socket.data.id;
    const player = await getPlayerById(userId);

    if (player) {
      player.socketId = socket.id;
      await savePlayer(player);

      if (player.partyId) {
        party = await reconnectPlayerToParty(
          player.partyId,
          player.id,
          socket.id,
        );
        socket.join(player.partyId);
      }

      if (player.gameId) {
        game = await reconnectPlayerToGame(player.gameId, player.id, socket.id);
        socket.join(player.gameId);
      }
    } else {
      await savePlayer({ ...socket.data, socketId: socket.id });
    }

    if (party) {
      io.to(party.id).emit(ServerEvents.PARTY_SYNC, party);
    } else {
      socket.emit(ServerEvents.PARTY_SYNC, null);
    }

    if (game) {
      for (const player of game.players) {
        io.to(player.socketId).emit(
          ServerEvents.GAME_SYNC,
          guessAgentMapper(game, player.id),
        );
      }
    } else {
      socket.emit(ServerEvents.GAME_SYNC, null);
    }

    const presenceWithSocketIds = await getFriendsPresence(userId);
    const friends = await initialFriendsSync(userId);
    socket.emit(ServerEvents.FRIENDS_SYNC, {
      friends,
    });

    for (const friend of presenceWithSocketIds) {
      if (friend.online && friend.socketId) {
        io.to(friend.socketId).emit(ServerEvents.FRIEND_PRESENCE, {
          userId,
          online: true,
        });
      }
    }

    console.log(player ? player.name : socket.id, "connected");
  } catch (error) {
    if (error instanceof AppError) {
      socket.emit(ServerEvents.ERROR, {
        message: error.message,
      });
    }
  }
}

export async function handleDisconnect(io: Server, socket: Socket) {
  try {
    const player = await getPlayerById(socket.data.id);

    if (player) {
      player.socketId = null;
      await savePlayer(player);
      console.log(player ? player.name : socket.id, "disconnected");

      const friends = await getFriendsPresence(player.id);

      for (const friend of friends) {
        if (friend.online && friend.socketId) {
          socket.to(friend.socketId).emit(ServerEvents.FRIEND_PRESENCE, {
            userId: player.id,
            online: false,
          });
        }
      }
      setTimeout(async () => {
        try {
          await handlePlayerInactive(io, player.id);
        } catch (error) {
          console.error(
            `[Presence] Failed to handle inactive player ${player.name}:`,
            error,
          );
        }
      }, RECONNECT_GRACE_PERIOD);
    }
  } catch (error) {
    if (error instanceof AppError) {
      socket.emit(ServerEvents.ERROR, {
        message: error.message,
      });
    }
  }
}

async function handlePlayerInactive(
  io: Server,
  playerId: string,
) {
  try {
    const player = await getPlayerById(playerId);

    if (!player || !player.socketId) {
      return;
    }

    if (player.partyId) {
      const party = await getPartyById(player.partyId);

      if (party) {
        const updatedParty = await leaveParty(party.id, player.id);
        if (updatedParty) {
          io.to(updatedParty.id).emit(ServerEvents.PARTY_SYNC, updatedParty);
        }
      }
    }

    if (player.gameId) {
      const game = await getGameById(player.gameId);

      if (game) {

        switch (game.mode) {
          case "GUESS_AGENT":
            const updatedGame = await leaveGame(game.id, player.id);
            if (game.players.length === 1) break;

            if (updatedGame) {
              for (const player of updatedGame.players) {
                io.to(player.socketId).emit(
                  ServerEvents.GAME_SYNC,
                  guessAgentMapper(updatedGame, player.id),
                );
              }
            } else {
              io.to(game.id).emit(ServerEvents.GAME_SYNC, null);
            }
            break;
          default:
            break;
        }
      }
    }

    await deletePlayer(player.id);
  } catch (error) {
    console.error(
      `[Presence] Failed to handle inactive player ${playerId}:`,
      error,
    );
  }
}
