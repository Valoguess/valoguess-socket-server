import { defineRelations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  index,
  uniqueIndex,
  pgEnum,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),

  username: varchar("username", { length: 255 }).notNull().unique(),

  name: text("name").notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  emailVerified: boolean("email_verified").default(false).notNull(),

  image: text("image"),

  isAnonymous: boolean("is_anonymous").default(false),

  createdAt: timestamp("created_at", { precision: 6, withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type User = typeof user.$inferSelect;

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
]);

export const friendship = pgTable(
  "friendship",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    receiverId: text("receiver_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    status: friendshipStatusEnum("status").default("PENDING").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("friendship_requester_receiver_uidx").on(
      table.requesterId,
      table.receiverId,
    ),

    index("friendship_requester_idx").on(table.requesterId, table.status),

    index("friendship_receiver_idx").on(table.receiverId, table.status),
  ],
);

export type Friendship = typeof friendship.$inferSelect;

export const gameModeEnum = pgEnum("game_mode", [
  "GUESS_AGENT",
  "IMPOSTER",
  "CODENAMES",
]);

export const game = pgTable(
  "game",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    mode: gameModeEnum("mode").notNull(),

    hostId: text("host_id")
      .notNull()
      .references(() => user.id),

    settings: jsonb("settings").$type<Record<string, unknown>>().notNull(),

    summary: jsonb("summary").$type<Record<string, unknown>>(),

    startedAt: timestamp("started_at"),

    endedAt: timestamp("ended_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("game_created_at_idx").on(table.createdAt),
    index("game_mode_ended_at_idx").on(table.mode, table.endedAt),
  ],
);

export const gamePlayerOutcomeEnum = pgEnum("game_player_outcome", [
  "WIN",
  "LOSS",
  "DRAW",
]);

export const gamePlayer = pgTable(
  "game_player",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    gameId: uuid("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id),

    name: text("name").notNull(),

    tagline: text("tagline"),
    image: text("image"),
    banner: text("banner"),

    teamId: uuid("team_id"),

    outcome: gamePlayerOutcomeEnum("outcome"),

    placement: integer("placement"),
    score: integer("score"),

    details: jsonb("details").$type<Record<string, unknown>>().notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("game_player_game_user_uidx").on(table.gameId, table.userId),
    index("game_player_user_created_idx").on(table.userId, table.createdAt),
    index("game_player_team_idx").on(table.teamId),
  ],
);

export const gameOutcomeEnum = pgEnum("game_outcome", ["WIN", "LOSS", "DRAW"]);

export const gameTeam = pgTable(
  "game_team",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    gameId: uuid("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    outcome: gameOutcomeEnum("outcome"),

    placement: integer("placement"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("game_team_game_idx").on(table.gameId),
    uniqueIndex("game_team_id_game_uidx").on(table.id, table.gameId),
  ],
);

export const gameAwardTypeEnum = pgEnum("game_award_type", [
  "MATCH_MVP",
  "TEAM_MVP",
  "BEST_DEDUCER",
  "MOST_QUESTIONS",
  "CUSTOM",
]);

export const gameAward = pgTable(
  "game_award",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    gameId: uuid("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "cascade" }),

    type: gameAwardTypeEnum("type").notNull(),

    recipientUserId: text("recipient_user_id").references(() => user.id),

    recipientTeamId: uuid("recipient_team_id").references(() => gameTeam.id),

    title: text("title").notNull(),

    description: text("description").notNull(),

    details: jsonb("details").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("game_award_game_idx").on(table.gameId),
    index("game_award_user_idx").on(table.recipientUserId),
  ],
);

export const relations = defineRelations(
  {
    user,
    game,
    gamePlayer,
    gameTeam,
    gameAward,
    friendship,
  },

  (r) => ({
    user: {
      sentFriendRequests: r.many.friendship({
        from: r.user.id,
        to: r.friendship.requesterId,
      }),

      receivedFriendRequests: r.many.friendship({
        from: r.user.id,
        to: r.friendship.receiverId,
      }),
    },

    friendship: {
      requester: r.one.user({
        from: r.friendship.requesterId,
        to: r.user.id,
      }),

      receiver: r.one.user({
        from: r.friendship.receiverId,
        to: r.user.id,
      }),
    },

    game: {
      players: r.many.gamePlayer({
        from: r.game.id,
        to: r.gamePlayer.gameId,
      }),

      teams: r.many.gameTeam({
        from: r.game.id,
        to: r.gameTeam.gameId,
      }),

      awards: r.many.gameAward({
        from: r.game.id,
        to: r.gameAward.gameId,
      }),
    },

    gamePlayer: {
      game: r.one.game({
        from: r.gamePlayer.gameId,
        to: r.game.id,
      }),

      user: r.one.user({
        from: r.gamePlayer.userId,
        to: r.user.id,
      }),

      team: r.one.gameTeam({
        from: r.gamePlayer.teamId,
        to: r.gameTeam.id,
      }),

      awards: r.many.gameAward({
        from: r.gamePlayer.userId,
        to: r.gameAward.recipientUserId,
      }),
    },

    gameTeam: {
      game: r.one.game({
        from: r.gameTeam.gameId,
        to: r.game.id,
      }),

      players: r.many.gamePlayer({
        from: r.gameTeam.id,
        to: r.gamePlayer.teamId,
      }),

      awards: r.many.gameAward({
        from: r.gameTeam.id,
        to: r.gameAward.recipientTeamId,
      }),
    },
  }),
);
