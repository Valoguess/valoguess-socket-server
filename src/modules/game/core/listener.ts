import type { Server, Socket } from "socket.io";

import { getGameById } from "./service.js";
import { guessAgentMapper } from "../guess-agent/mapper.js";
import { createGameSchema, gameIdSchema } from "./schema.js";

import {
  createGuessAgentGame,
  startGuessAgentGame,
} from "../guess-agent/service.js";

import { AppError } from "@/shared/utils/error.js";
import { getPartyById } from "@/modules/party/service.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { updatePlayersGame } from "@/modules/player/service.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";

export function gameCoreListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.GAME_CREATE,
    asyncHandler(socket, async (payload) => {
      const { partyId, mode, settings } = createGameSchema.parse(payload);
      const currPlayerId = socket.data.id;
      const party = await getPartyById(partyId);

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
      const { gameId } = gameIdSchema.parse(payload);
      const currPlayerId = socket.data.id;

      const game = await getGameById(gameId);

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

      if (game.players[0]!.id !== currPlayerId) {
        throw new AppError(
          "Only the game creator can start the game",
          "NOT_GAME_CREATOR",
          403,
        );
      }

      switch (game.mode) {
        case "GUESS_AGENT":
          const updatedGame = await startGuessAgentGame(gameId, currPlayerId);
          for (const player of updatedGame.players) {
            io.to(player.socketId).emit(
              ServerEvents.GAME_SYNC,
              guessAgentMapper(updatedGame, player.id),
            );
          }

          break;
        default:
          throw new AppError("Invalid game mode", "INVALID_GAME_MODE");
      }
    }),
  );
}
