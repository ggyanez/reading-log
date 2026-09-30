"use client";

import { useState, useTransition } from "react";
import { setStepMinutes, syncNotion } from "@/app/actions";

const STEPS = [5, 10, 15];

export function SyncButton() {
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function sync() {
    setMessage(null);
    startTransition(async () => {
      const res = await syncNotion();
      if (!res.ok) {
        setMessage({ text: res.error, error: true });
        return;
      }
      const { books, removed } = res.data;
      setMessage({
        text:
          `${books} libros sincronizados` +
          (removed > 0 ? ` · ${removed} ya no están en Notion` : ""),
        error: false,
      });
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        className="w-full rounded-2xl bg-accent py-3 font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Sincronizando…" : "Sincronizar con Notion"}
      </button>
      {message && (
        <p className={`mt-2 text-sm ${message.error ? "text-danger" : "text-muted"}`}>{message.text}</p>
      )}
    </div>
  );
}

export function StepPicker({ value }: { value: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {STEPS.map((step) => (
        <button
          key={step}
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await setStepMinutes(step)))}
          className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition ${
            value === step ? "bg-ink text-surface" : "border border-line text-muted"
          }`}
        >
          {step} min
        </button>
      ))}
    </div>
  );
}
