import "dotenv/config";
import { Server } from "node:http";
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { Socket, Server as SocketServer } from "socket.io";

import { registerHandlers } from "./register.js";

import ENV from "@/env.js";
import { AppError } from "@/shared/utils/error.js";
import { handleConnection, handleDisconnect } from "@/modules/player/presence.js";

interface SocketData {
  id: string;
  name: string;
}

async function validateToken(token: string) {
  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${ENV.NEXTJS_INTERNAL_URL}/api/auth/jwks`)
    )
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${ENV.FRONTEND_URL}`, 
      audience: `${ENV.FRONTEND_URL}`,
    })
    return payload
  } catch (error) {
    console.error('Token validation failed:', error)
    throw error
  }
}

export function createSocketServer(server: Server) {
  const io = new SocketServer<any,any,any,SocketData>(server, {
    cors: {
      origin: [ENV.FRONTEND_URL],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new AppError("Authentication error: Token is missing"));
    }
    const payload = await validateToken(token)
    socket.data = {
      id: payload.id as string,
      name: payload.name as string,
    };

    next()
  })

  io.on("connection", async (socket: Socket) => {
    console.log(`${socket.id} connected`);
    registerHandlers(io, socket);
    await handleConnection(io, socket);
    
    socket.on("disconnecting", async () => {
      console.log(`${socket.id} disconnected`);
      await handleDisconnect(socket);  
    });
  });

  return io;
}