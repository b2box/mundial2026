"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "text-amber" : "text-muted hover:text-ink"
      }`}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
      {active && (
        <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-amber rounded-full" />
      )}
    </Link>
  );
}
