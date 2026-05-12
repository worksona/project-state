import PageHeader from "@/components/page-header";
import { CATEGORY_STYLE, getEvents, type CalendarEvent } from "@/lib/calendar";

export const revalidate = 300;
export const metadata = { title: "Calendar" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfMonday(d: Date): Date {
  const x = utcMidnight(d);
  const day = x.getUTCDay() || 7;
  if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage() {
  const today = utcMidnight(new Date());
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const gridStart = startOfMonday(monthStart);
  const gridEnd = addDays(gridStart, 41);

  const horizon = addDays(today, 56);
  const events = await getEvents(gridStart, horizon);

  const byDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const upcoming = events
    .filter((e) => {
      const d = new Date(`${e.date}T00:00:00Z`);
      return d >= today && d <= horizon;
    })
    .slice(0, 20);

  const monthLabel = monthStart.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Cadence"
        title="Calendar"
        description="Project meeting cadence and key dates — recurring weekly rhythm alongside monthly review meetings, quarterly deadlines, and ad-hoc events."
        meta={
          <>
            Sourced from <code>.project-state/cadence.yaml</code> and{" "}
            <code>.project-state/events/</code>. Add a new event by dropping a
            YAML file into <code>events/</code>; new entries appear in ≤5 min.
          </>
        }
      />

      <section>
        <Legend />
      </section>

      <section className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <header className="px-5 py-3 border-b border-[var(--border)] flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{monthLabel}</h2>
          <span className="text-xs text-[var(--muted)]">UTC dates</span>
        </header>

        <div className="grid grid-cols-7 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-[var(--border)] bg-slate-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
          {Array.from({ length: 42 }, (_, i) => {
            const day = addDays(gridStart, i);
            const inMonth = day.getUTCMonth() === monthStart.getUTCMonth();
            const isToday = isoDate(day) === isoDate(today);
            const dayEvents = byDate.get(isoDate(day)) || [];
            return (
              <div
                key={i}
                className={`min-h-[88px] p-1.5 ${inMonth ? "bg-white" : "bg-slate-50"} ${isToday ? "ring-2 ring-inset ring-[var(--accent)]" : ""}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className={`text-xs font-semibold tabular-nums ${isToday ? "text-[var(--accent)]" : inMonth ? "text-slate-700" : "text-slate-400"}`}>
                    {day.getUTCDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-[var(--muted)]">{dayEvents.length}</span>
                  )}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => {
                    const s = CATEGORY_STYLE[e.category];
                    return (
                      <li key={e.id} className="text-[10.5px] flex items-center gap-1 truncate" title={`${e.title}${e.start ? ` · ${e.start}` : ""}`}>
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        <span className="truncate text-slate-700">{e.title}</span>
                      </li>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <li className="text-[10px] text-[var(--muted)]">+{dayEvents.length - 3} more</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Upcoming · next 8 weeks ({upcoming.length})
        </h2>
        <ol className="bg-white border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] shadow-sm">
          {upcoming.map((e) => {
            const s = CATEGORY_STYLE[e.category];
            const d = new Date(`${e.date}T00:00:00Z`);
            const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
            return (
              <li key={e.id} className="p-4 flex items-start gap-4">
                <div className="shrink-0 text-center w-14">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">{dayName}</div>
                  <div className="text-lg font-bold tabular-nums text-slate-800">{d.getUTCDate()}</div>
                  <div className="text-[10px] text-[var(--muted)]">
                    {d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ring-1 ${s.pill}`}>
                      {s.label}
                    </span>
                    {e.start && (
                      <span className="text-xs text-[var(--muted)] font-mono tabular-nums">
                        {e.start}{e.duration_min ? ` · ${e.duration_min} min` : ""}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{e.title}</h3>
                  {e.description && (
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2 whitespace-pre-line">
                      {e.description}
                    </p>
                  )}
                  {e.attendees && e.attendees.length > 0 && (
                    <div className="mt-1.5 text-[10.5px] text-[var(--muted)]">{e.attendees.join(" · ")}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Legend() {
  const items: Array<keyof typeof CATEGORY_STYLE> = [
    "comms", "technical", "consortium", "retro", "governance", "deadline", "milestone",
  ];
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {items.map((k) => {
        const s = CATEGORY_STYLE[k];
        return (
          <span key={k} className={`px-2 py-0.5 rounded-full ring-1 font-medium ${s.pill}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`} />
            {s.label}
          </span>
        );
      })}
    </div>
  );
}
