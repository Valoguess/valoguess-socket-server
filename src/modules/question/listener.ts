import type { Server, Socket } from "socket.io";

import {
  answerQuestionSchema,
  askQuestionSchema,
  makeGuessSchema,
} from "./schema.js";
import { answerQuestion, askQuestion, makeGuess } from "./service.js";

import { roomMapper } from "@/shared/utils/mapper.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ClientEvents, ServerEvents } from "@/shared/consts/events.js";


export function questionListener(io: Server, socket: Socket) {
  socket.on(
    ClientEvents.QUESTION_ASK,
    asyncHandler(socket, async (payload) => {
      const { roomId, questionId } = askQuestionSchema.parse(payload);
      const room = await askQuestion(roomId, socket.data.id, questionId);

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    }),
  );

  socket.on(
    ClientEvents.QUESTION_ANSWER,
    asyncHandler(socket, async (payload) => {
      const { roomId, answer } = answerQuestionSchema.parse(payload);
      const room = await answerQuestion( roomId, socket.data.id, answer );

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    }),
  );

  socket.on(
    ClientEvents.GUESS_SUBMIT,
    asyncHandler(socket, async (payload) => {
      const { roomId, guess } = makeGuessSchema.parse(payload);
      const room = await makeGuess( roomId, socket.data.id, guess );

      for (const player of room.players) {
        io.to(player.socketId).emit(
          ServerEvents.ROOM_SYNC,
          roomMapper(room, player.id),
        );
      }
    }),
  );
}
