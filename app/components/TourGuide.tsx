"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

type Step = {
  target: string | null; // selector [data-tour=...] o null = centrado
  emoji: string;
  title: string;
  text: string;
};

// Tour interactivo paso a paso sobre la interfaz real, con spotlight.
export function TourGuide({
  projectedPot,
  stake,
  onDone,
}: {
  projectedPot: number;
  stake: number;
  onDone: () => void;
}) {
  const steps: Step[] = useMemo(() => {
    const all: Step[] = [
      {
        target: '[data-tour="pozo"]',
        emoji: "💰",
        title: "El pozo",
        text: `Por cada partido que se juega, todos aportan ${fmtARS(stake)} — elijas o no. Esta barra muestra cuánto se juntó; al final del Mundial llega a ${fmtARS(projectedPot)}.`,
      },
      {
        target: '[data-tour="elegir"]',
        emoji: "👆",
        title: "Elegí quién gana",
        text: "Tocá el equipo que creés que va a ganar ANTES de que arranque el partido. Si gana sumás 3 cajas 📦, empate 1, pierde 0. Podés cambiar hasta el inicio; después queda sellado. ⚠️ Si no elegís, es como perder: 0 cajas.",
      },
      {
        target: '[data-tour="proximos"]',
        emoji: "⏳",
        title: "Lo que viene",
        text: "Acá están los próximos partidos por día. Los que se ven borrosos todavía no abren: cada partido se habilita 48 horas antes de jugarse.",
      },
      {
        target: '[data-tour="nav-posiciones"]',
        emoji: "🏆",
        title: "Posiciones",
        text: "La Torre de Contenedores: el ranking de todos. Los resultados se cargan solos cuando terminan los partidos, no hay que hacer nada.",
      },
      {
        target: '[data-tour="nav-guia"]',
        emoji: "📖",
        title: "¿Dudas?",
        text: "La guía completa con las reglas y preguntas frecuentes vive acá, por si querés repasar algo después.",
      },
      {
        target: null,
        emoji: "🥇",
        title: "Los premios",
        text: `Al final del Mundial el pozo se reparte: 1° se lleva el 60% (${fmtARS(projectedPot * 0.6)}), 2° el 30% (${fmtARS(projectedPot * 0.3)}) y 3° el 10% (${fmtARS(projectedPot * 0.1)}). ¡A llenar el contenedor!`,
      },
    ];
    // saltear pasos cuyo elemento no existe en la página
    return all.filter(
      (s) => s.target === null || document.querySelector(s.target)
    );
  }, [projectedPot, stake]);

  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = steps[idx];

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) {
      setRect(null);
      return;
    }
    setRect(el.getBoundingClientRect());
  }, [step]);

  useEffect(() => {
    if (step?.target) {
      const el = document.querySelector(step.target);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(measure, 350);
      // seguir el elemento mientras dura el paso (scroll/resize)
      timer.current = setInterval(measure, 250);
      window.addEventListener("resize", measure);
      return () => {
        clearTimeout(t);
        if (timer.current) clearInterval(timer.current);
        window.removeEventListener("resize", measure);
      };
    } else {
      setRect(null);
    }
  }, [step, measure]);

  if (!step) return null;

  const last = idx === steps.length - 1;
  const pad = 8;

  // posición del tooltip: debajo del elemento si hay lugar, si no arriba
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = rect ? rect.bottom + 16 + 180 < vh || rect.top < 220 : false;

  return (
    <div className="fixed inset-0 z-50">
      {/* Bloqueo de interacción de fondo */}
      <div className="absolute inset-0" onClick={() => {}} />

      {/* Spotlight con agujero (o backdrop completo si no hay target) */}
      {rect ? (
        <div
          className="absolute rounded-xl border-2 border-amber transition-all duration-300 pointer-events-none"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(4, 8, 16, 0.84)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-steel-950/90" />
      )}

      {/* Tarjeta del paso */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm stack-in"
        style={
          rect
            ? below
              ? { top: Math.min(rect.bottom + pad + 12, vh - 240) }
              : { top: Math.max(rect.top - pad - 12, 16), transform: "translate(-50%, -100%)" }
            : { top: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <div className="rounded-xl border border-amber/50 bg-steel-850 shadow-2xl overflow-hidden">
          <div className="hazard h-1.5" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black text-lg">
                {step.emoji} {step.title}
              </h3>
              <button
                onClick={onDone}
                className="shrink-0 text-xs text-muted hover:text-ink border border-line rounded-md px-2 py-1 transition-colors"
              >
                Omitir
              </button>
            </div>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">
              {step.text}
            </p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] mono text-muted">
                {idx + 1} / {steps.length}
              </span>
              <div className="flex gap-2">
                {idx > 0 && (
                  <button
                    onClick={() => setIdx(idx - 1)}
                    className="text-sm text-muted hover:text-ink border border-line rounded-lg px-3 py-1.5 transition-colors"
                  >
                    ← Atrás
                  </button>
                )}
                <button
                  onClick={() => (last ? onDone() : setIdx(idx + 1))}
                  className="text-sm font-bold bg-amber hover:bg-amber-bright text-steel-950 rounded-lg px-4 py-1.5 transition-colors"
                >
                  {last ? "¡A jugar! ⚽" : "Siguiente →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
