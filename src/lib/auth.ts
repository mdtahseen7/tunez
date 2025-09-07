import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";

import type { Adapter } from "next-auth/adapters";

import { authConfig } from "@/config/auth";
import { db } from "./db";
import { users } from "./db/schema";
import { env } from "./env";

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  ...authConfig,
  // Explicit secret + trustHost to avoid callback issues locally
  secret: env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV !== "production",

  adapter: DrizzleAdapter(db) as Adapter,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    newUser: "/signup",
  },

  events: {
    linkAccount: async ({ user }) => {
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id!));
    },
  },

  callbacks: {
    jwt: async ({ token }) => {
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, token.sub!),
      });

      if (user) {
        const { id, name, email, username, image: picture } = user;

        token = {
          ...token,
          id,
          name,
          email,
          username,
          picture,
        };
      }

      return token;
    },

    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        const { id, name, email, username, picture: image } = token;

        session.user = {
          ...session.user,
          id,
          name,
          email,
          username,
          image,
        };
      }

      return session;
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[auth][warn]", code);
    },
    debug(code, metadata) {
      console.log("[auth][debug]", code, metadata ?? "");
    },
  },
});

/**
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export async function getUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Checks if the current user is authenticated
 * If not, redirects to the login page
 */
export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};
