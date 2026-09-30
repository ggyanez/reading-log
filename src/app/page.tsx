import Link from "next/link";
import LogForm from "@/components/LogForm";
import { getBooks, getLastMinutes, getRecentSessions, getSettings } from "@/lib/data";
import { TRACKS } from "@/lib/books";
import { formatDateTime, formatMinutes } from "@/lib/time";

export default async function RegistrarPage() {
  const [books, lastMinutes, settings, recent] = await Promise.all([
    getBooks(),
    getLastMinutes(),
    getSettings(),
    getRecentSessions(5),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl font-semibold">¿Qué leíste?</h1>

      <LogForm books={books} initialMinutes={lastMinutes} step={settings.stepMinutes} />

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">Últimos registros</h2>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
            {recent.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/biblioteca/${s.bookId}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif">{s.title}</span>
                    <span className="block text-xs text-muted">
                      {TRACKS[s.library].label} · {formatDateTime(s.readAt)}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-medium">
                    {formatMinutes(s.minutes)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
