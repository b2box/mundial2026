import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";
import { Brand } from "../components/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await ensureSeeded();
  const user = await getSessionUser();
  if (user) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Brand />
        </div>

        <div className="relative rounded-xl border border-line bg-steel-850 overflow-hidden shadow-2xl">
          <div className="hazard h-2" />
          <div className="p-7 text-center">
            <div className="text-5xl mb-3">📦🔗</div>
            <h1 className="text-xl font-black mb-2">
              Entrá con tu link personal
            </h1>
            <p className="text-sm text-muted">
              No hay usuario ni contraseña. Cada miembro tiene un{" "}
              <span className="text-amber">link único</span> de acceso. Abrilo y
              ya estás adentro — guardalo en favoritos.
            </p>

            {error === "config" ? (
              <div className="mt-5 rounded-lg border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
                El sitio no puede conectarse a la base de datos. Avisale al
                admin: hay que revisar <code>DATABASE_URL</code> en Vercel.
              </div>
            ) : error ? (
              <div className="mt-5 rounded-lg border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
                Ese link no es válido o expiró. Pedile al admin que te reenvíe el
                tuyo.
              </div>
            ) : null}

            <div className="mt-6 rounded-lg border border-line bg-steel-900 px-4 py-3 text-sm text-muted">
              ¿No tenés tu link?{" "}
              <span className="text-ink">Pedíselo a Gabriel.</span>
            </div>
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
