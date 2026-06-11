import "server-only";
import { prisma } from "./prisma";
import { MEMBERS } from "./members";

let schemaReady = false;
let seeded = false;

// Crea las tablas si no existen (Postgres). Idempotente y barato.
// Evita depender de `prisma db push` en el build: el esquema se asegura
// en el primer request. En local con SQLite las tablas ya existen (db push),
// así que estos statements son no-op o se ignoran.
async function ensureSchema() {
  if (schemaReady) return;
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "color" TEXT NOT NULL,
      "isAdmin" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_token_key" ON "User"("token")`,
    `CREATE TABLE IF NOT EXISTS "Match" (
      "id" TEXT NOT NULL,
      "stage" TEXT NOT NULL DEFAULT 'Fase de grupos',
      "group" TEXT,
      "homeTeam" TEXT NOT NULL,
      "homeFlag" TEXT NOT NULL DEFAULT '🏳️',
      "awayTeam" TEXT NOT NULL,
      "awayFlag" TEXT NOT NULL DEFAULT '🏳️',
      "kickoff" TIMESTAMP(3) NOT NULL,
      "result" TEXT,
      "homeScore" INTEGER,
      "awayScore" INTEGER,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
    )`,
    `ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "homeScore" INTEGER`,
    `ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "awayScore" INTEGER`,
    `CREATE TABLE IF NOT EXISTS "Prediction" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "matchId" TEXT NOT NULL,
      "pick" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_userId_matchId_key" ON "Prediction"("userId","matchId")`,
    `CREATE TABLE IF NOT EXISTS "Meta" (
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      CONSTRAINT "Meta_pkey" PRIMARY KEY ("key")
    )`,
  ];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // en SQLite (local) la sintaxis puede diferir, pero las tablas ya existen
    }
  }
  schemaReady = true;
}

// Crea los miembros (con su token) si todavía no existen.
async function ensureMembers() {
  if (seeded) return;
  const count = await prisma.user.count();
  if (count === 0) {
    for (const m of MEMBERS) {
      await prisma.user.upsert({
        where: { username: m.username },
        update: {},
        create: {
          username: m.username,
          name: m.name,
          color: m.color,
          isAdmin: m.isAdmin,
          token: m.token,
        },
      });
    }
  }
  seeded = true;
}

// Asegura esquema + miembros. Se llama al inicio de los puntos de entrada.
export async function ensureSeeded() {
  try {
    await ensureSchema();
    await ensureMembers();
  } catch {
    // si la base aún no está lista, se reintenta en el próximo request
  }
}
