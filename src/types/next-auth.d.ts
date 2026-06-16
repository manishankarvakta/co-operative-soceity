import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    roles?: string[];
    permissions?: string[];
    memberId?: string | null;
    name?: string | null;
  }

  interface Session {
    user: {
      id: string;
      roles?: string[];
      permissions?: string[];
      memberId?: string | null;
      name?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    permissions?: string[];
    memberId?: string;
  }
}
