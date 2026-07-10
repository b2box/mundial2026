"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePrediction } from "../(app)/actions";

export type MatchView = {
  id: string;
  stage: string;
  group: string | null;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  kickoff: string; // ISO
  result: "HOME" | "AWAY" | "DRAW" | null;
  homeScore: number | null;
  awayScore: number | null;
  userPick: "HOME" | "AWAY" | null;
};

const TZ = "America/Argentina/Buenos_Aires";

function fmtTime(iso: string) {
  return (
    new Date(iso).toLocaleString("es-AR", {
      timeZone: TZ,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }) + " hs"
  );
}

const TBD = "Por confirmar";
const PICK_WINDOW_HOURS = 48;

function fmtOpens(kickoffIso: string) {
  const opens = new Date(
    new Date(kickoffIso).getTime() - PICK_WINDOW_HOURS * 3600 * 1000
  );
  return opens.toLocaleString("es-AR", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pointsFor(pick: "HOME" | "AWAY" | null, result: string | null) {
  if (!pick || !result) return null;
  if (result === "DRAW") return 1;
  return pick === result ? 3 : 0;
}

export function MatchCard({
  match,
  index = 0,
  allPicks,
}: {
  match: MatchView;
  index?: number;
  // pronósticos de todos (se muestran cuando el partido ya cerró)
  allPicks?: { name: string; color: string; pick: string }[];
}) {
  const [pick, setPick] = useState(match.userPick);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const tbd = match.homeTeam === TBD || match.awayTeam === TBD;
  const kickoffMs = new Date(match.kickoff).getTime();
  const nowMs = Date.now();
  // la ventana de pronóstico abre 48 hs antes del partido
  const notYetOpen =
    !tbd && !match.result && kickoffMs - nowMs > PICK_WINDOW_HOURS * 3600 * 1000;
  const locked = tbd || notYetOpen || kickoffMs <= nowMs || !!match.result;
  const pts = pointsFor(pick, match.result);

  function choose(side: "HOME" | "AWAY") {
    if (locked || pending) return;
    const prev = pick;
    setPick(side);
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("matchId", match.id);
    fd.set("pick", side);
    startTransition(async () => {
      try {
        const res = await savePrediction(fd);
        if (res?.error) {
          // revertir y mostrar el error bien visible: nada de fallos silenciosos
          setPick(prev);
          setError(res.error);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
          // refrescar datos del server (pozo, contadores) con el guardado confirmado
          router.refresh();
        }
      } catch {
        setPick(prev);
        setError("No se pudo guardar (problema de conexión). Tocá de nuevo.");
      }
    });
  }

  const TeamButton = ({ side }: { side: "HOME" | "AWAY" }) => {
    const team = side === "HOME" ? match.homeTeam : match.awayTeam;
    const flag = side === "HOME" ? match.homeFlag : match.awayFlag;
    const chosen = pick === side;
    const isWinnerSide = match.result === side;
    return (
      <button
        onClick={() => choose(side)}
        disabled={locked || pending}
        className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition-all ${
          chosen
            ? "border-amber bg-amber/15 ring-1 ring-amber/40"
            : "border-line bg-steel-900 hover:border-line/80"
        } ${locked ? "cursor-default" : "cursor-pointer"}`}
      >
        <span className="text-2xl leading-none">{flag}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold truncate">{team}</span>
          {chosen && (
            <span className="stamp-in block text-[10px] uppercase tracking-wide text-amber mono">
              📦 tu caja
            </span>
          )}
        </span>
        {match.result && isWinnerSide && (
          <span className="pulse-soft text-xs font-bold text-emerald-400 whitespace-nowrap">
            GANÓ ⚽
            {match.homeScore != null &&
              match.homeScore === match.awayScore &&
              " (pen)"}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className="relative rounded-xl border border-line bg-steel-850 overflow-hidden stack-in"
      style={{ animationDelay: `${Math.min(index, 8) * 0.07}s` }}
    >
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-line/60 text-[11px] mono uppercase tracking-wide text-muted">
        <span>
          {match.stage}
          {match.group ? ` · Grupo ${match.group}` : ""}
        </span>
        <span>{fmtTime(match.kickoff)}</span>
      </div>

      <div className="p-3.5">
        <div
          className={`flex items-stretch gap-2 transition-all ${
            tbd || notYetOpen
              ? "opacity-40 blur-[1.5px] grayscale select-none pointer-events-none"
              : ""
          }`}
          aria-disabled={tbd || notYetOpen}
        >
          <TeamButton side="HOME" />
          <div className="flex flex-col items-center justify-center px-1 text-muted">
            {match.result && match.homeScore != null && match.awayScore != null ? (
              <span className="text-center">
                <span className="block text-base font-black text-ink mono whitespace-nowrap">
                  {match.homeScore}-{match.awayScore}
                </span>
                {match.result !== "DRAW" &&
                  match.homeScore === match.awayScore && (
                    <span className="block text-[9px] mono uppercase text-amber">
                      pen
                    </span>
                  )}
              </span>
            ) : (
              <span className="text-xs mono">VS</span>
            )}
          </div>
          <TeamButton side="AWAY" />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs min-h-5">
          {error ? (
            <span className="text-rust">{error}</span>
          ) : tbd ? (
            <span className="text-muted">
              🔀 Cruce por definir — se habilita cuando estén los equipos
            </span>
          ) : notYetOpen ? (
            <span className="text-muted">
              ⏳ Se habilita el {fmtOpens(match.kickoff)} hs (48 hs antes)
            </span>
          ) : locked ? (
            <span className="text-muted">
              {match.result ? (
                <>
                  {match.result === "DRAW" ? (
                    <span className="text-amber font-semibold">
                      Empate · {pick ? "+1 caja" : "no jugaste"}
                    </span>
                  ) : pts !== null ? (
                    <span
                      className={
                        pts > 0
                          ? "pop-in inline-block text-emerald-400 font-semibold"
                          : "text-muted"
                      }
                    >
                      {pts > 0 ? `🎉 +${pts} cajas` : "✕ 0 cajas"}
                    </span>
                  ) : (
                    <span className="text-rust">
                      ✕ No elegiste: 0 cajas (como perder)
                    </span>
                  )}
                </>
              ) : (
                <span className="hazard px-2 py-0.5 rounded text-[10px] font-bold text-steel-950">
                  CERRADO · esperando resultado
                </span>
              )}
            </span>
          ) : (
            <span className={pick ? "text-muted" : "text-amber font-semibold"}>
              {pick
                ? "✓ Listo. Podés cambiar hasta que arranque"
                : "👆 Tocá al equipo que creés que gana"}
            </span>
          )}
          {pending ? (
            <span className="text-amber mono">guardando…</span>
          ) : saved ? (
            <span className="text-emerald-400 mono pop-in inline-block">
              ✓ guardado
            </span>
          ) : null}
        </div>

        {/* Cajas de todos: se revelan cuando el partido cierra */}
        {locked && !tbd && allPicks && allPicks.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-line/40">
            <div className="text-[10px] uppercase mono text-muted mb-1.5">
              📦 Así jugaron
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allPicks.map((p) => (
                <span
                  key={p.name}
                  className="inline-flex items-center gap-1.5 text-[11px] bg-steel-900 border border-line rounded-full px-2 py-1"
                >
                  <span
                    className="w-2 h-2 rounded-sm border border-white/20"
                    style={{ background: p.color }}
                  />
                  {p.name}{" "}
                  {p.pick === "HOME" ? match.homeFlag : match.awayFlag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
