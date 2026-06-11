"use client";

import { useEffect, useRef, useState } from "react";

type Item = {
  id: string;
  name: string;
  color: string;
  match: string;
  at: string;
  mine: boolean;
};

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "recién";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

// Muestra quién va cargando pronósticos (sin revelar el equipo) y avisa
// con un toast cuando alguien juega, refrescando cada 30 segundos.
export function ActivityFeed() {
  const [items, setItems] = useState<Item[]>([]);
  const [toasts, setToasts] = useState<Item[]>([]);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/activity", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Item[] };
        if (!alive) return;

        // detectar novedades de OTROS para el toast (no la primera carga)
        if (known.current) {
          const fresh = data.items.filter(
            (i) => !known.current!.has(i.id + i.at) && !i.mine
          );
          if (fresh.length > 0) {
            setToasts((t) => [...t, ...fresh.slice(0, 3)]);
            setTimeout(
              () => setToasts((t) => t.slice(fresh.slice(0, 3).length)),
              5000
            );
          }
        }
        known.current = new Set(data.items.map((i) => i.id + i.at));
        setItems(data.items);
      } catch {
        // sin red: se reintenta en el próximo ciclo
      }
    }

    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <section className="rounded-xl border border-line bg-steel-850 p-4">
        <h2 className="font-black mb-0.5">🔔 Movimientos del grupo</h2>
        <p className="text-xs text-muted mb-3">
          Quién ya jugó su caja (el equipo elegido se revela cuando arranca el
          partido).
        </p>
        <ul className="space-y-1.5">
          {items.slice(0, 6).map((i) => (
            <li
              key={i.id + i.at}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm border border-white/20 shrink-0"
                style={{ background: i.color }}
              />
              <span className="truncate">
                <strong>{i.mine ? "Vos" : i.name}</strong>{" "}
                <span className="text-muted">📦 jugó en</span> {i.match}
              </span>
              <span className="ml-auto shrink-0 text-[11px] mono text-muted">
                {ago(i.at)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Toasts en tiempo real */}
      <div className="fixed bottom-4 right-4 z-40 space-y-2 max-w-[280px]">
        {toasts.map((t, i) => (
          <div
            key={t.id + t.at + i}
            className="stack-in rounded-lg border border-amber/50 bg-steel-850 shadow-2xl px-3.5 py-2.5 text-sm flex items-center gap-2"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm border border-white/20 shrink-0"
              style={{ background: t.color }}
            />
            <span>
              📦 <strong>{t.name}</strong> ya jugó su caja
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
