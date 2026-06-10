"use server";

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
