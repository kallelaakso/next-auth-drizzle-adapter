import {
  integer,
  pgTable,
  serial,
  text,
  type InferModel,
} from "drizzle-orm/pg-core";

import { users } from "./user";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  type: text("type").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expiresAt"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export type Account = InferModel<typeof accounts>;
export type NewAccount = InferModel<typeof accounts, "insert">;
