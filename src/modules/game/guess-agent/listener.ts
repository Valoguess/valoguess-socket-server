import type { Server, Socket } from "socket.io";

import { consumeNo } from "./service.js";
import { guessAgentMapper } from "./mapper.js";
import { scheduleGameCleanup } from "../core/cleanup.js";
import { answerQuestion, askQuestion, makeGuess } from "./question.js";

import {
  answerQuestionSchema,
  askQuestionSchema,
  makeGuessSchema,
} from "./schema.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";

export function guessAgentGameListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.CONSUME_NO,
    asyncHandler(socket, async () => {
      const game = await consumeNo(socket.data.id);

      for (const player of game.players) {
        io.to(player.socketId).emit(
          ServerEvents.GAME_SYNC,
          guessAgentMapper(game, player.id),
        );
      }
    })
  )

  socket.on(
    ClientEvents.QUESTION_ASK,
    asyncHandler(socket, async (payload) => {
      const { questionId } = askQuestionSchema.parse(payload);
      const game = await askQuestion(socket.data.id, questionId);

      for (const player of game.players) {
        io.to(player.socketId).emit(
          ServerEvents.GAME_SYNC,
          guessAgentMapper(game, player.id),
        );
      }
    }),
  );

  socket.on(
    ClientEvents.QUESTION_ANSWER,
    asyncHandler(socket, async (payload) => {
      const { answer } = answerQuestionSchema.parse(payload);
      const game = await answerQuestion(socket.data.id, answer);

      for (const player of game.players) {
        io.to(player.socketId).emit(
          ServerEvents.GAME_SYNC,
          guessAgentMapper(game, player.id),
        );
      }
    }),
  );

  socket.on(
    ClientEvents.GUESS_SUBMIT,
    asyncHandler(socket, async (payload) => {
      const { guess } = makeGuessSchema.parse(payload);
      const game = await makeGuess(socket.data.id, guess);

      for (const player of game.players) {
        io.to(player.socketId).emit(
          game.status === "FINISHED" ? ServerEvents.GAME_END : ServerEvents.GAME_SYNC,
          guessAgentMapper(game, player.id),
        );
      }

      if (game.status === "FINISHED") {
        scheduleGameCleanup(io, game);
      }
    }),
  );
}
