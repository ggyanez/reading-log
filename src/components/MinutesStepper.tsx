"use client";

import { formatMinutes } from "@/lib/time";

type Props = {
  value: number;
  step: number;
  onChange: (value: number) => void;
};

export default function MinutesStepper({ value, step, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <StepButton label={`Restar ${step} minutos`} onClick={() => onChange(Math.max(step, value - step))}>
        −
      </StepButton>
      <div className="text-center">
        <div className="tabular font-serif text-5xl font-semibold leading-none">{value}</div>
        <div className="mt-1 text-sm text-muted">
          {value >= 60 ? formatMinutes(value) : "minutos"}
        </div>
      </div>
      <StepButton label={`Sumar ${step} minutos`} onClick={() => onChange(Math.min(24 * 60, value + step))}>
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-3xl text-ink shadow-sm transition active:scale-90 active:bg-accent-soft"
    >
      {children}
    </button>
  );
}
