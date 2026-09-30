// Timestamps are stored as ISO-8601 UTC strings (like gym-log). Anything
// that depends on the calendar day or the hour — grouping stats, showing a
// date — goes through this time zone instead of UTC: reading after 21:00 in
// Argentina is already the next day in UTC.
export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";
const LOCALE = "es-AR";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hourFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  hour: "numeric",
  hourCycle: "h23",
});

/** Calendar day in the app time zone, as "YYYY-MM-DD". */
export function dayKey(date: Date | string): string {
  return dayKeyFormat.format(new Date(date));
}

/** Hour of day (0–23) in the app time zone. */
export function hourOf(date: Date | string): number {
  return Number(hourFormat.format(new Date(date)));
}

/** Shifts a "YYYY-MM-DD" key by whole days. Pure calendar math, no time zone involved. */
export function addDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing the given "YYYY-MM-DD" key. */
export function weekStart(key: string): string {
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(key, -((weekday + 6) % 7));
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: sameYearAsNow(date) ? undefined : "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const time = new Date(date).toLocaleTimeString(LOCALE, {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${formatDate(date)}, ${time}`;
}

/** Short label for a "YYYY-MM-DD" key, e.g. "29 sept". */
export function formatDayKey(key: string): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString(LOCALE, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}

function sameYearAsNow(date: Date | string): boolean {
  return dayKey(date).slice(0, 4) === dayKey(new Date()).slice(0, 4);
}
