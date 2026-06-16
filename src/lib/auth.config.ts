import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET || "erp_production_auth_secret_change_me",
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage =
        nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/signup" ||
        nextUrl.pathname === "/reset-password" ||
        nextUrl.pathname === "/super-admin" ||
        nextUrl.pathname.startsWith("/api");
      console.log("AUTHORIZED CALLBACK:", nextUrl.pathname, "isLoggedIn:", isLoggedIn, "isPublicPage:", isPublicPage);
      return isPublicPage || isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
        token.memberId = (user as any).memberId;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).roles = token.roles;
        (session.user as any).permissions = token.permissions;
        (session.user as any).memberId = token.memberId;
        session.user.name = token.name;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 Hours session max lifetime
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_URL?.startsWith("http://")
      }
    }
  },
  providers: [], // Overridden in auth.ts
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);

