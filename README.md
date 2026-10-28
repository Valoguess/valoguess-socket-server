# ValoGuess Socket Server

This is the real-time server for
[ValoGuess](https://github.com/Valoguess/valoguess). It handles parties,
player presence, and live matches over Socket.IO.

The web app handles sign-in and most profile-related actions. This
server verifies the client's JWT, manages active game state, and uses
Redis for temporary data.

## How it works

``` text
Next.js web app
  │
  │ Socket.IO + JWT
  ▼
Socket server
  ├── Authenticates connections
  ├── Manages parties and friends
  ├── Runs match logic and timers
  └── Tracks player presence
       │             │
       ▼             ▼
     Redis       PostgreSQL
  temporary      match history
  game state     and persistent data
```

The socket server verifies JWTs against the JWKS endpoint exposed by the
Next.js app. PostgreSQL stores persistent records, while Redis holds
live state such as parties, active games, presence, and rate-limit data.

## Current features

-   **Parties:** create and join parties, invite friends, and use party
    chat.
-   **Friends and presence:** sync friend requests and show online
    status.
-   **Guess the Agent:** run 1v1 matches with preset or freeform
    questions, turn timers, and secret-agent handling.
-   **Reconnects:** players can reconnect within a 60-second grace
    period and restore their party or match state.
-   **Rate limiting:** Redis-backed token buckets limit incoming socket
    events.
-   **Match history:** completed matches are saved to PostgreSQL.

An Imposter mode is planned for ValoGuess and will be added to the
server as its implementation progresses.

## Tech stack

-   Node.js, TypeScript, and Socket.IO
-   Redis with `ioredis`
-   PostgreSQL with Drizzle ORM
-   `jose` for JWT/JWKS verification
-   Zod for validation
-   `helmet` for HTTP security headers
-   pnpm, `tsdown`, and `tsx`

## Project structure

``` text
src/
├── db/                 # Database connection and schema
├── modules/
│   ├── friends/        # Friend requests and related operations
│   ├── game/
│   │   ├── core/       # Match setup, reconnects, and history
│   │   └── guess-agent/# Guess the Agent game logic and timers
│   ├── party/          # Parties, invites, and chat
│   └── player/         # Player connections and presence
├── setup/
│   ├── redis.ts        # Redis client
│   ├── register.ts     # Register event handlers
│   └── socket/         # Socket setup, auth, and rate limiting
├── shared/             # Constants, rate limits, and utilities
├── env.ts              # Environment variable validation
└── index.ts            # Server entry point
```

## Run locally

You'll need Node.js 22 or later, pnpm, Redis, PostgreSQL, and the
[ValoGuess web app](https://github.com/Valoguess/valoguess) running
locally for authentication.

Clone the repo and install dependencies:

``` bash
git clone https://github.com/Valoguess/valoguess-socket-server.git
cd valoguess-socket-server
pnpm install
```

Copy the example environment file to `.env` and fill in your own values:

``` bash
cp .env.example .env
```

A `compose.yml` is also included for redis:

``` bash
docker compose up -d
```

Start the development server:

``` bash
pnpm run dev
```

## Related repository

-   [ValoGuess web app](https://github.com/Valoguess/valoguess)

## License

[MIT](LICENSE)
