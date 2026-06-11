import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Actividad reciente: quién cargó pronósticos y en qué partido.
// NUNCA expone qué equipo eligió (eso se revela cuando el partido cierra).
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const preds = await prisma.prediction.findMany({
    orderBy: { updatedAt: "desc" },
    take: 15,
    include: {
      user: { select: { name: true, color: true } },
      match: {
        select: {
          homeTeam: true,
          homeFlag: true,
          awayTeam: true,
          awayFlag: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: preds.map((p) => ({
      id: p.id,
      name: p.user.name,
      color: p.user.color,
      match: `${p.match.homeFlag} ${p.match.homeTeam} vs ${p.match.awayTeam} ${p.match.awayFlag}`,
      at: p.updatedAt.toISOString(),
      mine: p.userId === user.id,
    })),
  });
}
