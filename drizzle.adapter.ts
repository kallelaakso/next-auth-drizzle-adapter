import { and, eq } from "drizzle-orm/expressions";
import {
  type PgDatabase,
  type PgSession,
  type QueryResultHKT,
} from "drizzle-orm/pg-core";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { type ProviderType } from "next-auth/providers";

import {
  accounts,
  sessions,
  users,
  verificationTokens,
  type NewAccount,
  type NewSession,
  type NewUser,
  type NewVerificationToken,
  type User,
} from "./db/schema";

export default function DrizzlePgAdapter(
  dbClient: PgDatabase<QueryResultHKT, PgSession>
): Adapter {
  return {
    async createUser(userData): Promise<AdapterUser> {
      const existingUsers = await dbClient
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      const userWithEmailExists =
        existingUsers?.length > 0 && isValidUser(existingUsers[0]);

      if (userWithEmailExists) {
        return {
          id: `${existingUsers[0]?.id}`,
          email: existingUsers[0].email,
          emailVerified: existingUsers[0].emailVerified,
        };
      }

      const newUser: NewUser = {
        email: userData.email,
        name: userData.name,
      };

      const createdUsers = await dbClient
        .insert(users)
        .values(newUser)
        .returning();

      const created = createdUsers[0];

      if (!created) {
        throw new Error(`User creation failed: ${created}`);
      }

      return {
        id: `${created?.id}`,
        email: created?.email,
        emailVerified: created?.emailVerified,
      };
    },
    async getUser(id): Promise<AdapterUser> {
      const foundUsers = await dbClient
        .select({
          id: users.id,
          email: users.email,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, Number(id)));

      if (foundUsers?.length !== 1 || !foundUsers[0]) {
        throw new Error(`Unknown user: ${foundUsers[0]}`);
      }

      return {
        id: `${foundUsers[0].id}`,
        email: foundUsers[0].email,
        emailVerified: foundUsers[0].emailVerified,
      };
    },
    async getUserByEmail(email) {
      const foundUsers = await dbClient
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (foundUsers?.length !== 1 || !foundUsers[0]) {
        return null;
      }

      return {
        id: `${foundUsers[0].id}`,
        email: foundUsers[0].email,
        emailVerified: foundUsers[0].emailVerified,
      };
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const foundAccount = await dbClient
        .select({ userId: accounts.userId })
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        );

      if (foundAccount?.length !== 1 || !foundAccount[0]?.userId) {
        return null;
      }

      const foundUsers = await dbClient
        .select()
        .from(users)
        .where(eq(users.id, foundAccount[0]?.userId));

      if (foundUsers?.length !== 1) {
        throw new Error(
          `Expected 1 user to be found, got ${foundUsers.length}`
        );
      }

      const foundUser = foundUsers[0];

      if (!foundUser?.id || !foundUser?.email) {
        throw new Error(`Unknown user: ${foundUser}`);
      }

      return {
        id: `${foundUser.id}`,
        email: foundUser.email,
        emailVerified: foundUser.emailVerified,
      };
    },
    async updateUser(user) {
      const foundUsers = await dbClient
        .select()
        .from(users)
        .where(eq(users.id, Number(user.id)));

      if (foundUsers?.length !== 1) {
        throw new Error(
          `Expected 1 user to be found, got ${foundUsers.length}`
        );
      }

      const foundUser = foundUsers[0];

      if (!foundUser?.id || !foundUser?.email || !foundUser?.emailVerified) {
        throw new Error(`Unknown user: ${foundUser}`);
      }

      const updatedUsers = await dbClient
        .update(users)
        .set({
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          image: user.image,
        })
        .where(eq(users.id, foundUser.id))
        .returning();

      const updatedUser = updatedUsers[0];

      if (
        !updatedUser?.id ||
        !updatedUser?.email ||
        !updatedUser?.emailVerified
      ) {
        throw new Error(`Unknown user: ${updatedUser}`);
      }

      return {
        id: `${updatedUser.id}`,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      };
    },
    // deleteUser is not currently used by NextAuth.js but will be required in a future release
    async deleteUser(userId) {
      const foundUsers = await dbClient
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)));

      if (foundUsers?.length !== 1) {
        throw new Error(
          `Expected 1 user to be found, got ${foundUsers.length}`
        );
      }

      const foundUser = foundUsers[0];

      if (!foundUser?.id || !foundUser?.email || !foundUser?.emailVerified) {
        throw new Error(`Unknown user: ${foundUser}`);
      }

      const deletedUsers = await dbClient
        .delete(users)
        .where(eq(users.id, foundUser.id))
        .returning();

      const deletedUser = deletedUsers[0];

      if (
        !deletedUser?.id ||
        !deletedUser?.email ||
        !deletedUser?.emailVerified
      ) {
        throw new Error(`Unknown user: ${deletedUser}`);
      }

      return {
        id: `${deletedUser.id}`,
        email: deletedUser.email,
        emailVerified: deletedUser.emailVerified,
      };
    },
    async linkAccount(account) {
      // Create account
      const newAccount: NewAccount = {
        providerAccountId: account.providerAccountId,
        provider: account.provider,
        type: account.type,
        userId: Number(account.userId),
      };

      console.log("###########################################");
      console.log(newAccount);

      const createdAccounts = await dbClient
        .insert(accounts)
        .values(newAccount)
        .returning();
      console.log(createdAccounts);
      console.log("###########################################");

      if (createdAccounts?.length !== 1) {
        return null;
      }

      const createdAccount = createdAccounts[0];

      if (!createdAccount) {
        return null;
      }

      return {
        type: createdAccount.type as ProviderType,
        providerAccountId: createdAccount.providerAccountId,
        provider: createdAccount.provider,
        userId: `${createdAccount.userId}`,
      };
    },
    // deleteUser is not currently used by NextAuth.js but will be required in a future release
    // todo: implement
    async unlinkAccount({ providerAccountId, provider }) {
      console.log("unlinkAccount", providerAccountId, provider);
      await new Promise(() => true);
      return;
    },
    async createSession({ sessionToken, userId, expires }) {
      // Create account
      const newSession: NewSession = {
        sessionToken: sessionToken,
        expires: expires,
        userId: Number(userId),
      };
      const createdSessions = await dbClient
        .insert(sessions)
        .values(newSession)
        .returning();

      if (createdSessions?.length !== 1) {
        throw new Error(
          `Expected 1 session to be created, got ${createdSessions.length}`
        );
      }

      const createdSession = createdSessions[0];

      if (!createdSession) {
        throw new Error(`Unknown session: ${createdSession}`);
      }

      return {
        sessionToken: createdSession.sessionToken,
        expires: createdSession.expires,
        userId: `${createdSession.userId}`,
      };
    },
    async getSessionAndUser(sessionToken) {
      const foundSessions = await dbClient
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken));

      if (foundSessions?.length !== 1 || !foundSessions[0]) {
        return null;
      }

      const session = foundSessions[0];

      const foundUsers = await dbClient
        .select()
        .from(users)
        .where(eq(users.id, Number(session?.userId)));

      if (foundUsers?.length !== 1) {
        return null;
      }

      const user = foundUsers[0];
      if (!user) {
        throw new Error(`Unknown user: ${user}`);
      }

      return {
        session: {
          ...session,
          userId: `${session.userId}`,
        },
        user: {
          ...user,
          id: `${user.id}`,
        },
      };
    },
    async updateSession({ sessionToken }) {
      const foundSessions = await dbClient
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken));

      if (foundSessions?.length !== 1) {
        throw new Error(
          `Expected 1 session to be found, got ${foundSessions.length}`
        );
      }

      const session = foundSessions[0];
      if (!session) {
        throw new Error(`Unknown session: ${session}`);
      }

      const updatedSessions = await dbClient
        .update(sessions)
        .set({
          expires: session.expires,
          sessionToken: session.sessionToken,
        })
        .where(eq(sessions.id, session.id))
        .returning();

      const updatedSession = updatedSessions[0];

      if (!updatedSession) {
        throw new Error(`Unknown session: ${updatedSession}`);
      }

      return {
        ...session,
        userId: `${session.userId}`,
      };
    },
    async deleteSession(sessionToken) {
      const foundSessions = await dbClient
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken));

      if (foundSessions?.length !== 1) {
        throw new Error(
          `Expected 1 session to be found, got ${foundSessions.length}`
        );
      }

      const foundSession = foundSessions[0];

      if (!foundSession) {
        throw new Error(`Unknown session: ${foundSession}`);
      }

      const deletedSessions = await dbClient
        .delete(sessions)
        .where(eq(sessions.id, foundSession.id))
        .returning();

      const deletedSession = deletedSessions[0];

      if (!deletedSession) {
        throw new Error(`Unknown user: ${deletedSession}`);
      }

      return {
        id: `${deletedSession.id}`,
        sessionToken: deletedSession.sessionToken,
        expires: deletedSession.expires,
        userId: `${deletedSession.userId}`,
      };
    },
    async createVerificationToken({ identifier, expires, token }) {
      // Create account
      const newVerificationToken: NewVerificationToken = {
        identifier: identifier,
        expires: expires,
        token: token,
      };
      const createdTokens = await dbClient
        .insert(verificationTokens)
        .values(newVerificationToken)
        .returning();

      if (createdTokens?.length !== 1) {
        throw new Error(
          `Expected 1 verification token to be created, got ${createdTokens.length}`
        );
      }

      const createdToken = createdTokens[0];

      if (!createdToken) {
        throw new Error(`Unknown session: ${createdToken}`);
      }

      return {
        identifier: createdToken.identifier,
        expires: createdToken.expires,
        token: createdToken.token,
      };
    },
    async useVerificationToken({ identifier, token }) {
      try {
        const foundTokens = await dbClient
          .select()
          .from(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, token)
            )
          );

        if (foundTokens?.length !== 1) {
          throw new Error(
            `Expected 1 token to be found, got ${foundTokens.length}`
          );
        }

        const foundToken = foundTokens[0];

        if (!foundToken) {
          throw new Error(`Unknown token: ${foundToken}`);
        }

        const deletedTokens = await dbClient
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, token)
            )
          )
          .returning();

        const deletedToken = deletedTokens[0];

        if (!deletedToken) {
          throw new Error(`Unknown token: ${deletedToken}`);
        }

        return {
          identifier: deletedToken.identifier,
          expires: deletedToken.expires,
          token: deletedToken.token,
        };
      } catch (error) {
        return null;
      }
    },
  };
}

const isValidUser = (user: User): boolean => {
  return !!user?.id && !!user?.email;
};
