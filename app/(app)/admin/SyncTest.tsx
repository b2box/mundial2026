"use client";

import { useState } from "react";

export function SyncTest() {
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(method: "GET" | "POST") {
    setLoading(true);
    setOut(null);
    try {
      const res = await fetch("/api/sync-test", { method, cache: "no-store" });
      const data = await res.json();
      setOut(JSON.stringify(data, null, 2));
    } catch (e) {
      setOut("Error: " + (e instanceof Error ? e.message : "desconocido"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Verificá en vivo que la fuente de resultados funcione. &quot;Probar&quot;
        consulta la API; &quot;Sincronizar ahora&quot; fuerza la actualización de
        resultados y cruces.
      </p>
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => run("GET")}
          className="rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-bold px-4 py-2 text-sm transition-colors disabled:opacity-60"
        >
          {loading ? "Consultando…" : "🔎 Probar fuente"}
        </button>
        <button
          disabled={loading}
          onClick={() => run("POST")}
          className="rounded-lg border border-line hover:border-amber text-ink px-4 py-2 text-sm transition-colors disabled:opacity-60"
        >
          🔄 Sincronizar ahora
        </button>
      </div>
      {out && (
        <pre className="text-[11px] mono bg-steel-900 border border-line rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-80">
          {out}
        </pre>
      )}
    </div>
  );
}
