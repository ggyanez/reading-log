"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OPEN_STATUSES, TRACKS, statusRank, type Book, type Library } from "@/lib/books";
import { normalize } from "@/lib/search";
import { formatMinutes } from "@/lib/time";

type Filter = "all" | Library;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "informatica", label: TRACKS.informatica.label },
  { value: "general", label: TRACKS.general.label },
];

const DOT = { informatica: "bg-career", general: "bg-personal" };

export default function LibraryView({ books }: { books: Book[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = normalize(query);
    const visible = books.filter(
      (b) =>
        (filter === "all" || b.library === filter) &&
        (!q || normalize(`${b.title} ${b.author ?? ""} ${b.category ?? ""}`).includes(q)),
    );
    const byStatus = new Map<string, Book[]>();
    for (const b of visible) {
      const status = b.status ?? "Sin estado";
      byStatus.set(status, [...(byStatus.get(status) ?? []), b]);
    }
    return [...byStatus.entries()].sort(
      ([a], [b]) => statusRank(a) - statusRank(b) || a.localeCompare(b),
    );
  }, [books, filter, query]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.value ? "bg-ink text-surface" : "border border-line bg-surface text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título, autor o categoría…"
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
      />

      {groups.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">
          {books.length === 0 ? "La biblioteca está vacía. Sincronizá con Notion desde Ajustes." : "Sin resultados."}
        </p>
      )}

      {groups.map(([status, list]) => (
        // A search expands every group, so matches are never hidden.
        <details key={status} open={OPEN_STATUSES.has(status) || query !== ""} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-sm font-medium text-muted">
            <span>
              {status} <span className="text-faint">· {list.length}</span>
            </span>
            <span className="text-faint transition group-open:rotate-90" aria-hidden>
              ›
            </span>
          </summary>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
            {list.map((b) => (
              <li key={b.id} className={b.removedAt ? "opacity-50" : undefined}>
                <Link href={`/biblioteca/${b.id}`} className="flex items-center gap-3 px-4 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[b.library]}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif">{b.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {b.removedAt ? "Ya no está en Notion" : [b.author, b.category].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {b.totalMinutes > 0 && (
                    <span className="tabular shrink-0 text-sm text-muted">{formatMinutes(b.totalMinutes)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
