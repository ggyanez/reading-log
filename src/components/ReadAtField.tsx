"use client";

type Props = {
  /** A `datetime-local` value, or null for "now". */
  value: string | null;
  onChange: (value: string | null) => void;
};

/** "When did you read?" — defaults to now; only shows a picker when asked. */
export default function ReadAtField({ value, onChange }: Props) {
  if (value === null) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-muted">
        <span>Ahora</span>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={() => onChange(toLocalInputValue(new Date()))}
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          Cambiar fecha y hora
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        max={toLocalInputValue(new Date())}
        onChange={(e) => onChange(e.target.value || null)}
        className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={() => onChange(null)}
        className="shrink-0 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted"
      >
        Usar ahora
      </button>
    </div>
  );
}

/** Formats a date as a `datetime-local` value in the device's time zone. */
export function toLocalInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
