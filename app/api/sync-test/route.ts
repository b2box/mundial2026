import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { fetchProviderData, syncResults } from "@/lib/results-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Diagnóstico EN VIVO de la sincronización (solo admin). Corre en el server
// de producción, que sí tiene internet, y muestra qué ve la API ahora mismo.
export async function GET() {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const hasFootballData = Boolean(process.env.FOOTBALL_DATA_TOKEN);
  const { diag } = await fetchProviderData();

  const finishedInDb = await prisma.match.count({ where: { result: { not: null } } });
  const pendingPlayed = await prisma.match.count({
    where: {
      result: null,
      homeTeam: { not: "Por confirmar" },
      awayTeam: { not: "Por confirmar" },
      kickoff: { lte: new Date(Date.now() - 105 * 60 * 1000) },
    },
  });

  return NextResponse.json({
    fuentePreferida: hasFootballData ? "football-data.org" : "TheSportsDB (sin token)",
    diagnostico: diag,
    enLaApp: {
      partidosConResultado: finishedInDb,
      partidosJugadosSinResultadoAun: pendingPlayed,
    },
    veredicto: diag.ok
      ? diag.finished > 0
        ? "✅ La API trae resultados finalizados: el sistema automático funciona."
        : "🟡 La API responde y trae los partidos, pero todavía ninguno finalizó. Se completarán solos al terminar cada partido."
      : "🔴 La API no devolvió datos. Conviene activar football-data.org (token gratis).",
  });
}

// Fuerza una sincronización ya (ignora el throttle no, pero corre el proceso).
export async function POST() {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  // limpiar throttle para forzar
  await prisma.meta.deleteMany({ where: { key: "lastResultsSync" } });
  await syncResults();
  const finishedInDb = await prisma.match.count({ where: { result: { not: null } } });
  return NextResponse.json({ ok: true, partidosConResultado: finishedInDb });
}
