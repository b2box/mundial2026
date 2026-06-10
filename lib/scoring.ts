import { prisma } from "./prisma";
import { POINTS, STAKE_PER_MATCH } from "./constants";

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
  aporte: number; // ARS que debe haber puesto al pozo
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
      // Cada miembro debe poner por cada partido que ya arrancó
      aporte: startedMatches * STAKE_PER_MATCH,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });

  // Pozo: todos los miembros aportan por cada partido que ya arrancó
  const pot = startedMatches * users.length * STAKE_PER_MATCH;

  return { rows, pot, finishedMatches, startedMatches };
}
