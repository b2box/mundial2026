export function ContainerMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect x="4" y="14" width="40" height="24" rx="2" fill="#f5a623" />
      <rect x="4" y="14" width="40" height="24" rx="2" fill="url(#corr)" />
      <rect x="4" y="14" width="40" height="5" fill="#1a1a1a" opacity="0.25" />
      <rect x="6" y="16" width="2" height="20" fill="#00000030" />
      <rect x="40" y="16" width="2" height="20" fill="#00000030" />
      <defs>
        <pattern
          id="corr"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <rect width="2" height="4" fill="#00000018" />
        </pattern>
      </defs>
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <ContainerMark size={compact ? 32 : 40} />
      <div className="leading-tight">
        <div className="font-black tracking-tight text-ink">
          B2BOX <span className="text-amber">CARGO CUP</span>
        </div>
        {!compact && (
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted mono">
            El Prode del Contenedor
          </div>
        )}
      </div>
    </div>
  );
}
