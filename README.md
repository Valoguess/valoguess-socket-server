# ValoGuess Socket Server

The dedicated real-time backend for [ValoGuess](https://github.com/Valoguess/valoguess), a 1v1 tactical deduction web game. Built with Node.js, Socket.IO, Redis, and PostgreSQL, this service handles stateful multiplayer lobbies, matchmaking parties, turn timers, player presence, rate limiting, and in-match deduction logic.

---

## Table of Contents

- [Architecture & Real-Time Flow](#architecture--real-time-flow)
- [Core Systems & Implementation Details](#core-systems--implementation-details)
  - [Authentication via JWKS](#1-authentication-via-jwks)
  - [Token-Bucket Rate Limiting](#2-token-bucket-rate-limiting)
  - [Player Presence & Reconnection Handling](#3-player-presence--reconnection-handling)
  - [Guess the Agent Engine](#4-guess-the-agent-engine)
- [Implemented Socket Events](#implemented-socket-events)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Related Repositories](#related-repositories)
- [License](#license)

---

## Architecture & Real-Time Flow

```
┌────────────────────────────────────────────────────────┐
│                   Next.js Frontend                     │
│        (Issues JWT via Better-Auth & exposes JWKS)     │
└───────────────────────────┬────────────────────────────┘
                            │
               WebSocket Handshake (JWT token)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               ValoGuess Socket Server                  │
│                                                        │
│  1. Handshake Auth: Validate JWT against Next.js JWKS  │
│  2. Token-Bucket Rate Limiter (Redis-backed per event) │
│  3. Player Presence & Reconnection Manager (60s grace) │
│  4. Module Listeners:                                  │
│     ├── Player: Heartbeat & socket-to-player mappings  │
│     ├── Friends: Live request sync & presence updates  │
│     ├── Party: Lobbies, codes (#id), and party chat    │
│     └── Game: Guess Agent state machine & turn timers  │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
      ┌────────────────┐         ┌─────────────────┐
      │  Redis Cache   │         │ PostgreSQL (DB) │
      │  ioredis       │         │ Drizzle ORM     │
      │                │         │                 │
      │ - game:{id}    │         │ - users         │
      │ - player:{id}  │         │ - friendships   │
      │ - party:{id}   │         │ - game records  │
      │ - ratelimit:*  │         │ - match history │
      └────────────────┘         └─────────────────┘
```

---

## Core Systems & Implementation Details

### 1. Authentication via JWKS
Instead of maintaining a separate user credentials store, the socket server relies on Better-Auth running on the Next.js frontend:
- When a client connects, it passes a signed JWT in `socket.handshake.auth.token`.
- The connection middleware (`src/setup/socket/middleware.ts`) verifies the token against the frontend's JWKS endpoint (`${NEXTJS_INTERNAL_URL}/api/auth/jwks`) using `jose`.
- Sockets receive an authenticated `socket.data.id` and `socket.data.name`. Unauthenticated or invalid tokens are rejected with a 401 `AUTH_ERROR`.
- If a session token refreshes mid-session, clients emit `auth:refresh` to re-verify identity without dropping WebSocket connections.

### 2. Token-Bucket Rate Limiting
To prevent socket spam, an interception middleware (`src/setup/socket/middleware.ts` + `src/shared/rateLimit/tokenBucket.ts`) executes a Redis-backed token bucket algorithm for incoming client events:
- Rate limits are configured per event type in `src/shared/rateLimit/limits.ts` (e.g., `QUESTION_ASK`: 3 tokens / 1 refill per second; `GUESS_SUBMIT`: 3 tokens / 1 refill per second; `CHAT_MESSAGE`: 5 tokens / 1 refill per second).
- Excess events return an `app:error` with code `RATE_LIMITED` (429) without crashing the handler.

### 3. Player Presence & Reconnection Handling
Socket connections map directly to persistent player records stored in Redis (`src/modules/player/presence.ts`):
- **Connect**: Binds the active `socketId` to the `playerId`. If the player previously belonged to an active party or in-progress match, they automatically rejoin the relevant Socket.IO room, receive a state sync, and their friends receive a `friends:presence` update (`online: true`).
- **Disconnect & 60s Grace Period**: On socket disconnection, the player's `socketId` is set to `null` and friends are notified (`online: false`). A 60-second timer (`RECONNECT_GRACE_PERIOD`) starts. If the player reconnects before the timer expires, their game and party state are fully restored.
- **Forfeit / Cleanup**: If the player does not reconnect within 60 seconds, `handlePlayerInactive` triggers: the player leaves the party, forfeits their active game, and their Redis record is purged.

### 4. Guess the Agent Engine (`src/modules/game/guess-agent/`)
The primary game mode implements a 1v1 deduction state machine:
- **Game Lifecycle**:
  1. `WAITING`: Players in party room before match start.
  2. `STARTING`: 15-second intro countdown. Two secret agents are randomly dealt from the 26-agent roster (`src/shared/consts/agents.ts`), one to each player.
  3. `PLAYING`: Turn-by-turn question cycle.
  4. `ENDED`: Game concludes when a correct guess is made, maximum guesses/NOs are exhausted, or turn timers run out.
- **Information Hiding**: To prevent client-side inspection or cheating, `guessAgentMapper` filters outgoing `game:sync` payloads so each socket only receives their own `secretAgent`; the opponent's card remains hidden on the server until game conclusion.
- **Modes Supported**:
  - **Preset Mode**: Server samples a balanced pool of questions from `src/shared/consts/questions.ts` categorized across difficulties (low, medium, high). Players alternate asking questions from the pool and answering YES or NO.
  - **Freeform Mode**: Players ask custom verbal/text questions. Answering NO decrements the questioner's NO quota (`maxNos`).
- **Turn Timers**: Handled server-side with Node.js timeouts (`src/modules/game/guess-agent/timer.ts`). If a player fails to act within the round timer, their turn automatically passes or forfeits.
- **Persistence**: Completed matches are saved directly to PostgreSQL (`src/modules/game/core/history.ts`) with player outcomes, secret agents, and questions asked for career history tracking.

---

## Implemented Socket Events

### Client-to-Server (`ClientEvents`)
| Event | Payload | Description |
|---|---|---|
| `player:heartbeat` | `{}` | Keeps active socket connection alive |
| `party:create` | `{}` | Creates a new 2-player party |
| `party:leave` | `{}` | Leaves current party |
| `party:kick` | `{ guestId }` | Host kicks guest from party |
| `party:invite:send` | `{ friendId }` | Sends a party invitation to a friend |
| `party:invite:accept` | `{ partyId }` | Accepts an invitation and joins party |
| `party:invite:decline` | `{ partyId, senderId }` | Declines an incoming party invitation |
| `party:chat` | `{ message }` | Sends a message to party chat |
| `friend:request:send` | `{ receiverId }` | Sends a friend request |
| `friend:request:accept` | `{ requesterId }` | Accepts an incoming friend request |
| `friend:request:decline`| `{ requesterId }` | Declines an incoming friend request |
| `game:create` | `{ mode, settings }` | Creates game instance from current party |
| `game:start` | `{}` | Host initiates match start countdown |
| `game:leave` | `{}` | Forfeits and exits current match |
| `question:ask` | `{ questionId }` | (Preset) Asks question from pool |
| `question:answer` | `{ answer: "YES" \| "NO" }` | Answers opponent's active question |
| `consume:no` | `{}` | (Freeform) Consumes a NO from player's quota |
| `guess:submit` | `{ agentId }` | Submits final accusation guess |
| `auth:refresh` | `{ token }` | Refreshes session token after client re-auth |

### Server-to-Client (`ServerEvents`)
| Event | Payload | Description |
|---|---|---|
| `party:sync` | `Party \| null` | Pushes full party state to party members |
| `party:chat:sync` | `{ userId, message }` | Broadcasts new party chat message |
| `party:invite:sync` | `IncomingPartyInvite` | Delivers party invitation to recipient |
| `friends:sync` | `{ friends }` | Pushes initial friend list on connection |
| `friends:presence` | `{ userId, online }` | Broadcasts friend online status changes |
| `friend:request` | `FriendRequest` | Notifies user of incoming friend request |
| `friend:request:accepted` | `{ userId }` | Notifies that a friend request was accepted |
| `friend:request:declined` | `{ userId }` | Notifies that a friend request was declined |
| `game:sync` | `MaskedGameState \| null` | Pushes updated match state (secret agent hidden) |
| `game:end` | `{ winnerId, reason }` | Emitted when match resolves |
| `app:error` | `{ message, code, statusCode }` | Error notifications and rate limit rejections |

---

## Tech Stack

- **Runtime**: Node.js (ES Modules, TypeScript)
- **WebSockets**: Socket.IO 4.8
- **In-Memory Store**: Redis via `ioredis`
- **Database & ORM**: PostgreSQL via `pg` and Drizzle ORM
- **Security & JWT**: `jose` (JWKS verification), `helmet`
- **Validation**: `zod`
- **Build & Dev Tools**: `tsdown`, `tsx`

---

## Directory Structure

```
src/
├── db/                   # Database connection, Drizzle schema, and user repository
├── modules/
│   ├── friends/          # Friend requests, acceptance, and database mutations
│   ├── game/
│   │   ├── core/         # Session creation, player pairing, reconnects, match history
│   │   └── guess-agent/  # Guess the Agent state machine, turn timers, questions, mapper
│   ├── party/            # Party room lifecycle, codes, invites, and party chat
│   └── player/           # Socket-to-player mappings, presence handler, reconnect grace
├── setup/
│   ├── redis.ts          # ioredis client initialization
│   ├── register.ts       # Module listener registration
│   └── socket/           # Socket server initialization, auth middleware, rate limiting
├── shared/
│   ├── consts/           # Agent roster, question bank, and event name constants
│   ├── rateLimit/        # Token bucket algorithm and per-event limits
│   └── utils/            # Async socket wrapper, error classes, ID generators
├── env.ts                # Environment variable schema validated with Zod
└── index.ts              # HTTP server entrypoint and shutdown handlers
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/)
- Redis instance (running locally or via Docker)
- PostgreSQL database (shared with the Next.js app)
- Running [ValoGuess Next.js frontend](https://github.com/Valoguess/valoguess) (for JWKS validation)

### 1. Clone & Install

```bash
git clone https://github.com/Valoguess/valoguess-socket-server.git
cd valoguess-socket-server
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Next.js Application URLs (for JWKS verification & token validation)
FRONTEND_URL=http://localhost:3000
NEXTJS_INTERNAL_URL=http://localhost:3000

# Databases
DATABASE_URL=postgres://postgres:password@localhost:5432/valoguess
REDIS_URL=redis://localhost:6379
```

### 3. Run Development Server

```bash
pnpm run dev
```

### 4. Production Build & Run

```bash
pnpm run build
pnpm start
```

### Docker Deployment

A `compose.yml` is provided to spin up the socket server alongside Redis:

```bash
docker compose up -d
```

---

## Related Repositories

- **Frontend / Web App**: [Valoguess/valoguess](https://github.com/Valoguess/valoguess) — Next.js 16 web application with tactical UI, Better-Auth, and match board.

---

## License

This project is licensed under the [MIT License](LICENSE).
