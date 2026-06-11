"use client";

import { useState, useTransition } from "react";
import { TEAMS } from "@/lib/teams";
import { updateMatch } from "./actions";

const STAGES = [
  "Fase de grupos",
  "Dieciseisavos",
  "Octavos",
  "Cuartos",
  "Semifinal",
  "Tercer puesto",
  "Final",
];

const inputCls =
  "w-full rounded-lg bg-steel-900 border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-amber transition-colors";

// kickoffLocal viene como "YYYY-MM-DDTHH:mm" ya convertido a hora argentina
export function EditMatchForm({
  matchId,
  homeTeam,
  awayTeam,
  stage,
  group,
  kickoffLocal,
}: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  group: string | null;
  kickoffLocal: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await updateMatch(fd);
          setMsg(res);
        })
      }
      className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-line/50"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <label className="block">
        <span className="block text-[10px] uppercase mono text-muted mb-1">Local</span>
        <select name="homeTeam" defaultValue={homeTeam} className={inputCls}>
          {TEAMS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase mono text-muted mb-1">Visitante</span>
        <select name="awayTeam" defaultValue={awayTeam} className={inputCls}>
          {TEAMS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase mono text-muted mb-1">
          Horario (hora arg.)
        </span>
        <input
          type="datetime-local"
          name="kickoff"
          defaultValue={kickoffLocal}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase mono text-muted mb-1">Instancia</span>
        <select name="stage" defaultValue={stage} className={inputCls}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase mono text-muted mb-1">Grupo</span>
        <input
          name="group"
          defaultValue={group ?? ""}
          maxLength={2}
          className={inputCls}
        />
      </label>
      <div className="flex items-end gap-2">
        <button
          disabled={pending}
          className="rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-bold text-sm px-4 py-2 transition-colors disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {msg?.ok && <span className="text-xs text-emerald-400 pb-2.5">✓</span>}
        {msg?.error && (
          <span className="text-xs text-rust pb-2.5">{msg.error}</span>
        )}
      </div>
    </form>
  );
}
