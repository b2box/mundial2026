"use client";

import { useState, useTransition } from "react";
import { setMemberPick } from "./actions";

type Member = { id: string; name: string; color: string };

export function MatchPicksEditor({
  matchId,
  homeTeam,
  awayTeam,
  homeFlag,
  awayFlag,
  members,
  picks, // userId -> "HOME" | "AWAY"
}: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  members: Member[];
  picks: Record<string, string>;
}) {
  const [local, setLocal] = useState<Record<string, string>>(picks);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function set(userId: string, pick: string) {
    setBusy(userId);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("matchId", matchId);
    fd.set("pick", pick);
    start(async () => {
      const res = await setMemberPick(fd);
      if (res?.ok) {
        setLocal((p) => {
          const n = { ...p };
          if (pick === "CLEAR") delete n[userId];
          else n[userId] = pick;
          return n;
        });
      }
      setBusy(null);
    });
  }

  const btn = (active: boolean) =>
    `text-[11px] rounded px-2 py-1 border transition-colors ${
      active
        ? "bg-amber/20 border-amber/60 text-amber font-bold"
        : "border-line text-muted hover:text-ink"
    }`;

  return (
    <div className="mt-3 pt-3 border-t border-line/50 space-y-1.5">
      {members.map((m) => {
        const cur = local[m.id];
        return (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-sm border border-white/20 shrink-0"
              style={{ background: m.color }}
            />
            <span className="w-20 truncate">{m.name}</span>
            <div className="flex gap-1 ml-auto">
              <button
                disabled={pending}
                onClick={() => set(m.id, "HOME")}
                className={btn(cur === "HOME")}
              >
                {homeFlag} {homeTeam}
              </button>
              <button
                disabled={pending}
                onClick={() => set(m.id, "AWAY")}
                className={btn(cur === "AWAY")}
              >
                {awayFlag} {awayTeam}
              </button>
              <button
                disabled={pending || !cur}
                onClick={() => set(m.id, "CLEAR")}
                className="text-[11px] rounded px-2 py-1 border border-line text-rust/70 hover:text-rust disabled:opacity-30"
              >
                ✕
              </button>
            </div>
            {busy === m.id && <span className="text-[10px] text-muted">…</span>}
          </div>
        );
      })}
      <p className="text-[10px] text-muted pt-1">
        Corregí acá si alguien dice que eligió y no quedó guardado. Cambia los
        puntos y el pozo al instante.
      </p>
    </div>
  );
}
