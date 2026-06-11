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
import { WelcomeSplash } from "../components/WelcomeSplash";

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
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const user = await requireUser();
  const { bienvenida } = await searchParams;

  const [matches, myPreds, board] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoff: "asc" } }),
    prisma.prediction.findMany({ where: { userId: user.id } }),
    getLeaderboard(),
  ]);

  const pickByMatch = new Map(myPreds.map((p) => [p.matchId, p.pick]));
  const myRow = board.rows.find((r) => r.userId === user.id);
  const myRank = board.rows.findIndex((r) => r.userId === user.id) + 1;

  const now = new Date();
  const upcoming = matches.filter((m) => m.kickoff > now);
  const past = matches.filter((m) => m.kickoff <= now);

  // pronósticos pendientes: solo partidos con ventana abierta (48 hs antes)
  const pendingPicks = upcoming.filter(
    (m) =>
      m.homeTeam !== TBD &&
      m.awayTeam !== TBD &&
      m.kickoff.getTime() - now.getTime() <= PICK_WINDOW_HOURS * 3600 * 1000 &&
      !pickByMatch.has(m.id)
  ).length;

  // agrupar próximos por día (en hora argentina)
  const groups = new Map<string, typeof upcoming>();
  for (const m of upcoming) {
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
    userPick: (pickByMatch.get(m.id) as MatchView["userPick"]) ?? null,
  });

  return (
    <div className="space-y-7">
      {bienvenida && (
        <WelcomeSplash
          name={user.name}
          color={user.color}
          projectedPot={board.projectedPot}
          stake={STAKE_PER_MATCH}
          totalMatches={TOTAL_MATCHES}
          memberCount={board.memberCount}
        />
      )}

      {/* Pozo proyectado */}
      <section className="relative rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 overflow-hidden">
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
      </section>

      {/* Resumen */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Pozo acumulado" value={formatARS(board.pot)} accent />
        <Stat label="Tus cajas 📦" value={String(myRow?.points ?? 0)} />
        <Stat
          label="Tu posición"
          value={myRank > 0 ? `#${myRank}` : "—"}
        />
        <Stat label="Tu aporte" value={formatARS(myRow?.aporte ?? 0)} />
      </section>

      {pendingPicks > 0 && (
        <div className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          ⚠️ Tenés{" "}
          <strong className="text-amber">
            {pendingPicks} partido{pendingPicks > 1 ? "s" : ""}
          </strong>{" "}
          próximos sin pronosticar. Cada uno son {formatARS(STAKE_PER_MATCH)} al
          pozo.
        </div>
      )}

      {/* Próximos */}
      <section>
        <h2 className="text-lg font-black mb-3 flex items-center gap-2">
          📦 Próximos envíos
        </h2>
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
        <section>
          <h2 className="text-lg font-black mb-3 flex items-center gap-2">
            🚢 Despachados
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {past
              .slice()
              .reverse()
              .map((m, idx) => (
                <MatchCard key={m.id} match={toView(m)} index={idx} />
              ))}
          </div>
        </section>
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
