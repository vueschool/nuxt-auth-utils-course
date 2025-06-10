import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import type { WebAuthnCredential } from "#auth-utils";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  login: text("login"),
  password: text("password"),
});

export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  ip: text("ip").notNull(),
  timestamp: integer("timestamp").notNull(),
  success: integer("success").notNull(),
});

export const credentials = sqliteTable(
  "credentials",
  {
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    id: text("id").notNull().unique(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" }).notNull(),
    transports: text("transports", { mode: "json" })
      .notNull()
      .$type<WebAuthnCredential["transports"]>(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] })]
);

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, {
    fields: [credentials.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  credentials: many(credentials),
}));
