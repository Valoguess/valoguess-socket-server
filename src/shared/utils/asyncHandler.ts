import { ZodError } from "zod";
import type { Socket } from "socket.io";

import { AppError } from "./error.js";
import { ServerEvents } from "@/shared/consts/events.js";

function emitError(socket: Socket, error: AppError) {
  socket.emit(ServerEvents.ERROR, {
    message: error.message,
    status: error.status,
    errorCode: error.errorCode,
  });
}

export function asyncHandler<T extends any[]>(
  socket: Socket,
  handler: (...args: T) => Promise<void>,
) {
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (err) {
      if (err instanceof AppError) {
        emitError(socket, err);
        return;
      }

      if (err instanceof ZodError) {
        emitError(socket, new AppError("Invalid payload", "INVALID_PAYLOAD"));
        return;
      }

      console.error(err);
      emitError(
        socket,
        new AppError("Internal server error", "INTERNAL_SERVER_ERROR", 500),
      );
    }
  };
}
