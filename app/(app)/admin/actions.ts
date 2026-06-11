"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flagFor } from "@/lib/teams";
import { FIXTURE_2026 } from "@/lib/fixture2026";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("No autorizado");
  return user;
}

// Interpreta una fecha del input datetime-local como hora argentina (UTC-3)
function parseArgDate(raw: string): Date {
  const clean = raw.trim().replace(" ", "T");
  // si ya trae offset o Z, respetarlo
  if (/[+-]\d{2}:?\d{2}$|Z$/i.test(clean)) return new Date(clean);
  return new Date(`${clean}${clean.length === 16 ? ":00" : ""}-03:00`);
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/mi-cuenta");
}

// Carga el fixture oficial completo (104 partidos). Idempotente: solo
// inserta los que faltan (clave: instancia + equipos + horario).
export async function loadOfficialFixture(): Promise<{
  ok?: number;
  error?: string;
}> {
  await requireAdmin();

  const existing = await prisma.match.findMany({
    select: { stage: true, homeTeam: true, awayTeam: true, kickoff: true },
  });
  const keys = new Set(
    existing.map(
      (m) => `${m.stage}|${m.homeTeam}|${m.awayTeam}|${m.kickoff.toISOString()}`
    )
  );

  const data = FIXTURE_2026.map((f) => ({
    stage: f.stage,
    group: f.group,
    homeTeam: f.home,
    awayTeam: f.away,
    homeFlag: flagFor(f.home),
    awayFlag: flagFor(f.away),
    kickoff: new Date(f.kickoff),
  })).filter(
    (m) =>
      !keys.has(
        `${m.stage}|${m.homeTeam}|${m.awayTeam}|${m.kickoff.toISOString()}`
      )
  );

  if (data.length > 0) {
    await prisma.match.createMany({ data });
  }

  revalidateAll();
  return { ok: data.length };
}

// Edita un partido (equipos, horario, instancia, grupo). Útil para
// completar los cruces de eliminatorias a medida que se definen.
export async function updateMatch(formData: FormData): Promise<{
  ok?: boolean;
  error?: string;
}> {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();
  const group = String(formData.get("group") ?? "").trim() || null;
  const kickoffRaw = String(formData.get("kickoff") ?? "");

  if (!matchId || !homeTeam || !awayTeam || !kickoffRaw) {
    return { error: "Faltan datos." };
  }
  const kickoff = parseArgDate(kickoffRaw);
  if (isNaN(kickoff.getTime())) return { error: "Horario inválido." };

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeTeam,
      awayTeam,
      homeFlag: flagFor(homeTeam),
      awayFlag: flagFor(awayTeam),
      stage: stage || "Fase de grupos",
      group,
      kickoff,
    },
  });

  revalidateAll();
  return { ok: true };
}

export async function createMatch(formData: FormData) {
  await requireAdmin();

  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const stage = String(formData.get("stage") ?? "Fase de grupos").trim();
  const group = String(formData.get("group") ?? "").trim() || null;
  const kickoffRaw = String(formData.get("kickoff") ?? "");

  if (!homeTeam || !awayTeam || !kickoffRaw) {
    return { error: "Faltan datos (equipos y horario son obligatorios)." };
  }
  const kickoff = parseArgDate(kickoffRaw);
  if (isNaN(kickoff.getTime())) return { error: "Horario inválido." };

  await prisma.match.create({
    data: {
      homeTeam,
      awayTeam,
      homeFlag: flagFor(homeTeam),
      awayFlag: flagFor(awayTeam),
      stage,
      group,
      kickoff,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  return { ok: true };
}

export async function setResult(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  const result = String(formData.get("result") ?? "");
  const valid = ["HOME", "AWAY", "DRAW", "CLEAR"];
  if (!matchId || !valid.includes(result)) return;

  await prisma.match.update({
    where: { id: matchId },
    data: { result: result === "CLEAR" ? null : result },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/mi-cuenta");
}

export async function deleteMatch(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return;
  await prisma.prediction.deleteMany({ where: { matchId } });
  await prisma.match.delete({ where: { id: matchId } });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
}

// Genera un nuevo link de acceso para un miembro (invalida el anterior).
export async function regenerateToken(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await prisma.user.update({
    where: { id: userId },
    data: { token: randomBytes(16).toString("base64url") },
  });
  revalidatePath("/admin");
}

// Borra TODOS los pronósticos de un miembro (ej: limpiar datos de prueba).
export async function clearMemberPredictions(
  formData: FormData
): Promise<{ ok?: number; error?: string }> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Falta el miembro." };
  const r = await prisma.prediction.deleteMany({ where: { userId } });
  revalidateAll();
  return { ok: r.count };
}

// Carga masiva de partidos. Formato por línea:
//   Local | Visitante | 2026-06-11 20:00 | A | Fase de grupos
// (el grupo y la instancia son opcionales)
export async function bulkCreateMatches(
  _prev: { ok?: number; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: number; error?: string }> {
  await requireAdmin();
  const raw = String(formData.get("raw") ?? "").trim();
  if (!raw) return { error: "Pegá al menos una línea." };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const data: {
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    kickoff: Date;
    group: string | null;
    stage: string;
  }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split("|").map((p) => p.trim());
    const [home, away, when, group, stage] = parts;
    if (!home || !away || !when) {
      return { error: `Línea ${i + 1}: faltan datos (Local | Visitante | Fecha).` };
    }
    const kickoff = parseArgDate(when);
    if (isNaN(kickoff.getTime())) {
      return { error: `Línea ${i + 1}: fecha inválida "${when}" (usá 2026-06-11 20:00).` };
    }
    data.push({
      homeTeam: home,
      awayTeam: away,
      homeFlag: flagFor(home),
      awayFlag: flagFor(away),
      kickoff,
      group: group || null,
      stage: stage || "Fase de grupos",
    });
  }

  await prisma.match.createMany({ data });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  return { ok: data.length };
}
