import { PrismaClient } from "@prisma/client";

// Global object to prevent multiple Prisma client instances during Next.js hot-reloads
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (!globalForPrisma.prisma) {
  prisma.$use(async (params, next) => {
    const immutableModels = ["JournalEntry", "JournalLine"];
    if (immutableModels.includes(params.model || "")) {
      const forbiddenActions = ["update", "updateMany", "delete", "deleteMany", "upsert"];
      if (forbiddenActions.includes(params.action)) {
        throw new Error(`Immutable ledger error: Modification of ${params.model} is strictly forbidden.`);
      }
    }
    return next(params);
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
