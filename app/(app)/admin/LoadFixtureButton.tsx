"use client";

import { useState, useTransition } from "react";
import { loadOfficialFixture } from "./actions";

export function LoadFixtureButton({ existing }: { existing: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await loadOfficialFixture();
            setMsg(
              res.error
                ? res.error
                : res.ok === 0
                  ? "El fixture ya estaba cargado, no había nada nuevo."
                  : `✓ ${res.ok} partidos cargados.`
            );
          })
        }
        className="rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-bold px-5 py-2.5 transition-colors disabled:opacity-60"
      >
        {pending ? "Cargando fixture…" : "🏆 Cargar fixture oficial (104 partidos)"}
      </button>
      <span className="text-xs text-muted">
        Hay {existing} partidos cargados.
      </span>
      {msg && <span className="text-sm text-emerald-400">{msg}</span>}
    </div>
  );
}
