import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type InferModel,
} from "drizzle-orm/pg-core";

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (verificationTokens) => {
    return {
      uniqueIdx: uniqueIndex("verification_token_id_token").on(
        verificationTokens.identifier,
        verificationTokens.token,
      ),
    };
  },
);

export type VerificationToken = InferModel<typeof verificationTokens>;
export type NewVerificationToken = InferModel<
  typeof verificationTokens,
  "insert"
>;
