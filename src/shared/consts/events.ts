export const ClientEvents = {
  PLAYER_HEARTBEAT: "player:heartbeat",

  FRIEND_REQUEST_SEND: "friend:request:send",
  FRIEND_REQUEST_ACCEPT: "friend:request:accept",
  FRIEND_REQUEST_DECLINE: "friend:request:decline",

  INVITE_SEND: "invite:send",
  INVITE_ACCEPT: "invite:accept",
  INVITE_REJECT: "invite:reject",

  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_UPDATE: "room:update",
  ROOM_KICK: "room:kick",


  ROOM_RECONNECT: "room:reconnect",
  GAME_HEARTBEAT: "game:heartbeat",

  GAME_START: "game:start",

  QUESTION_ASK: "question:ask",
  QUESTION_ANSWER: "question:answer",
  GUESS_SUBMIT: "guess:submit",


  // TURN_END: "turn:end",

  CHAT_SEND: "chat:send",
} as const;

export const ServerEvents = {
  INVITE_SYNC: "invite:sync",

  FRIENDS_SYNC: "friends:sync",
  FRIEND_PRESENCE: "friends:presence",

  FRIEND_REQUEST: "friend:request",
  FRIEND_REQUEST_ACCEPTED: "friend:request:accepted",
  FRIEND_REQUEST_DECLINED: "friend:request:declined",

  ROOM_SYNC: "room:sync",   

  CHAT_MESSAGE: "chat:message",

  ERROR: "app:error",
} as const;


