"use client";

import { useState, useTransition } from "react";
import { clearMemberPredictions } from "./actions";

export function ClearPicksButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              `¿Borrar TODOS los pronósticos de ${name}? Esto no se puede deshacer.`
            )
          )
            return;
          const fd = new FormData();
          fd.set("userId", userId);
          start(async () => {
            const res = await clearMemberPredictions(fd);
            setMsg(
              res.error
                ? res.error
                : `✓ ${res.ok} pronóstico${res.ok === 1 ? "" : "s"} borrado${
                    res.ok === 1 ? "" : "s"
                  }`
            );
            setTimeout(() => setMsg(null), 4000);
          });
        }}
        className="text-xs text-rust/80 hover:text-rust border border-rust/30 hover:border-rust/60 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
      >
        {pending ? "Borrando…" : "Reiniciar pronósticos"}
      </button>
      {msg && <span className="text-xs text-emerald-400">{msg}</span>}
    </span>
  );
}
