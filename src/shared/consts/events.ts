export const ClientEvents = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_UPDATE: "room:update",
  ROOM_KICK: "room:kick",

  INVITE_SEND: "invite:send",
  INVITE_ACCEPT: "invite:accept",
  INVITE_REJECT: "invite:reject",

  ROOM_RECONNECT: "room:reconnect",
  GAME_HEARTBEAT: "game:heartbeat",

  GAME_START: "game:start",

  QUESTION_ASK: "question:ask",
  QUESTION_ANSWER: "question:answer",
  GUESS_SUBMIT: "guess:submit",

  PLAYER_HEARTBEAT: "player:heartbeat",

  // TURN_END: "turn:end",

  CHAT_SEND: "chat:send",
} as const;

export const ServerEvents = {
  ROOM_SYNC: "room:sync",

  GAME_STARTED: "game:started",
  // GAME_UPDATED: "game:updated",
  GAME_OVER: "game:over",

  CHAT_MESSAGE: "chat:message",

  INVITE_SYNC: "invite:sync",
  FRIENDS_SYNC: "friends:sync",
  FRIENDS_PRESENCE: "friends:presence",

  AUTH: "auth",
  ERROR: "app:error",
} as const;


