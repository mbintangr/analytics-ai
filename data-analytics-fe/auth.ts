import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Add other providers here if needed
  logger: {
    level: "debug",
    log: (level, message, ...args) => {
      console.log(`[BetterAuth] ${level}: ${message}`, ...args);
    },
  },
});
