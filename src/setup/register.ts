import type { Server as SocketServer, Socket } from "socket.io";
import { gameCoreListener } from "@/modules/game/core/listener.js";
import { playerListener } from "@/modules/player/listener.js";
import { partyListener } from "@/modules/party/listener.js";
import { friendsListener } from "@/modules/friends/listener.js";
import { guessAgentGameListener } from "@/modules/game/guess-agent/listener.js";

export function registerHandlers(io: SocketServer, socket: Socket) {
  // ==== GLOBAL LISTENERS ====

  playerListener(io, socket);
  partyListener(io, socket);
  friendsListener(io, socket);

  // ==== GAME SPECIFIC LISTENERS ====

  gameCoreListener(io, socket);

  // ==== GUESS THE AGENT ====
  
  guessAgentGameListener(io, socket);
}
