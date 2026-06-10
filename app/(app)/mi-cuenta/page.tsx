import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaderboard, pointsForPick } from "@/lib/scoring";
import { formatARS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MiCuentaPage() {
  const user = (await getSessionUser())!;

  const [preds, board] = await Promise.all([
    prisma.prediction.findMany({
      where: { userId: user.id },
      include: { match: true },
      orderBy: { match: { kickoff: "desc" } },
    }),
    getLeaderboard(),
  ]);

  const myRow = board.rows.find((r) => r.userId === user.id);
  const rank = board.rows.findIndex((r) => r.userId === user.id) + 1;

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <span
          className="w-12 h-12 rounded-lg corrugated border border-white/20"
          style={{ background: user.color }}
        />
        <div>
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="text-sm text-muted mono">@{user.username}</p>
        </div>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Cajas 📦" value={String(myRow?.points ?? 0)} accent />
        <Stat label="Posición" value={rank > 0 ? `#${rank}` : "—"} />
        <Stat
          label="G / E / P"
          value={`${myRow?.wins ?? 0}/${myRow?.draws ?? 0}/${myRow?.losses ?? 0}`}
        />
        <Stat label="Aporte al pozo" value={formatARS(myRow?.aporte ?? 0)} />
      </section>

      {(myRow?.missed ?? 0) > 0 && (
        <div className="rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-sm">
          😬 Te perdiste <strong>{myRow!.missed}</strong> partido
          {myRow!.missed > 1 ? "s" : ""} ya jugado{myRow!.missed > 1 ? "s" : ""}{" "}
          sin pronosticar. Igual cuentan para tu aporte al pozo.
        </div>
      )}

      <section>
        <h2 className="text-lg font-black mb-3">🧾 Mis pronósticos</h2>
        {preds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-steel-850/50 p-8 text-center text-muted text-sm">
            Todavía no cargaste ningún pronóstico. Andá a{" "}
            <span className="text-amber">Partidos</span> y elegí tus cajas.
          </div>
        ) : (
          <div className="space-y-2">
            {preds.map((p) => {
              const m = p.match;
              const pickedHome = p.pick === "HOME";
              const team = pickedHome ? m.homeTeam : m.awayTeam;
              const flag = pickedHome ? m.homeFlag : m.awayFlag;
              const pts = pointsForPick(p.pick, m.result);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-steel-850 px-3.5 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      {m.homeFlag} {m.homeTeam}{" "}
                      <span className="text-muted">vs</span> {m.awayTeam}{" "}
                      {m.awayFlag}
                    </div>
                    <div className="text-[11px] text-muted mono mt-0.5">
                      tu caja: {flag} {team}
                    </div>
                  </div>
                  <div className="text-right">
                    {m.result ? (
                      <span
                        className={`text-sm font-bold ${
                          pts && pts > 0
                            ? "text-emerald-400"
                            : pts === 1
                              ? "text-amber"
                              : "text-muted"
                        }`}
                      >
                        +{pts ?? 0}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase mono text-muted">
                        pendiente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
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
        accent ? "border-amber/40 bg-amber/10" : "border-line bg-steel-850"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted mono">
        {label}
      </div>
      <div className={`text-xl font-black mt-1 ${accent ? "text-amber" : ""}`}>
        {value}
      </div>
    </div>
  );
}
