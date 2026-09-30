"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Registrar",
    paths: ["M12 8v8", "M8 12h8"],
    circle: true,
  },
  {
    href: "/biblioteca",
    label: "Biblioteca",
    paths: ["M4 4v16", "M8 8v12", "M12 6v14", "m16 6 4 14"],
  },
  {
    href: "/estadisticas",
    label: "Estadísticas",
    paths: ["M3 3v18h18", "M8 17v-3", "M13 17V5", "M18 17V9"],
  },
  {
    href: "/ajustes",
    label: "Ajustes",
    paths: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"],
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition active:scale-95 ${
                active ? "text-accent" : "text-faint"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.2 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {item.circle && <circle cx="12" cy="12" r="9" />}
                {item.paths.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
