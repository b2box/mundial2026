import { PrismaClient } from "@prisma/client";

// Acepta cualquiera de los nombres que las integraciones (Neon, Vercel
// Postgres, Supabase) le ponen a la connection string.
export const DB_ENV_CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
] as const;

export function resolveDatabaseUrl(): string | undefined {
  for (const name of DB_ENV_CANDIDATES) {
    const v = process.env[name];
    if (v) return v;
  }
  return undefined;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
