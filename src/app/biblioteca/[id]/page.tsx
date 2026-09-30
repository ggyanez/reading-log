import Link from "next/link";
import { notFound } from "next/navigation";
import SessionRow from "@/components/SessionRow";
import { getBook, getSettings } from "@/lib/data";
import { TRACKS } from "@/lib/books";
import { formatDate, formatMinutes } from "@/lib/time";

export default async function BookPage({ params }: PageProps<"/biblioteca/[id]">) {
  const { id } = await params;
  const [result, settings] = await Promise.all([getBook(id), getSettings()]);
  if (!result) notFound();
  const { book, sessions } = result;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/biblioteca" className="text-sm text-muted">
          ‹ Biblioteca
        </Link>
        <p className="mt-4 text-xs font-medium tracking-wide text-muted uppercase">
          {TRACKS[book.library].label}
          {book.category && ` · ${book.category}`}
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold">{book.title}</h1>
        {book.author && <p className="mt-1 text-muted">{book.author}</p>}
        <p className="mt-3 text-sm text-muted">
          {[book.status, book.rating].filter(Boolean).join(" · ")}
          {book.removedAt ? (
            <span className="block text-danger">Ya no está en Notion</span>
          ) : (
            <>
              {" · "}
              <a href={book.notionUrl} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">
                Abrir en Notion
              </a>
            </>
          )}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Tiempo total" value={formatMinutes(book.totalMinutes)} />
        <Stat label="Sesiones" value={String(book.sessionCount)} />
        <Stat label="Primera" value={book.firstReadAt ? formatDate(book.firstReadAt) : "—"} />
        <Stat label="Última" value={book.lastReadAt ? formatDate(book.lastReadAt) : "—"} />
      </dl>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">Sesiones</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-faint">Todavía no registraste lectura de este libro.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
            {sessions.map((s) => (
              <SessionRow key={`${s.id}-${s.minutes}-${s.readAt}`} session={s} step={settings.stepMinutes} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular mt-0.5 font-serif text-xl font-semibold">{value}</dd>
    </div>
  );
}
