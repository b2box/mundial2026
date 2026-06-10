import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { Brand } from "../components/Logo";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Brand />
        </div>

        <div className="relative rounded-xl border border-line bg-steel-850 overflow-hidden shadow-2xl">
          <div className="hazard h-2" />
          <div className="p-7">
            <div className="mono text-[11px] uppercase tracking-[0.25em] text-amber mb-1">
              Terminal de acceso
            </div>
            <h1 className="text-xl font-black mb-1">Identificá tu contenedor</h1>
            <p className="text-sm text-muted mb-6">
              Ingresá con tu usuario y contraseña para cargar tus pronósticos.
            </p>

            <LoginForm />
          </div>
          <div className="corrugated h-3 bg-steel-800" />
        </div>

        <p className="text-center text-xs text-muted mt-5 mono">
          MUNDIAL 2026 · USO INTERNO B2BOX
        </p>
      </div>
    </div>
  );
}
