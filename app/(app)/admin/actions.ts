"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flagFor } from "@/lib/teams";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("No autorizado");
  return user;
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
  const kickoff = new Date(kickoffRaw);
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
    const kickoff = new Date(when.replace(" ", "T"));
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
