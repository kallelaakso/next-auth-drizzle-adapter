import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  type InferModel,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 40 }).notNull(),
    emailVerified: timestamp("email_verified"),
    name: varchar("name", { length: 40 }),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex("user_id_unique").on(users.id),
    };
  }
);

export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, "insert">;
