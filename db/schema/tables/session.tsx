import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  type InferModel,
} from "drizzle-orm/pg-core";

import { users } from "./user";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  expires: timestamp("expires").notNull(),
});

export type Session = InferModel<typeof sessions>;
export type NewSession = InferModel<typeof sessions, "insert">;
