// Logo B2BOX: wordmark "B2B[O]X" donde la O es el cubo isométrico de la marca.
// Recreado en SVG/CSS para poder pintarlo en claro sobre fondo oscuro.

export function CubeO({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className="inline-block shrink-0"
      style={{ verticalAlign: "-0.08em" }}
    >
      <circle cx="50" cy="50" r="48" fill="currentColor" />
      <g
        stroke="var(--steel-950)"
        strokeWidth="6"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <polygon points="50,24 73,37 50,50 27,37" />
        <polyline points="27,37 27,63 50,76 50,50" />
        <polyline points="73,37 73,63 50,76" />
      </g>
    </svg>
  );
}

export function B2BoxWordmark({
  className = "text-3xl",
  cube = 26,
}: {
  className?: string;
  cube?: number;
}) {
  return (
    <span
      className={`font-black tracking-tighter inline-flex items-center leading-none ${className}`}
      style={{ gap: "0.05em" }}
      aria-label="B2BOX"
    >
      B2B
      <CubeO size={cube} />X
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="leading-tight">
        <div className="text-ink flex items-center gap-2">
          <B2BoxWordmark
            className={compact ? "text-2xl" : "text-3xl"}
            cube={compact ? 20 : 26}
          />
          <span
            className={`bg-amber text-steel-950 font-black rounded px-1.5 py-0.5 ${
              compact ? "text-[10px]" : "text-xs"
            }`}
          >
            CARGO CUP
          </span>
        </div>
        {!compact && (
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted mono mt-1">
            El Prode del Contenedor
          </div>
        )}
      </div>
    </div>
  );
}
