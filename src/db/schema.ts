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
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  
  username: varchar("username", { length: 255 })
    .notNull()
    .unique(),
  
  name: text("name")
    .notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  emailVerified: boolean("email_verified")
    .default(false)
    .notNull(),

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

export const friendship = pgTable("friendship", {
  id: uuid("id").primaryKey()
    .defaultRandom(),

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

  status: friendshipStatusEnum("status")
    .default("PENDING")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  
}, (table) => [
  uniqueIndex("friendship_requester_receiver_uidx")
    .on(table.receiverId, table.receiverId),

  index("friendship_requester_idx")
    .on(table.receiverId, table.status),

  index("friendship_receiver_idx")
    .on(table.receiverId, table.status),
]);

export type Friendship = typeof friendship.$inferSelect;