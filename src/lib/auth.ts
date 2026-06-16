import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { AuthService } from "@/services/AuthService";
import { loginSchema } from "@/backend/validations/auth";
import { AuditService } from "@/services/AuditService";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          console.error("NextAuth Authorize Error:", error);
          // Returning null forces NextAuth to throw a credential mismatch exception
          return null;
        }
      }
    })
  ],
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
});

