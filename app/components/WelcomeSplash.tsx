"use client";

import { useEffect, useState } from "react";

// Acto 1 del onboarding: entrada al estadio (reflectores, grúa, pelota,
// confeti). Cierra solo a los ~3 segundos o con un toque, y avisa con
// onDone para que arranque el tour interactivo.
export function WelcomeSplash({
  name,
  color,
  onDone,
}: {
  name: string;
  color: string;
  onDone: () => void;
}) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => close(), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setHiding(true);
    setTimeout(onDone, 400);
  }

  return (
    <div
      role="presentation"
      onClick={close}
      className={`fixed inset-0 z-50 bg-steel-950 overflow-hidden flex flex-col items-center justify-center cursor-pointer ${
        hiding ? "splash-hide" : ""
      }`}
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
      <div aria-hidden className="absolute bottom-[12%] left-1/2 -ml-5 text-4xl">
        <span
          className="ball-cross inline-block"
          style={{ animationDelay: "0.5s" }}
        >
          ⚽
        </span>
      </div>
    </div>
  );
}
