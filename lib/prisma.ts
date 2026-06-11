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
    if (v) return fixPoolerUrl(v);
  }
  return undefined;
}

// Neon/Vercel suelen dar la URL "pooled" (PgBouncer). Prisma necesita
// pgbouncer=true en esa URL o las escrituras fallan intermitentemente
// ("prepared statement already exists"). Lo agregamos si falta.
function fixPoolerUrl(url: string): string {
  try {
    if (!url.includes("-pooler.")) return url;
    if (/[?&]pgbouncer=/.test(url)) return url;
    return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true&connect_timeout=15";
  } catch {
    return url;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
