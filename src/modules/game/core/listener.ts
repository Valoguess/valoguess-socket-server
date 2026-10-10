import type { Server, Socket } from "socket.io";

import { createGameSchema } from "./schema.js";
import { getGameById, leaveGame } from "./service.js";
import { guessAgentMapper } from "../guess-agent/mapper.js";

import {
  beginGuessAgentGame,
  createGuessAgentGame,
  startGuessAgentGame,
} from "../guess-agent/service.js";

import { AppError } from "@/shared/utils/error.js";
import { getPartyById } from "@/modules/party/service.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";
import { getPlayerById, updatePlayersGame } from "@/modules/player/service.js";

export function gameCoreListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.GAME_CREATE,
    asyncHandler(socket, async (payload) => {
      const { mode, settings } = createGameSchema.parse(payload);
      const currPlayerId = socket.data.id;
      const player = await getPlayerById(currPlayerId);
      if (!player) {
        throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
      }

      if (!player.partyId) {
        throw new AppError(
          "Player is not in a party",
          "PLAYER_NOT_IN_PARTY",
          400,
        );
      }

      const party = await getPartyById(player.partyId);

      if (!party) {
        throw new AppError("Party not found", "PARTY_NOT_FOUND", 404);
      }
      if (party.leaderId !== currPlayerId) {
        throw new AppError(
          "Only the party leader can create a game",
          "NOT_PARTY_LEADER",
          403,
        );
      }

      let game;

      switch (mode) {
        case "GUESS_AGENT":
          if (party.members.length !== 2) {
            throw new AppError(
              "Guess Agent mode requires exactly 2 players",
              "INVALID_PLAYER_COUNT",
            );
          }

          game = await createGuessAgentGame(
            currPlayerId,
            party.members,
            settings,
          );

          for (const player of game.players) {
            io.to(player.socketId).emit(
              ServerEvents.GAME_SYNC,
              guessAgentMapper(game, player.id),
            );
          }

          break;
        default:
          throw new AppError("Invalid game mode", "INVALID_GAME_MODE");
      }

      await updatePlayersGame(
        party.members.map((member) => member.id),
        game.id,
      );
    }),
  );

  socket.on(
    ClientEvents.GAME_START,
    asyncHandler(socket, async (payload) => {
      const currPlayerId = socket.data.id;
      const player = await getPlayerById(currPlayerId);
      if (!player) {
        throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
      }

      if (!player.gameId) {
        throw new AppError(
          "Player is not in a game",
          "PLAYER_NOT_IN_GAME",
          400,
        );
      }

      const game = await getGameById(player.gameId);

      if (!game) {
        throw new AppError("Game not found", "GAME_NOT_FOUND", 404);
      }

      if (game.status !== "WAITING") {
        throw new AppError(
          "Game has already started or ended",
          "GAME_ALREADY_STARTED",
          400,
        );
      }

      if (game.hostId !== currPlayerId) {
        throw new AppError(
          "Only the game creator can start the game",
          "NOT_GAME_CREATOR",
          403,
        );
      }

      switch (game.mode) {
        case "GUESS_AGENT":
          const updatedGame = await startGuessAgentGame(
            player.gameId,
            currPlayerId,
          );
          for (const player of updatedGame.players) {
            io.to(player.socketId).emit(
              ServerEvents.GAME_SYNC,
              guessAgentMapper(updatedGame, player.id),
            );
          }

          const timeUntilStart = updatedGame.startingEndsAt! - Date.now();

          setTimeout(
            async () => {
              const startingGame = await beginGuessAgentGame(
                updatedGame,
                currPlayerId,
              );
              for (const player of startingGame.players) {
                io.to(player.socketId).emit(
                  ServerEvents.GAME_SYNC,
                  guessAgentMapper(startingGame, player.id),
                );
              }
            },
            timeUntilStart ? timeUntilStart : 15000,
          ); // 15 seconds countdown

          break;
        default:
          throw new AppError("Invalid game mode", "INVALID_GAME_MODE");
      }
    }),
  );

  socket.on(
    ClientEvents.GAME_LEAVE,
    asyncHandler(socket, async () => {
      const player = await getPlayerById(socket.data.id);

      if (!player) {
        throw new AppError("Player not found", "PLAYER_NOT_FOUND", 404);
      }

      if (!player.gameId) {
        throw new AppError(
          "Player is not in a game",
          "PLAYER_NOT_IN_GAME",
          400,
        );
      }

      const game = await leaveGame(player.gameId, player.id);
      io.to(socket.id).emit(ServerEvents.GAME_SYNC, null);

      if (game) {
        for (const player of game.players) {
          io.to(player.socketId).emit(
            ServerEvents.GAME_SYNC,
            guessAgentMapper(game, player.id),
          );
        }
      }
    }),
  );
}
