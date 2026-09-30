import type { Library } from "./books";
import type { StatsSession } from "./data";
import { addDays, dayKey, hourOf, weekStart } from "./time";

export type TrackSplit = Record<Library, number>;

export type WeekBar = { weekStart: string; minutes: TrackSplit };

export type Stats = {
  thisWeek: TrackSplit;
  /** Average of the previous (up to 4) full weeks since you started logging; null with no history. */
  recentWeeklyAverage: number | null;
  weeks: WeekBar[];
  daysRead30: number;
  last30: TrackSplit;
  timeOfDay: { label: string; range: string; minutes: number }[];
};

const WEEKS_SHOWN = 12;

const TIME_BANDS = [
  { label: "Madrugada", range: "0–6 h", from: 0 },
  { label: "Mañana", range: "6–12 h", from: 6 },
  { label: "Tarde", range: "12–18 h", from: 12 },
  { label: "Noche", range: "18–24 h", from: 18 },
];

const empty = (): TrackSplit => ({ informatica: 0, general: 0 });

export function total(split: TrackSplit): number {
  return split.informatica + split.general;
}

export function computeStats(sessions: StatsSession[], now: Date): Stats {
  const today = dayKey(now);
  const thisWeekStart = weekStart(today);
  const last30Start = addDays(today, -29);

  const byWeek = new Map<string, TrackSplit>();
  const days30 = new Set<string>();
  const last30 = empty();
  const bandMinutes = TIME_BANDS.map(() => 0);
  let firstWeek: string | null = null;

  for (const s of sessions) {
    const day = dayKey(s.readAt);
    const week = weekStart(day);
    if (firstWeek === null || week < firstWeek) firstWeek = week;

    const split = byWeek.get(week) ?? empty();
    split[s.library] += s.minutes;
    byWeek.set(week, split);

    if (day >= last30Start && day <= today) {
      days30.add(day);
      last30[s.library] += s.minutes;
    }

    // read_at is when the reading ended; the midpoint is a better guess
    // at "when" than the end, especially for long sessions.
    const midpoint = new Date(new Date(s.readAt).getTime() - (s.minutes * 60_000) / 2);
    const hour = hourOf(midpoint);
    bandMinutes[TIME_BANDS.findLastIndex((b) => hour >= b.from)] += s.minutes;
  }

  const weeks: WeekBar[] = [];
  for (let i = WEEKS_SHOWN - 1; i >= 0; i--) {
    const start = addDays(thisWeekStart, -7 * i);
    weeks.push({ weekStart: start, minutes: byWeek.get(start) ?? empty() });
  }

  // Weeks before your first session don't count toward the average —
  // otherwise it starts out dragged down by weeks when the app didn't exist.
  const previousWeeks = [1, 2, 3, 4]
    .map((i) => addDays(thisWeekStart, -7 * i))
    .filter((w) => firstWeek !== null && w >= firstWeek);
  const recentWeeklyAverage = previousWeeks.length
    ? Math.round(
        previousWeeks.reduce((sum, w) => sum + total(byWeek.get(w) ?? empty()), 0) /
          previousWeeks.length,
      )
    : null;

  return {
    thisWeek: byWeek.get(thisWeekStart) ?? empty(),
    recentWeeklyAverage,
    weeks,
    daysRead30: days30.size,
    last30,
    timeOfDay: TIME_BANDS.map((b, i) => ({ label: b.label, range: b.range, minutes: bandMinutes[i] })),
  };
}
