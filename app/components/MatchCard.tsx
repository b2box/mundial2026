"use client";

import { useState, useTransition } from "react";
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
  userPick: "HOME" | "AWAY" | null;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
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
}: {
  match: MatchView;
  index?: number;
}) {
  const [pick, setPick] = useState(match.userPick);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const locked = new Date(match.kickoff) <= new Date() || !!match.result;
  const pts = pointsFor(pick, match.result);

  function choose(side: "HOME" | "AWAY") {
    if (locked || pending) return;
    const prev = pick;
    setPick(side);
    setError(null);
    const fd = new FormData();
    fd.set("matchId", match.id);
    fd.set("pick", side);
    startTransition(async () => {
      const res = await savePrediction(fd);
      if (res?.error) {
        setPick(prev);
        setError(res.error);
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
          <span className="pulse-soft text-xs font-bold text-emerald-400">
            GANÓ ⚽
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
        <div className="flex items-stretch gap-2">
          <TeamButton side="HOME" />
          <div className="flex flex-col items-center justify-center px-1 text-muted">
            <span className="text-xs mono">VS</span>
          </div>
          <TeamButton side="AWAY" />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs min-h-5">
          {error ? (
            <span className="text-rust">{error}</span>
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
                    "No pronosticaste este partido"
                  )}
                </>
              ) : (
                <span className="hazard px-2 py-0.5 rounded text-[10px] font-bold text-steel-950">
                  CERRADO · esperando resultado
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted">
              {pick ? "Podés cambiar tu caja hasta que arranque" : "Elegí tu caja 👆"}
            </span>
          )}
          {pending && <span className="text-muted mono">guardando…</span>}
        </div>
      </div>
    </div>
  );
}
