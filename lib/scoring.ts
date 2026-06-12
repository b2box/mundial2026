import { prisma } from "./prisma";
import { POINTS, STAKE_PER_MATCH, TOTAL_MATCHES } from "./constants";

export type LeaderRow = {
  userId: string;
  name: string;
  username: string;
  color: string;
  points: number;
  played: number; // partidos jugados que pronosticó
  wins: number;
  draws: number;
  losses: number;
  missed: number; // partidos jugados que NO pronosticó
  aporte: number; // ARS aportados al pozo (automático: $ por cada pronóstico)
  rank: number; // posición (empates comparten número)
  tied: boolean; // true si comparte posición con otro
};

export function pointsForPick(
  pick: string,
  result: string | null
): number | null {
  if (!result) return null;
  if (result === "DRAW") return POINTS.DRAW;
  return pick === result ? POINTS.WIN : POINTS.LOSS;
}

export async function getLeaderboard(): Promise<{
  rows: LeaderRow[];
  pot: number;
  projectedPot: number; // pozo total si se juegan los 104 partidos
  memberCount: number;
  finishedMatches: number;
  startedMatches: number;
}> {
  const [users, matches, predictions] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany(),
    prisma.prediction.findMany(),
  ]);

  const now = new Date();
  const startedMatches = matches.filter((m) => m.kickoff <= now).length;
  const finishedMatches = matches.filter((m) => m.result).length;

  const matchById = new Map(matches.map((m) => [m.id, m]));

  const rows: LeaderRow[] = users.map((u) => {
    const userPreds = predictions.filter((p) => p.userId === u.id);
    let points = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let played = 0;

    for (const p of userPreds) {
      const match = matchById.get(p.matchId);
      if (!match || !match.result) continue;
      played++;
      const pts = pointsForPick(p.pick, match.result);
      if (pts === null) continue;
      points += pts;
      if (match.result === "DRAW") draws++;
      else if (p.pick === match.result) wins++;
      else losses++;
    }

    // partidos jugados (con resultado) que el usuario no pronosticó
    const predictedFinishedIds = new Set(
      userPreds
        .filter((p) => matchById.get(p.matchId)?.result)
        .map((p) => p.matchId)
    );
    const missed = matches.filter(
      (m) => m.result && !predictedFinishedIds.has(m.id)
    ).length;

    return {
      userId: u.id,
      name: u.name,
      username: u.username,
      color: u.color,
      points,
      played,
      wins,
      draws,
      losses,
      missed,
      // Aporte automático: cada pronóstico hecho suma al pozo
      aporte: userPreds.length * STAKE_PER_MATCH,
      rank: 0,
      tied: false,
    };
  });

  // Orden: puntos, luego victorias (desempate). El nombre solo decide el
  // orden de listado visual, NO la posición: los empates comparten rank.
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });

  // Ranking estilo competición: mismos puntos Y victorias => misma posición
  const sameRank = (a: LeaderRow, b: LeaderRow) =>
    a.points === b.points && a.wins === b.wins;
  rows.forEach((r, i) => {
    r.rank = i > 0 && sameRank(r, rows[i - 1]) ? rows[i - 1].rank : i + 1;
  });
  rows.forEach((r) => {
    r.tied = rows.some((o) => o.userId !== r.userId && o.rank === r.rank);
  });

  // Pozo captado: $ por cada pronóstico hecho (automático al elegir)
  const pot = predictions.length * STAKE_PER_MATCH;
  // Pozo proyectado: los 104 partidos del Mundial × miembros × aporte
  const projectedPot = TOTAL_MATCHES * users.length * STAKE_PER_MATCH;

  return {
    rows,
    pot,
    projectedPot,
    memberCount: users.length,
    finishedMatches,
    startedMatches,
  };
}
