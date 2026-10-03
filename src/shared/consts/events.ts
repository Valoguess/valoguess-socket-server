export const ClientEvents = {
  // ==== PLAYER EVENTS ====

  PLAYER_HEARTBEAT: "player:heartbeat",

  // ==== FRIEND EVENTS ====

  FRIEND_REQUEST_SEND: "friend:request:send",
  FRIEND_REQUEST_ACCEPT: "friend:request:accept",
  FRIEND_REQUEST_DECLINE: "friend:request:decline",

  // ==== PARTY EVENTS ====

  PARTY_CREATE: "party:create",

  PARTY_LEAVE: "party:leave",
  PARTY_KICK: "party:kick",

  PARTY_INVITE_SEND: "party:invite:send",
  PARTY_INVITE_ACCEPT: "party:invite:accept",
  PARTY_INVITE_DECLINE: "party:invite:decline",

  PARTY_CHAT: "party:chat",

  // ==== GAME EVENTS ====

  GAME_CREATE: "game:create",
  GAME_START: "game:start",

  // ==== GUES AGENT SPECIFIC GAME EVENTS ====

  QUESTION_ASK: "question:ask",
  QUESTION_ANSWER: "question:answer",
  GUESS_SUBMIT: "guess:submit",
} as const;

export const ServerEvents = {
  PARTY_SYNC: "party:sync",
  PARTY_CHAT_SYNC: "party:chat:sync",
  PARTY_INVITE_SYNC: "party:invite:sync",

  FRIENDS_SYNC: "friends:sync",
  FRIEND_PRESENCE: "friends:presence",

  FRIEND_REQUEST: "friend:request",
  FRIEND_REQUEST_ACCEPTED: "friend:request:accepted",
  FRIEND_REQUEST_DECLINED: "friend:request:declined",

  GAME_SYNC: "game:sync", 

  ERROR: "app:error",
} as const;


