"use client";

import { useState } from "react";

export function CopyLink({
  url,
  label,
  compact,
}: {
  url: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <code
        className={`flex-1 min-w-0 truncate rounded-md bg-steel-900 border border-line px-2.5 py-1.5 mono ${
          compact ? "text-[11px]" : "text-xs"
        } text-muted`}
        title={url}
      >
        {label ?? url}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-md bg-amber hover:bg-amber-bright text-steel-950 font-bold text-xs px-3 py-1.5 transition-colors"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
