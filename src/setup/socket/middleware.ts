import type { Socket } from "socket.io";
import { createRemoteJWKSet, jwtVerify } from "jose";

import ENV from "@/env.js";
import { AppError } from "@/shared/utils/error.js";
import { RATE_LIMITS } from "@/shared/rateLimit/limits.js";
import { attempt } from "@/shared/rateLimit/tokenBucket.js";
import { getPlayerById, savePlayer } from "@/modules/player/service.js";

const JWKS = createRemoteJWKSet(
  new URL(`${ENV.NEXTJS_INTERNAL_URL}/api/auth/jwks`),
);

async function validateToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${ENV.FRONTEND_URL}`,
    audience: `${ENV.FRONTEND_URL}`,
  });
  return payload;
}

export async function setSocketData(socket: Socket, next: (err?: any) => void) {
  try {
    const token = socket.handshake.auth.token;

    if (typeof token !== "string" || !token) {
      return next(
        new AppError("Authentication required", "AUTH_REQUIRED", 401),
      );
    }

    const payload = await validateToken(token);
    socket.data = {
      id: payload.id as string,
      name: payload.name as string,
    };

    next();
  } catch (error) {
    next(new AppError("Authentication error", "AUTH_ERROR", 401));
  }
}

export const refreshAuth = (socket: Socket) => async (token: string) => {
  const payload = await validateToken(token);

  if (socket.data.id !== payload.id) {
    throw new AppError(
      "Authentication error: Token does not match socket user",
      "auth - error",
      403,
    );
  }

  socket.handshake.auth.token = token;

  const player = await getPlayerById(socket.data.id);
  if (player) {
    player.name = payload.name as string;
    await savePlayer(player);
  }
};

export function initRateLimiter(socket: Socket) {
  socket.use(async ([event], next) => {
    void (async () => {
      try {
        const config = RATE_LIMITS[event as keyof typeof RATE_LIMITS];

        if (!config) return next();

        const result = await attempt(
          `ratelimit:socket:${socket.data.id}:${event}`,
          config,
        );

        if (!result.allowed) {
          return next(new AppError("Too many requests", "RATE_LIMITED", 429));
        }

        next();
      } catch (error) {
        next(error instanceof Error ? error : new Error("Rate limiter failed"));
      }
    })();
  });
}
