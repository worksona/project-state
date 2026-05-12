// Project timeline math — 52-week windows from project_start to project_end.

export type TimelineRange = {
  start: Date;
  end: Date;
  totalDays: number;
  totalWeeks: number;
};

export type TimelineProgress = {
  start: Date;
  end: Date;
  today: Date;
  totalDays: number;
  totalWeeks: number;
  daysElapsed: number;
  weeksElapsed: number;
  percent: number; // 0-100
  currentWeekNumber: number; // 1-based, clamped 1..totalWeeks
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseISODate(s: string): Date {
  // Treat YYYY-MM-DD as midnight UTC for stable math regardless of TZ.
  return new Date(`${s}T00:00:00Z`);
}

export function startOfWeek(d: Date): Date {
  // ISO week starts Monday. Returns UTC date at 00:00.
  const date = new Date(d);
  const day = date.getUTCDay() || 7;
  if (day !== 1) {
    date.setUTCDate(date.getUTCDate() - (day - 1));
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function buildRange(startISO: string, endISO: string): TimelineRange {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const totalDays = dayDiff(start, end) + 1;
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  return { start, end, totalDays, totalWeeks };
}

export function progressFor(
  startISO: string,
  endISO: string,
  today: Date = new Date(),
): TimelineProgress {
  const range = buildRange(startISO, endISO);
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const rawDays = dayDiff(range.start, todayUTC);
  const daysElapsed = Math.max(0, Math.min(range.totalDays, rawDays));
  const weeksElapsed = Math.floor(daysElapsed / 7);
  const percent = Math.max(
    0,
    Math.min(100, (daysElapsed / range.totalDays) * 100),
  );
  const currentWeekNumber = Math.max(
    1,
    Math.min(range.totalWeeks, weeksElapsed + 1),
  );
  return {
    start: range.start,
    end: range.end,
    today: todayUTC,
    totalDays: range.totalDays,
    totalWeeks: range.totalWeeks,
    daysElapsed,
    weeksElapsed,
    percent,
    currentWeekNumber,
  };
}

// Position helpers in % across the full project window.
export function pctOfRange(
  date: Date | string,
  range: TimelineRange,
): number {
  const d = typeof date === "string" ? parseISODate(date) : date;
  const days = dayDiff(range.start, d);
  return Math.max(0, Math.min(100, (days / range.totalDays) * 100));
}

// Returns array of month label positions for tick marks across the timeline.
export function monthTicks(
  range: TimelineRange,
): { label: string; pct: number }[] {
  const ticks: { label: string; pct: number }[] = [];
  const cursor = new Date(
    Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth(), 1),
  );
  while (cursor <= range.end) {
    const pct = pctOfRange(cursor, range);
    if (pct >= 0 && pct <= 100) {
      ticks.push({
        label: cursor.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        pct,
      });
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return ticks;
}

export function isThisWeek(
  start: string,
  end: string,
  today: Date = new Date(),
): boolean {
  const s = parseISODate(start);
  const e = parseISODate(end);
  const wkStart = startOfWeek(today);
  const wkEnd = new Date(wkStart);
  wkEnd.setUTCDate(wkStart.getUTCDate() + 6);
  return e >= wkStart && s <= wkEnd;
}
