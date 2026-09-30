"use client";

import { useState, useTransition } from "react";
import type { Session } from "@/lib/books";
import { formatDateTime, formatMinutes } from "@/lib/time";
import { deleteSession, updateSession } from "@/app/actions";
import MinutesStepper from "./MinutesStepper";
import { toLocalInputValue } from "./ReadAtField";

/** A logged session; tap to edit its minutes or date, or delete it. */
export default function SessionRow({ session, step }: { session: Session; step: number }) {
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState(session.minutes);
  const [readAt, setReadAt] = useState(() => toLocalInputValue(new Date(session.readAt)));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="text-sm text-muted">{formatDateTime(session.readAt)}</span>
          <span className="tabular text-sm font-medium">{formatMinutes(session.minutes)}</span>
        </button>
      </li>
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSession(session.id, {
        minutes,
        readAt: new Date(readAt).toISOString(),
      });
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  }

  function remove() {
    if (!confirm("¿Borrar este registro?")) return;
    startTransition(async () => {
      const res = await deleteSession(session.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="space-y-4 bg-bg px-4 py-4">
      <MinutesStepper value={minutes} step={step} onChange={setMinutes} />
      <input
        type="datetime-local"
        value={readAt}
        max={toLocalInputValue(new Date())}
        onChange={(e) => setReadAt(e.target.value)}
        className="w-full rounded-2xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-2xl px-4 py-2.5 text-sm font-medium text-danger"
        >
          Borrar
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className="rounded-2xl px-4 py-2.5 text-sm font-medium text-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !readAt}
          className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </li>
  );
}
