"use client";

import { useRef, useState, useTransition } from "react";
import { TEAMS } from "@/lib/teams";
import { createMatch } from "./actions";

const STAGES = [
  "Fase de grupos",
  "Dieciseisavos",
  "Octavos",
  "Cuartos",
  "Semifinal",
  "Tercer puesto",
  "Final",
];

export function AddMatchForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          const res = await createMatch(fd);
          setMsg(res ?? { ok: true });
          if (res?.ok) formRef.current?.reset();
        })
      }
      className="grid sm:grid-cols-2 gap-3"
    >
      <Field label="Local">
        <TeamSelect name="homeTeam" />
      </Field>
      <Field label="Visitante">
        <TeamSelect name="awayTeam" />
      </Field>
      <Field label="Instancia">
        <select name="stage" className={inputCls} defaultValue={STAGES[0]}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Grupo (opcional)">
        <input name="group" maxLength={2} placeholder="A" className={inputCls} />
      </Field>
      <Field label="Día y horario">
        <input type="datetime-local" name="kickoff" className={inputCls} />
      </Field>
      <div className="flex items-end">
        <button
          disabled={pending}
          className="w-full rounded-lg bg-amber hover:bg-amber-bright text-steel-950 font-bold py-2.5 transition-colors disabled:opacity-60"
        >
          {pending ? "Cargando…" : "＋ Cargar partido"}
        </button>
      </div>

      {msg?.error && (
        <div className="sm:col-span-2 text-sm text-rust">{msg.error}</div>
      )}
      {msg?.ok && (
        <div className="sm:col-span-2 text-sm text-emerald-400">
          ✓ Partido cargado.
        </div>
      )}
    </form>
  );
}

const inputCls =
  "w-full rounded-lg bg-steel-900 border border-line px-3 py-2.5 text-ink outline-none focus:border-amber transition-colors";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-muted mb-1.5 mono">
        {label}
      </span>
      {children}
    </label>
  );
}

function TeamSelect({ name }: { name: string }) {
  return (
    <select name={name} className={inputCls} defaultValue="">
      <option value="" disabled>
        Elegí selección…
      </option>
      {TEAMS.map((t) => (
        <option key={t.name} value={t.name}>
          {t.flag} {t.name}
        </option>
      ))}
    </select>
  );
}
