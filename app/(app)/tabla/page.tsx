import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/scoring";
import { formatARS, PRIZE_SPLIT } from "@/lib/constants";
import { syncResults } from "@/lib/results-sync";

export const dynamic = "force-dynamic";

export default async function TablaPage() {
  const me = await requireUser();
  await syncResults();
  const { rows, pot, finishedMatches } = await getLeaderboard();

  // sin partidos terminados no hay ranking: la torre se muestra neutral
  const hasRanking = finishedMatches > 0;
  const maxPoints = Math.max(1, ...rows.map((r) => r.points));
  const podium = PRIZE_SPLIT.map((pct) => Math.round(pot * pct));

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            🏗️ La Torre de Contenedores
          </h1>
          <p className="text-sm text-muted">
            {finishedMatches} partido{finishedMatches === 1 ? "" : "s"} con
            resultado · cada caja 📦 vale por la gloria.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide text-muted mono">
            Pozo en juego
          </div>
          <div className="text-2xl font-black text-amber pulse-soft">
            {formatARS(pot)}
          </div>
        </div>
      </div>

      {/* Torre visual */}
      <section className="rounded-xl border border-line bg-steel-850 p-4">
        {!hasRanking && (
          <div className="mb-3 rounded-lg border border-line bg-steel-900 px-3 py-2.5 text-sm text-muted">
            ⏳ Todavía no terminó ningún partido: están todos en la línea de
            largada. El ranking aparece con el primer resultado.
          </div>
        )}
        <div className="space-y-1.5">
          {rows.map((r, i) => {
            const width = hasRanking ? 30 + (r.points / maxPoints) * 70 : 55;
            const isMe = r.userId === me.id;
            return (
              <div key={r.userId} className="flex items-center gap-3">
                <div className="w-6 text-right mono text-sm text-muted">
                  {hasRanking ? r.rank : "–"}
                </div>
                <div
                  className={`relative h-11 rounded-md corrugated flex items-center px-3 min-w-[120px] grow-x ${
                    hasRanking && r.rank === 1 ? "shimmer" : ""
                  }`}
                  style={{
                    width: `${width}%`,
                    background: r.color,
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  <span className="fade-in-late flex items-center min-w-0 w-full">
                    <span className="font-bold text-steel-950 drop-shadow-sm truncate">
                      {hasRanking &&
                        (r.rank === 1 ? (
                          <span className="sparkle">{medal(r.rank - 1)}</span>
                        ) : (
                          medal(r.rank - 1)
                        ))}{" "}
                      {r.name}
                      {isMe && " (vos)"}
                      {hasRanking && r.tied && (
                        <span className="ml-1 text-[10px] font-normal opacity-70">
                          (empate)
                        </span>
                      )}
                    </span>
                    <span className="ml-auto pl-3 font-black text-steel-950">
                      {r.points}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabla detallada */}
      <section className="rounded-xl border border-line bg-steel-850 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted mono border-b border-line">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Miembro</th>
                <th className="px-3 py-2.5 text-center">📦 Cajas</th>
                <th className="px-3 py-2.5 text-center">PJ</th>
                <th className="px-3 py-2.5 text-center">G</th>
                <th className="px-3 py-2.5 text-center">E</th>
                <th className="px-3 py-2.5 text-center">P</th>
                <th className="px-3 py-2.5 text-center hidden sm:table-cell">
                  Faltó
                </th>
                <th className="px-3 py-2.5 text-right">Aporte</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isMe = r.userId === me.id;
                return (
                  <tr
                    key={r.userId}
                    className={`border-b border-line/40 last:border-0 ${
                      isMe ? "bg-amber/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 mono text-muted">
                      {hasRanking ? r.rank : "–"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-sm border border-white/20"
                          style={{ background: r.color }}
                        />
                        <span className={isMe ? "font-bold" : ""}>
                          {r.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-black text-amber">
                      {r.points}
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted">
                      {r.played}
                    </td>
                    <td className="px-3 py-2.5 text-center">{r.wins}</td>
                    <td className="px-3 py-2.5 text-center">{r.draws}</td>
                    <td className="px-3 py-2.5 text-center">{r.losses}</td>
                    <td className="px-3 py-2.5 text-center text-muted hidden sm:table-cell">
                      {r.missed}
                    </td>
                    <td className="px-3 py-2.5 text-right mono text-muted">
                      {formatARS(r.aporte)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reparto del pozo */}
      <section className="relative rounded-xl border border-line bg-steel-850 p-4 overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="confetti" />
          ))}
        </div>
        <h2 className="font-black mb-1">
          <span className="sparkle inline-block">🏆</span> Reparto del pozo
          (podio)
        </h2>
        <p className="text-sm text-muted mb-4">
          Al cierre del Mundial el pozo se reparte entre los tres primeros.
          Primero por cajas; si hay empate, desempata quien ganó más partidos.
          Si aun así siguen iguales, ese premio se reparte entre los empatados.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((pos, i) => {
            // quiénes ocupan esta posición (puede ser 0, 1 o varios empatados)
            const here = hasRanking ? rows.filter((r) => r.rank === pos) : [];
            const label = !hasRanking
              ? "por definir"
              : here.length === 0
                ? "—"
                : here.length === 1
                  ? here[0].name
                  : "Empate: " + here.map((r) => r.name).join(", ");
            return (
              <div
                key={pos}
                className="rounded-lg border border-line bg-steel-900 p-3 text-center"
              >
                <div className="text-2xl">{medal(i)}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted mono mt-1 min-h-8">
                  {Math.round(PRIZE_SPLIT[i] * 100)}% · {label}
                </div>
                <div className="font-black text-amber mt-0.5">
                  {formatARS(podium[i])}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function medal(i: number) {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
}
