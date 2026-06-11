"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

// Recibimiento mundialista al entrar con el link, en dos actos:
// 1) Entrada al estadio: reflectores, el contenedor del usuario baja de la
//    grúa, pelota cruzando y confeti.
// 2) Reglas del juego y premios del podio. Se cierra con el botón.
export function WelcomeSplash({
  name,
  color,
  projectedPot,
  stake,
  totalMatches,
  memberCount,
}: {
  name: string;
  color: string;
  projectedPot: number;
  stake: number;
  totalMatches: number;
  memberCount: number;
}) {
  const [phase, setPhase] = useState<"intro" | "rules" | "hiding" | "gone">(
    "intro"
  );
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase((p) => (p === "intro" ? "rules" : p));
    }, 2700);
    return () => clearTimeout(t);
  }, []);

  if (phase === "gone") return null;

  function close() {
    setPhase("hiding");
    setTimeout(() => {
      setPhase("gone");
      router.replace("/", { scroll: false });
    }, 400);
  }

  const prizes = [
    { medal: "🥇", pct: 60, amount: projectedPot * 0.6 },
    { medal: "🥈", pct: 30, amount: projectedPot * 0.3 },
    { medal: "🥉", pct: 10, amount: projectedPot * 0.1 },
  ];

  return (
    <div
      role="presentation"
      onClick={phase === "intro" ? () => setPhase("rules") : undefined}
      className={`fixed inset-0 z-50 bg-steel-950 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center ${
        phase === "hiding" ? "splash-hide" : ""
      } ${phase === "intro" ? "cursor-pointer" : ""}`}
    >
      {/* Reflectores */}
      <div className="beam left-[6%]" style={{ animationDelay: "0s" }} />
      <div
        className="beam right-[6%]"
        style={{ animationDelay: "1.6s", transform: "rotate(10deg)" }}
      />

      {/* Confeti */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="confetti" />
        ))}
      </div>

      {phase === "intro" ? (
        <>
          {/* Grúa + contenedor del usuario */}
          <div className="relative flex flex-col items-center">
            <div className="splash-cable w-0.5 h-16 bg-line" aria-hidden />
            <div
              className="splash-drop corrugated relative w-40 h-24 sm:w-52 sm:h-32 rounded-md border border-white/20 shadow-2xl flex items-center justify-center"
              style={{ background: color }}
            >
              <span className="text-4xl sm:text-5xl drop-shadow">📦</span>
              <span className="absolute bottom-1.5 right-2 text-[9px] mono font-bold text-steel-950/70 uppercase tracking-widest">
                B2BOX
              </span>
            </div>
          </div>

          <div className="relative mt-8 text-center px-4">
            <div
              className="text-rise text-[11px] uppercase tracking-[0.3em] text-amber mono"
              style={{ animationDelay: "0.9s" }}
            >
              Mundial 2026 · B2BOX Cargo Cup
            </div>
            <h1
              className="text-rise mt-2 text-3xl sm:text-5xl font-black text-ink"
              style={{ animationDelay: "1.1s" }}
            >
              ¡Bienvenid@, <span className="text-amber">{name}</span>!
            </h1>
            <p
              className="text-rise mt-3 text-sm text-muted"
              style={{ animationDelay: "1.4s" }}
            >
              Tu contenedor ya está en el puerto ⚓
            </p>
          </div>

          {/* Pelota cruzando */}
          <div
            aria-hidden
            className="absolute bottom-[12%] left-1/2 -ml-5 text-4xl"
          >
            <span
              className="ball-cross inline-block"
              style={{ animationDelay: "0.5s" }}
            >
              ⚽
            </span>
          </div>
        </>
      ) : (
        /* ===== Acto 2: reglas y premios ===== */
        <div className="relative w-full max-w-lg px-4 py-8 stack-in">
          <div className="rounded-xl border border-line bg-steel-850 overflow-hidden shadow-2xl">
            <div className="hazard h-2" />
            <div className="p-6">
              <h2 className="text-xl font-black text-center">
                📋 ¿Cómo se juega?
              </h2>

              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex gap-2.5">
                  <span>📦</span>
                  <span>
                    Antes de cada partido elegí{" "}
                    <strong className="text-amber">tu equipo</strong>. Al
                    arrancar el partido se cierra — ¡no te duermas!
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span>💰</span>
                  <span>
                    Cada pronóstico suma{" "}
                    <strong className="text-amber">{fmtARS(stake)}</strong>{" "}
                    tuyos al pozo, automáticamente. La meta: jugar los{" "}
                    {totalMatches} partidos entre los {memberCount}.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span>🎯</span>
                  <span>
                    Tu equipo <strong className="text-emerald-400">gana = 3 cajas</strong>,{" "}
                    <strong className="text-amber">empata = 1</strong>, pierde
                    = 0. Las cajas arman la Torre de Contenedores.
                  </span>
                </li>
              </ul>

              <div className="mt-5 rounded-lg border border-amber/40 bg-amber/10 p-4 text-center">
                <div className="text-[11px] uppercase tracking-wide text-muted mono">
                  🏆 Pozo total en juego
                </div>
                <div className="text-3xl font-black text-amber pulse-soft mt-1">
                  {fmtARS(projectedPot)}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {prizes.map((p) => (
                    <div
                      key={p.pct}
                      className="rounded-md bg-steel-900 border border-line py-2"
                    >
                      <div className="text-xl">{p.medal}</div>
                      <div className="text-[10px] text-muted mono">{p.pct}%</div>
                      <div className="text-sm font-black text-amber">
                        {fmtARS(p.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={close}
                className="mt-5 w-full rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-black py-3 text-lg transition-colors"
              >
                ¡A jugar! ⚽
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                Tenés todo explicado en la pestaña <strong>📖 Guía</strong>
              </p>
            </div>
            <div className="corrugated h-3 bg-steel-800" />
          </div>
        </div>
      )}
    </div>
  );
}
