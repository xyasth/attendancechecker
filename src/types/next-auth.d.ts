import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "employee" | "admin"; 
  }

  interface Session {
    user?: {
      id: string;
      role: "employee" | "admin";
    } & DefaultSession["user"];
  }
}
