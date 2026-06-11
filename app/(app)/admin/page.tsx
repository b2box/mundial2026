import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { AddMatchForm } from "./AddMatchForm";
import { BulkLoadForm } from "./BulkLoadForm";
import { LoadFixtureButton } from "./LoadFixtureButton";
import { EditMatchForm } from "./EditMatchForm";
import { setResult, deleteMatch, regenerateToken } from "./actions";
import { DeleteButton } from "./DeleteButton";
import { ClearPicksButton } from "./ClearPicksButton";
import { SyncTest } from "./SyncTest";
import { CopyLink } from "../../components/CopyLink";
import { baseUrlFromHeaders } from "@/lib/url";
import { TZ } from "@/lib/constants";

// Convierte una fecha a "YYYY-MM-DDTHH:mm" en hora argentina (para datetime-local)
function toArgLocalInput(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(" ", "T");
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const [matches, members] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: { _count: { select: { predictions: true } } },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { predictions: true } } },
    }),
  ]);

  const base = baseUrlFromHeaders(await headers());

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          ⚙️ Panel de carga
        </h1>
        <p className="text-sm text-muted">
          Los resultados se cargan <strong>solos</strong> un rato después de
          cada partido (sincronización automática). Los botones de resultado
          quedan como respaldo por si la fuente falla.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <h2 className="font-black mb-1">🤖 Resultados automáticos</h2>
        <SyncTest />
      </section>

      <section className="rounded-xl border border-amber/40 bg-amber/5 p-4">
        <h2 className="font-black mb-1">🏆 Fixture oficial Mundial 2026</h2>
        <p className="text-sm text-muted mb-3">
          Carga los 72 partidos de la fase de grupos con día y hora argentina,
          más los 32 de eliminatorias como &quot;Por confirmar&quot; (los
          completás con <strong>Editar</strong> cuando se definan los cruces).
        </p>
        <LoadFixtureButton existing={matches.length} />
      </section>

      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <h2 className="font-black mb-3">＋ Nuevo partido</h2>
        <AddMatchForm />
      </section>

      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <h2 className="font-black mb-3">📋 Carga masiva del fixture</h2>
        <BulkLoadForm />
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
                        timeZone: TZ,
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      hs arg · {m._count.predictions} pronósticos
                    </div>
                  </div>
                  <DeleteButton action={deleteMatch} matchId={m.id} />
                </div>

                <details className="mb-2">
                  <summary className="text-xs text-muted hover:text-amber cursor-pointer select-none">
                    ✏️ Editar partido
                  </summary>
                  <EditMatchForm
                    matchId={m.id}
                    homeTeam={m.homeTeam}
                    awayTeam={m.awayTeam}
                    stage={m.stage}
                    group={m.group}
                    kickoffLocal={toArgLocalInput(m.kickoff)}
                  />
                </details>

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

      <section>
        <h2 className="font-black mb-1">
          🔗 Links de acceso ({members.length})
        </h2>
        <p className="text-sm text-muted mb-3">
          Copiá el link de cada uno y mandáselo (WhatsApp, mail…). Con ese link
          entran directo, sin contraseña. Si se filtra, regenerá el link y el
          anterior deja de funcionar.
        </p>
        <div className="space-y-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-line bg-steel-850 p-3"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm border border-white/20"
                    style={{ background: m.color }}
                  />
                  <span className="font-medium">{m.name}</span>
                  {m.isAdmin && (
                    <span className="text-[10px] uppercase mono text-amber border border-amber/40 rounded px-1.5 py-0.5">
                      admin
                    </span>
                  )}
                  <span className="text-[11px] text-muted mono">
                    {m._count.predictions} pron.
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <ClearPicksButton userId={m.id} name={m.name} />
                  <form action={regenerateToken}>
                    <input type="hidden" name="userId" value={m.id} />
                    <button className="text-xs text-muted hover:text-rust border border-line hover:border-rust/50 rounded-md px-2.5 py-1.5 transition-colors">
                      Regenerar
                    </button>
                  </form>
                </div>
              </div>
              <CopyLink url={`${base}/acceso/${m.token}`} compact />
            </div>
          ))}
        </div>
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
