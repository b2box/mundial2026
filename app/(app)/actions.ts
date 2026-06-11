"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PICK_WINDOW_HOURS } from "@/lib/constants";
import { TBD } from "@/lib/teams";

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

  if (match.homeTeam === TBD || match.awayTeam === TBD) {
    return { error: "Este cruce todavía no está definido." };
  }

  const now = Date.now();
  if (match.kickoff.getTime() <= now) {
    return { error: "El partido ya arrancó, no se puede pronosticar." };
  }
  if (match.kickoff.getTime() - now > PICK_WINDOW_HOURS * 3600 * 1000) {
    return {
      error: `Los pronósticos se habilitan ${PICK_WINDOW_HOURS} hs antes del partido.`,
    };
  }

  try {
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId } },
      update: { pick },
      create: { userId: user.id, matchId, pick },
    });
    // verificación: leer lo guardado antes de confirmar al cliente
    const saved = await prisma.prediction.findUnique({
      where: { userId_matchId: { userId: user.id, matchId } },
    });
    if (!saved || saved.pick !== pick) {
      return { error: "No se pudo confirmar el guardado. Probá de nuevo." };
    }
  } catch {
    return { error: "Error de conexión con la base. Tocá de nuevo el equipo." };
  }

  revalidatePath("/");
  revalidatePath("/mi-cuenta");
  revalidatePath("/tabla");
  return { ok: true };
}
