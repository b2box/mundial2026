import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/scoring";
import {
  formatARS,
  STAKE_PER_MATCH,
  TOTAL_MATCHES,
  TZ,
  PICK_WINDOW_HOURS,
} from "@/lib/constants";
import { TBD } from "@/lib/teams";
import { MatchCard, type MatchView } from "../components/MatchCard";
import { Onboarding } from "../components/Onboarding";
import { ActivityFeed } from "../components/ActivityFeed";
import { syncResults } from "@/lib/results-sync";

export const dynamic = "force-dynamic";

function dayLabel(d: Date) {
  return d.toLocaleDateString("es-AR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Fecha (AAAA-MM-DD) en hora argentina, para agrupar partidos por día
function argDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string; tour?: string }>;
}) {
  const user = await requireUser();
  const { bienvenida, tour } = await searchParams;

  // resultados automáticos (throttled, no bloquea si la API falla)
  await syncResults();

  const [matches, myPreds, board, lockedPreds] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoff: "asc" } }),
    prisma.prediction.findMany({ where: { userId: user.id } }),
    getLeaderboard(),
    // pronósticos de TODOS en partidos ya cerrados (se revelan al arrancar)
    prisma.prediction.findMany({
      where: { match: { kickoff: { lte: new Date() } } },
      include: { user: { select: { name: true, color: true } } },
    }),
  ]);

  const pickByMatch = new Map(myPreds.map((p) => [p.matchId, p.pick]));
  const myRow = board.rows.find((r) => r.userId === user.id);
  const myRank = myRow?.rank ?? 0;

  const allPicksByMatch = new Map<
    string,
    { name: string; color: string; pick: string }[]
  >();
  for (const p of lockedPreds) {
    if (!allPicksByMatch.has(p.matchId)) allPicksByMatch.set(p.matchId, []);
    allPicksByMatch.get(p.matchId)!.push({
      name: p.user.name,
      color: p.user.color,
      pick: p.pick,
    });
  }

  const now = new Date();
  const upcoming = matches.filter((m) => m.kickoff > now);
  const past = matches.filter((m) => m.kickoff <= now);

  // partidos con ventana abierta (48 hs antes) donde todavía no elegiste
  const toPlay = upcoming.filter(
    (m) =>
      m.homeTeam !== TBD &&
      m.awayTeam !== TBD &&
      m.kickoff.getTime() - now.getTime() <= PICK_WINDOW_HOURS * 3600 * 1000 &&
      !pickByMatch.has(m.id)
  );
  const toPlayIds = new Set(toPlay.map((m) => m.id));
  const pendingPicks = toPlay.length;

  // agrupar el resto de los próximos por día (en hora argentina)
  const groups = new Map<string, typeof upcoming>();
  for (const m of upcoming) {
    if (toPlayIds.has(m.id)) continue;
    const key = argDateKey(m.kickoff);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const toView = (m: (typeof matches)[number]): MatchView => ({
    id: m.id,
    stage: m.stage,
    group: m.group,
    homeTeam: m.homeTeam,
    homeFlag: m.homeFlag,
    awayTeam: m.awayTeam,
    awayFlag: m.awayFlag,
    kickoff: m.kickoff.toISOString(),
    result: m.result as MatchView["result"],
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    userPick: (pickByMatch.get(m.id) as MatchView["userPick"]) ?? null,
  });

  return (
    <div className="space-y-7">
      <Onboarding
        bienvenida={Boolean(bienvenida)}
        forceTour={tour === "1"}
        name={user.name}
        color={user.color}
        projectedPot={board.projectedPot}
        stake={STAKE_PER_MATCH}
      />

      {/* Pozo proyectado + barra de llenado */}
      <section
        data-tour="pozo"
        className="relative rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted mono">
              🏆 Pozo total del Mundial
            </div>
            <div className="text-2xl font-black text-amber pulse-soft">
              {formatARS(board.projectedPot)}
            </div>
          </div>
          <div className="text-right text-xs text-muted mono">
            {TOTAL_MATCHES} partidos × {board.memberCount} cracks ×{" "}
            {formatARS(STAKE_PER_MATCH)}
            <br />
            Podio: 60% / 30% / 10%
          </div>
        </div>

        {/* El contenedor se va llenando partido a partido */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mono text-muted mb-1.5">
            <span>
              📦 Acumulado:{" "}
              <strong className="text-amber">{formatARS(board.pot)}</strong>
            </span>
            <span>
              {Math.round((board.pot / board.projectedPot) * 100)}% ·{" "}
              {Math.round(board.pot / STAKE_PER_MATCH)} pronósticos
            </span>
          </div>
          <div className="h-3.5 rounded-full bg-steel-900 border border-line overflow-hidden">
            <div
              className="h-full hazard grow-x"
              style={{
                width: `${Math.max(
                  board.pot > 0 ? 2 : 0,
                  (board.pot / board.projectedPot) * 100
                )}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-muted mono mt-1">
            Cada pronóstico suma {formatARS(STAKE_PER_MATCH)} al pozo,
            automáticamente
          </div>
        </div>
      </section>

      {/* Resumen */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Pozo acumulado" value={formatARS(board.pot)} accent />
        <Stat label="Tus cajas 📦" value={String(myRow?.points ?? 0)} />
        <Stat
          label="Tu posición"
          value={
            board.finishedMatches > 0 && myRank > 0
              ? `#${myRank}${myRow?.tied ? " (empate)" : ""}`
              : "—"
          }
        />
        <Stat label="Tu aporte" value={formatARS(myRow?.aporte ?? 0)} />
      </section>

      {/* Te toca elegir: lo más importante, arriba de todo */}
      {pendingPicks > 0 ? (
        <section
          data-tour="elegir"
          className="rounded-xl border-2 border-amber bg-amber/10 p-4"
        >
          <h2 className="text-lg font-black flex items-center gap-2">
            ⚡ Te toca elegir ({pendingPicks})
          </h2>
          <p className="text-sm text-muted mt-0.5 mb-3">
            Tocá el equipo que creés que gana. Tenés hasta que arranque cada
            partido — después se sella, y si no elegiste es{" "}
            <strong className="text-rust">0 cajas (como perder)</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {toPlay.map((m, idx) => (
              <MatchCard key={m.id} match={toView(m)} index={idx} />
            ))}
          </div>
        </section>
      ) : (
        upcoming.length > 0 && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">
            ✅ Estás al día: ya elegiste en todos los partidos habilitados.
          </div>
        )
      )}

      {/* Actividad de los miembros */}
      <ActivityFeed />

      {/* Próximos */}
      <section data-tour="proximos">
        <h2 className="text-lg font-black mb-1 flex items-center gap-2">
          📅 Lo que viene
        </h2>
        <p className="text-sm text-muted mb-3">
          Los partidos se habilitan {PICK_WINDOW_HOURS} hs antes (los borrosos
          todavía no se juegan).
        </p>
        {upcoming.length === 0 ? (
          <EmptyState>
            No hay partidos próximos cargados. El admin tiene que cargar el
            fixture en el panel.
          </EmptyState>
        ) : (
          <div className="space-y-5">
            {[...groups.entries()].map(([day, ms]) => (
              <div key={day}>
                <div className="text-xs uppercase tracking-wider text-muted mono mb-2 capitalize">
                  {dayLabel(new Date(day + "T12:00:00"))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ms.map((m, idx) => (
                    <MatchCard key={m.id} match={toView(m)} index={idx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Jugados */}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-lg font-black flex items-center gap-2 list-none">
            <span className="transition-transform group-open:rotate-90">▶</span>
            🚢 Partidos jugados ({past.length})
          </summary>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {past
              .slice()
              .reverse()
              .map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={toView(m)}
                  index={idx}
                  allPicks={allPicksByMatch.get(m.id)}
                />
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        accent
          ? "border-amber/40 bg-amber/10"
          : "border-line bg-steel-850"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted mono">
        {label}
      </div>
      <div
        className={`text-xl font-black mt-1 ${
          accent ? "text-amber pulse-soft" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-steel-850/50 p-8 text-center text-muted text-sm">
      {children}
    </div>
  );
}
