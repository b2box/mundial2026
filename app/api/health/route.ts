import { NextResponse } from "next/server";
import { prisma, DB_ENV_CANDIDATES, resolveDatabaseUrl } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

// Diagnóstico rápido del deploy: qué commit corre y si la base responde.
// No expone secretos, solo flags y conteos.
export async function GET() {
  const info: Record<string, unknown> = {
    app: "b2box-cargo-cup",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "desconocido",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    hasDatabaseUrl: Boolean(resolveDatabaseUrl()),
    dbEnvVarsPresent: DB_ENV_CANDIDATES.filter((k) => process.env[k]),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    db: "sin probar",
    users: null,
    matches: null,
  };

  try {
    await ensureSeeded();
    info.users = await prisma.user.count();
    info.matches = await prisma.match.count();
    info.predictions = await prisma.prediction.count();
    // prueba de escritura real (detecta problemas de pool/pgbouncer)
    await prisma.meta.upsert({
      where: { key: "healthWrite" },
      update: { value: String(Date.now()) },
      create: { key: "healthWrite", value: String(Date.now()) },
    });
    info.dbWrite = "ok";
    info.db = "ok";
    info.ok = true;
  } catch (e) {
    info.db =
      e instanceof Error
        ? e.message.trim().split("\n").filter(Boolean)[0]?.slice(0, 180) ?? "error"
        : "error";
    info.ok = false;
  }

  return NextResponse.json(info);
}
