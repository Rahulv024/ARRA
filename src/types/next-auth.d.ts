// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;             // <-- add id
      role?: "ADMIN" | "USER"; // optional: your Role enum
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: "ADMIN" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "USER";
  }
}
