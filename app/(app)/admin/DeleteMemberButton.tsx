"use client";

import { useState, useTransition } from "react";
import { deleteMember } from "./actions";

export function DeleteMemberButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() => {
          const typed = prompt(
            `⚠️ Vas a ELIMINAR a ${name} para siempre: su cuenta, su link y todos sus pronósticos. El pozo se recalcula sin sus aportes.\n\nEscribí "${name}" para confirmar:`
          );
          if (typed?.trim().toLowerCase() !== name.toLowerCase()) return;
          const fd = new FormData();
          fd.set("userId", userId);
          start(async () => {
            const res = await deleteMember(fd);
            if (res?.error) {
              setMsg(res.error);
              setTimeout(() => setMsg(null), 4000);
            }
          });
        }}
        className="text-xs font-bold text-rust border border-rust/40 hover:bg-rust/10 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
      >
        {pending ? "Eliminando…" : "🗑️ Eliminar"}
      </button>
      {msg && <span className="text-xs text-rust">{msg}</span>}
    </span>
  );
}
