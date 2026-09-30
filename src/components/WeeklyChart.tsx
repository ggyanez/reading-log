"use client";

import { useState } from "react";
import { TRACKS, type Library } from "@/lib/books";
import { total, type WeekBar } from "@/lib/stats";
import { formatDayKey, formatMinutes } from "@/lib/time";

const CHART_HEIGHT = 140;
// Bottom to top. Fixed so each track keeps its place and color.
const STACK: Library[] = ["informatica", "general"];
const FILL = { informatica: "bg-career", general: "bg-personal" };

/** Minutes per week, stacked by track. Tap a bar to see its numbers. */
export default function WeeklyChart({ weeks }: { weeks: WeekBar[] }) {
  const [selected, setSelected] = useState(weeks.length - 1);
  const max = Math.max(60, ...weeks.map((w) => total(w.minutes)));
  const week = weeks[selected];

  return (
    <div>
      <Legend />
      <div className="mt-3 flex items-end gap-1.5 border-b border-line" style={{ height: CHART_HEIGHT }}>
        {weeks.map((w, i) => {
          const sum = total(w.minutes);
          const visible = STACK.filter((lib) => w.minutes[lib] > 0);
          return (
            <button
              key={w.weekStart}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Semana del ${formatDayKey(w.weekStart)}: ${formatMinutes(sum)}`}
              aria-pressed={i === selected}
              className={`flex h-full flex-1 flex-col-reverse gap-[2px] rounded-t-md ${
                i === selected ? "bg-line/60" : ""
              }`}
            >
              {visible.map((lib, j) => (
                <span
                  key={lib}
                  className={`block w-full ${FILL[lib]} ${j === visible.length - 1 ? "rounded-t-[4px]" : ""}`}
                  style={{ height: `${(w.minutes[lib] / max) * (CHART_HEIGHT - 8)}px` }}
                />
              ))}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-faint">
        <span>{formatDayKey(weeks[0].weekStart)}</span>
        <span>Esta semana</span>
      </div>

      <p className="mt-4 text-sm">
        <span className="text-muted">
          {selected === weeks.length - 1 ? "Esta semana" : `Semana del ${formatDayKey(week.weekStart)}`}:
        </span>{" "}
        <span className="tabular font-medium">{formatMinutes(total(week.minutes))}</span>
        {total(week.minutes) > 0 && (
          <span className="tabular text-muted">
            {" "}
            ({TRACKS.informatica.label.toLowerCase()} {formatMinutes(week.minutes.informatica)},{" "}
            {TRACKS.general.label.toLowerCase()} {formatMinutes(week.minutes.general)})
          </span>
        )}
      </p>
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex gap-4 text-xs text-muted">
      {STACK.map((lib) => (
        <span key={lib} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${FILL[lib]}`} aria-hidden />
          {TRACKS[lib].label}
        </span>
      ))}
    </div>
  );
}
