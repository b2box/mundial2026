"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function savePrediction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "No autenticado." };

  const matchId = String(formData.get("matchId") ?? "");
  const pick = String(formData.get("pick") ?? "");
  if (!matchId || (pick !== "HOME" && pick !== "AWAY")) {
    return { error: "Datos inválidos." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partido no encontrado." };

  if (match.kickoff <= new Date()) {
    return { error: "El partido ya arrancó, no se puede pronosticar." };
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { pick },
    create: { userId: user.id, matchId, pick },
  });

  revalidatePath("/");
  revalidatePath("/mi-cuenta");
  return { ok: true };
}
