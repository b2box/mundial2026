import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddMatchForm } from "./AddMatchForm";
import { setResult, deleteMatch } from "./actions";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: { _count: { select: { predictions: true } } },
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          ⚙️ Panel de carga
        </h1>
        <p className="text-sm text-muted">
          Cargá el fixture y, cuando termine cada partido, marcá el resultado.
          La tabla se actualiza sola.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <h2 className="font-black mb-3">＋ Nuevo partido</h2>
        <AddMatchForm />
      </section>

      <section>
        <h2 className="font-black mb-3">
          Partidos cargados ({matches.length})
        </h2>
        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-8 text-center text-muted text-sm">
            Todavía no hay partidos.
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-line bg-steel-850 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="font-semibold">
                      {m.homeFlag} {m.homeTeam}{" "}
                      <span className="text-muted">vs</span> {m.awayTeam}{" "}
                      {m.awayFlag}
                    </div>
                    <div className="text-[11px] text-muted mono">
                      {m.stage}
                      {m.group ? ` · Grupo ${m.group}` : ""} ·{" "}
                      {m.kickoff.toLocaleString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {m._count.predictions} pronósticos
                    </div>
                  </div>
                  <DeleteButton action={deleteMatch} matchId={m.id} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase mono text-muted mr-1">
                    Resultado:
                  </span>
                  <ResultBtn
                    matchId={m.id}
                    value="HOME"
                    current={m.result}
                    label={`Ganó ${m.homeTeam}`}
                  />
                  <ResultBtn
                    matchId={m.id}
                    value="DRAW"
                    current={m.result}
                    label="Empate"
                  />
                  <ResultBtn
                    matchId={m.id}
                    value="AWAY"
                    current={m.result}
                    label={`Ganó ${m.awayTeam}`}
                  />
                  {m.result && (
                    <ResultBtn
                      matchId={m.id}
                      value="CLEAR"
                      current={null}
                      label="✕ Limpiar"
                      subtle
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ResultBtn({
  matchId,
  value,
  current,
  label,
  subtle,
}: {
  matchId: string;
  value: string;
  current: string | null;
  label: string;
  subtle?: boolean;
}) {
  const active = current === value;
  return (
    <form action={setResult}>
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="result" value={value} />
      <button
        className={`text-xs rounded-md px-2.5 py-1.5 border transition-colors ${
          active
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
            : subtle
              ? "border-line text-muted hover:text-ink"
              : "border-line text-ink hover:border-amber"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
