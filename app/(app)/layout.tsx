import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Brand } from "../components/Logo";
import { NavLink } from "../components/NavLink";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-steel-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <Brand compact />
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="hidden sm:flex items-center gap-2 text-sm text-muted mr-1"
              title={user.name}
            >
              <span
                className="inline-block w-3 h-3 rounded-sm border border-white/20"
                style={{ background: user.color }}
              />
              {user.name}
            </span>
            <form action="/api/logout" method="post">
              <button className="text-xs text-muted hover:text-ink border border-line rounded-md px-2.5 py-1.5 transition-colors">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="border-t border-line/60">
          <div className="max-w-5xl mx-auto px-2 flex items-center gap-1 overflow-x-auto">
            <NavLink href="/" label="Partidos" icon="📦" />
            <NavLink href="/tabla" label="La Torre" icon="🏗️" />
            <NavLink href="/mi-cuenta" label="Mi cuenta" icon="🧾" />
            {user.isAdmin && <NavLink href="/admin" label="Admin" icon="⚙️" />}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>

      <footer className="border-t border-line text-center py-4 text-xs text-muted mono">
        B2BOX CARGO CUP · Mundial 2026 · Uso interno
      </footer>
    </div>
  );
}
