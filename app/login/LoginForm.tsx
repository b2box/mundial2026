"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1.5 mono">
          Usuario
        </label>
        <input
          name="username"
          autoComplete="username"
          autoFocus
          className="w-full rounded-lg bg-steel-900 border border-line px-3 py-2.5 text-ink outline-none focus:border-amber transition-colors"
          placeholder="tu nombre"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1.5 mono">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg bg-steel-900 border border-line px-3 py-2.5 text-ink outline-none focus:border-amber transition-colors"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-bold py-2.5 transition-colors disabled:opacity-60"
      >
        {pending ? "Verificando…" : "Ingresar al depósito →"}
      </button>
    </form>
  );
}
