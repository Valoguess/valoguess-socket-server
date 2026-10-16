import "dotenv/config";
import { Server } from "node:http";
import { Socket, Server as SocketServer } from "socket.io";

import { registerHandlers } from "../register.js";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./types.js";

import ENV from "@/env.js";
import { ClientEvents } from "@/shared/consts/events.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";

import {
  handleConnection,
  handleDisconnect,
} from "@/modules/player/presence.js";
import { initRateLimiter, refreshAuth, setSocketData } from "./middleware.js";


export function createSocketServer(server: Server) {
  const io = new SocketServer<
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: [ENV.FRONTEND_URL],
      credentials: true,
    },
  });

  io.use(setSocketData);

  io.on("connection", async (socket: Socket) => {
    initRateLimiter(socket);
    await handleConnection(io, socket);
    registerHandlers(io, socket);

    socket.on(
      ClientEvents.AUTH_REFRESH,
      asyncHandler(socket, refreshAuth(socket)),
    );

    socket.on("disconnecting", async () => {
      await handleDisconnect(io, socket);
    });
  });

  return io;
}
