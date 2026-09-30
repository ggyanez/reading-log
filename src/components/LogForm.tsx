"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { READING_STATUS, type Book } from "@/lib/books";
import { normalize } from "@/lib/search";
import { formatMinutes } from "@/lib/time";
import { deleteSession, logSession } from "@/app/actions";
import BookCard from "./BookCard";
import MinutesStepper from "./MinutesStepper";
import ReadAtField from "./ReadAtField";

type Toast = { message: string; undoId?: number };

const TOAST_MS = 6000;

export default function LogForm({
  books,
  initialMinutes,
  step,
}: {
  books: Book[];
  initialMinutes: number;
  step: number;
}) {
  const [bookId, setBookId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const available = useMemo(() => books.filter((b) => !b.removedAt), [books]);
  const reading = useMemo(() => available.filter((b) => b.status === READING_STATUS), [available]);
  const selected = available.find((b) => b.id === bookId) ?? null;
  // A book picked through search that isn't one of the "Leyendo" cards.
  const pickedOther = selected && !reading.some((b) => b.id === selected.id) ? selected : null;

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return available
      .filter((b) => normalize(`${b.title} ${b.author ?? ""}`).includes(q))
      .slice(0, 8);
  }, [available, query]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  function submit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await logSession({
        bookId: selected.id,
        minutes,
        readAt: readAt ? new Date(readAt).toISOString() : new Date().toISOString(),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setReadAt(null);
      setToast({ message: `${formatMinutes(minutes)} de ${selected.title}`, undoId: res.data.id });
    });
  }

  function undo(id: number) {
    startTransition(async () => {
      const res = await deleteSession(id);
      setToast(res.ok ? { message: "Registro deshecho" } : null);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        {reading.length === 0 && !pickedOther && (
          <p className="rounded-3xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
            No hay libros en “Leyendo”. Buscá uno abajo o sincronizá con Notion desde Ajustes.
          </p>
        )}
        {reading.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            selected={book.id === bookId}
            onSelect={() => setBookId(book.id)}
          />
        ))}
        {pickedOther && <BookCard book={pickedOther} selected onSelect={() => {}} />}

        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Otro libro…"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
              {results.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setBookId(b.id);
                      setQuery("");
                    }}
                    className="block w-full px-4 py-2.5 text-left active:bg-accent-soft"
                  >
                    <span className="block font-serif font-medium">{b.title}</span>
                    {b.author && <span className="block text-sm text-muted">{b.author}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-line bg-surface px-5 py-6">
        <MinutesStepper value={minutes} step={step} onChange={setMinutes} />
        <ReadAtField value={readAt} onChange={setReadAt} />
      </section>

      <div>
        <button
          type="button"
          onClick={submit}
          disabled={!selected || pending}
          className="w-full rounded-3xl bg-accent py-4 text-lg font-medium text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
        >
          {pending ? "Registrando…" : "Registrar"}
        </button>
        {!selected && <p className="mt-2 text-center text-sm text-faint">Elegí un libro para registrar.</p>}
        {error && <p className="mt-2 text-center text-sm text-danger">{error}</p>}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-surface shadow-lg"
        >
          <span className="min-w-0 truncate">✓ {toast.message}</span>
          {toast.undoId !== undefined && (
            <button
              type="button"
              onClick={() => undo(toast.undoId!)}
              disabled={pending}
              className="shrink-0 font-semibold text-accent-soft underline underline-offset-4"
            >
              Deshacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
