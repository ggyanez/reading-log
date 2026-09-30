import Link from "next/link";
import WeeklyChart, { Legend } from "@/components/WeeklyChart";
import { getBooks, getStatsSessions } from "@/lib/data";
import { computeStats, total } from "@/lib/stats";
import { TRACKS } from "@/lib/books";
import { formatDate, formatMinutes } from "@/lib/time";

export default async function EstadisticasPage() {
  const [sessions, books] = await Promise.all([getStatsSessions(), getBooks()]);

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-semibold">Estadísticas</h1>
        <p className="text-muted">Todavía no hay registros. Las estadísticas aparecen con tu primera sesión.</p>
      </div>
    );
  }

  const stats = computeStats(sessions, new Date());
  const thisWeek = total(stats.thisWeek);
  const last30 = total(stats.last30);
  const maxBand = Math.max(...stats.timeOfDay.map((b) => b.minutes));
  const readBooks = books
    .filter((b) => b.sessionCount > 0)
    .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""));

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Estadísticas</h1>

      <Card title="Esta semana">
        <p className="tabular font-serif text-4xl font-semibold">{formatMinutes(thisWeek)}</p>
        {stats.recentWeeklyAverage !== null && (
          <p className="mt-1 text-sm text-muted">
            Promedio de las semanas anteriores: {formatMinutes(stats.recentWeeklyAverage)}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Días con lectura">
          <p className="tabular font-serif text-2xl font-semibold whitespace-nowrap">
            {stats.daysRead30}
            <span className="text-lg font-normal text-muted"> de 30</span>
          </p>
          <p className="mt-1 text-xs text-muted">últimos 30 días</p>
        </Card>
        <Card title="Últimos 30 días">
          <p className="tabular font-serif text-2xl font-semibold whitespace-nowrap">{formatMinutes(last30)}</p>
          <p className="mt-1 text-xs text-muted">en total</p>
        </Card>
      </div>

      <Card title="Por semana">
        <WeeklyChart weeks={stats.weeks} />
      </Card>

      {last30 > 0 && (
        <Card title="Carrera y personal · 30 días">
          <Legend />
          <div className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-[4px]">
            {stats.last30.informatica > 0 && (
              <span className="bg-career" style={{ flexGrow: stats.last30.informatica }} />
            )}
            {stats.last30.general > 0 && (
              <span className="bg-personal" style={{ flexGrow: stats.last30.general }} />
            )}
          </div>
          <div className="tabular mt-2 flex justify-between text-sm">
            <span>
              {TRACKS.informatica.label} {Math.round((stats.last30.informatica / last30) * 100)}%
            </span>
            <span>
              {TRACKS.general.label} {Math.round((stats.last30.general / last30) * 100)}%
            </span>
          </div>
        </Card>
      )}

      <Card title="Cuándo leés">
        <ul className="space-y-2.5">
          {stats.timeOfDay.map((band) => (
            <li key={band.label} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="leading-tight">
                {band.label}
                <span className="block text-xs text-faint">{band.range}</span>
              </span>
              <span className="h-2.5 overflow-hidden rounded-r-[4px]">
                <span
                  className="block h-full rounded-r-[4px] bg-accent"
                  style={{ width: `${maxBand ? (band.minutes / maxBand) * 100 : 0}%` }}
                />
              </span>
              <span className="tabular text-right whitespace-nowrap text-muted">{formatMinutes(band.minutes)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Por libro">
        <ul className="divide-y divide-line">
          {readBooks.map((b) => (
            <li key={b.id}>
              <Link href={`/biblioteca/${b.id}`} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-serif">{b.title}</span>
                  <span className="block text-xs text-muted">
                    {b.sessionCount} {b.sessionCount === 1 ? "sesión" : "sesiones"} ·{" "}
                    {formatDate(b.firstReadAt!)} – {formatDate(b.lastReadAt!)}
                  </span>
                </span>
                <span className="tabular shrink-0 text-sm font-medium">{formatMinutes(b.totalMinutes)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface px-5 py-4">
      <h2 className="mb-2 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}
