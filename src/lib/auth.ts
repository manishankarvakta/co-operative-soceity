import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthService } from "@/services/AuthService";
import { loginSchema } from "@/backend/validations/auth";
import { AuditService } from "@/services/AuditService";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || "erp_production_auth_secret_change_me",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate payload parameters
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        try {
          return await AuthService.verifyCredentials(email, password);
        } catch (error) {
          // Returning null forces NextAuth to throw a credential mismatch exception
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user object is returned from authorize()
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
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await AuditService.log({
          userId: user.id,
          action: "LOGIN",
          tableName: "User",
          recordId: user.id,
          newData: { email: user.email }
        });
      }
    },
    async signOut(message) {
      const userId = (message as any).token?.id;
      if (userId) {
        await AuditService.log({
          userId,
          action: "LOGOUT",
          tableName: "User",
          recordId: userId
        });
      }
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
