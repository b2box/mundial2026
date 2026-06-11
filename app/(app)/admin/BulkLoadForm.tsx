"use client";

import { useActionState, useEffect, useRef } from "react";
import { bulkCreateMatches } from "./actions";

const EXAMPLE = `México | Estados Unidos | 2026-06-11 20:00 | A | Fase de grupos
Argentina | Brasil | 2026-06-13 16:00 | D
Canadá | Francia | 2026-06-12 20:00 | B`;

export function BulkLoadForm() {
  const [state, action, pending] = useActionState(bulkCreateMatches, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <p className="text-sm text-muted">
        Un partido por línea, separando con <code className="text-amber">|</code>:
        <br />
        <code className="mono text-xs">
          Local | Visitante | AAAA-MM-DD HH:MM | Grupo (opcional) | Instancia
          (opcional)
        </code>
      </p>
      <textarea
        name="raw"
        rows={6}
        placeholder={EXAMPLE}
        className="w-full rounded-lg bg-steel-900 border border-line px-3 py-2.5 text-ink outline-none focus:border-amber transition-colors mono text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-bold px-5 py-2.5 transition-colors disabled:opacity-60"
        >
          {pending ? "Cargando…" : "Cargar lote"}
        </button>
        {state?.error && (
          <span className="text-sm text-rust">{state.error}</span>
        )}
        {state?.ok ? (
          <span className="text-sm text-emerald-400">
            ✓ {state.ok} partido{state.ok > 1 ? "s" : ""} cargado
            {state.ok > 1 ? "s" : ""}.
          </span>
        ) : null}
      </div>
    </form>
  );
}
