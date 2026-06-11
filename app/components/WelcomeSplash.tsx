"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Recibimiento mundialista al entrar con el link: reflectores de estadio,
// el contenedor del usuario baja de la grúa, pelota cruzando y confeti.
// Se va solo a los ~3.5s (o con un clic) y limpia la URL.
export function WelcomeSplash({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 3300);
    const t2 = setTimeout(() => {
      setGone(true);
      router.replace("/", { scroll: false });
    }, 3950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  if (gone) return null;

  function skip() {
    setHiding(true);
    setTimeout(() => {
      setGone(true);
      router.replace("/", { scroll: false });
    }, 350);
  }

  return (
    <div
      onClick={skip}
      role="presentation"
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
        <div
          className="splash-cable w-0.5 h-16 bg-line"
          aria-hidden
        />
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

      {/* Texto */}
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
          Tu contenedor ya está en el puerto. ¡A cargar pronósticos! 📦⚽
        </p>
      </div>

      {/* Pelota cruzando */}
      <div aria-hidden className="absolute bottom-[12%] left-1/2 -ml-5 text-4xl">
        <span className="ball-cross inline-block" style={{ animationDelay: "0.5s" }}>
          ⚽
        </span>
      </div>

      <div className="absolute bottom-5 text-[10px] uppercase tracking-widest text-muted/60 mono">
        tocá para entrar
      </div>
    </div>
  );
}
