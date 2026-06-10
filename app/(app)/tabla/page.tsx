import { getSessionUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/scoring";
import { formatARS, PRIZE_SPLIT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TablaPage() {
  const me = (await getSessionUser())!;
  const { rows, pot, finishedMatches } = await getLeaderboard();

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
          <div className="text-2xl font-black text-amber">
            {formatARS(pot)}
          </div>
        </div>
      </div>

      {/* Torre visual */}
      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <div className="space-y-1.5">
          {rows.map((r, i) => {
            const width = 30 + (r.points / maxPoints) * 70;
            const isMe = r.userId === me.id;
            return (
              <div key={r.userId} className="flex items-center gap-3">
                <div className="w-6 text-right mono text-sm text-muted">
                  {i + 1}
                </div>
                <div
                  className="relative h-11 rounded-md corrugated flex items-center px-3 transition-all min-w-[120px]"
                  style={{
                    width: `${width}%`,
                    background: r.color,
                  }}
                >
                  <span className="font-bold text-steel-950 drop-shadow-sm truncate">
                    {medal(i)} {r.name}
                    {isMe && " (vos)"}
                  </span>
                  <span className="ml-auto pl-3 font-black text-steel-950">
                    {r.points}
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
                    <td className="px-3 py-2.5 mono text-muted">{i + 1}</td>
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
      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <h2 className="font-black mb-1">🏆 Reparto del pozo (podio)</h2>
        <p className="text-sm text-muted mb-4">
          Al cierre del Mundial el pozo se reparte entre los tres primeros de la
          torre.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-line bg-steel-900 p-3 text-center"
            >
              <div className="text-2xl">{medal(i)}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted mono mt-1">
                {Math.round(PRIZE_SPLIT[i] * 100)}% · {rows[i]?.name ?? "—"}
              </div>
              <div className="font-black text-amber mt-0.5">
                {formatARS(podium[i])}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function medal(i: number) {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
}
