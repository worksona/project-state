import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { STATE_DIR } from "./paths";

export type EventCategory =
  | "comms"
  | "technical"
  | "consortium"
  | "retro"
  | "governance"
  | "deadline"
  | "milestone"
  | "other";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD (UTC)
  start?: string;
  duration_min?: number;
  title: string;
  description?: string;
  category: EventCategory;
  attendees?: string[];
  related_milestone?: string;
  related_risks?: string[];
  source: "cadence-weekly" | "cadence-monthly" | "cadence-quarterly" | "event" | "milestone";
};

type CadenceFile = {
  weekly?: Array<{
    id: string;
    day: string; // monday|tuesday|...
    start?: string;
    duration_min?: number;
    title: string;
    description?: string;
    attendees?: string[];
    category?: EventCategory;
  }>;
  monthly?: Array<{
    id: string;
    day_of_month: number | string; // number or "first-thursday"
    start?: string;
    duration_min?: number;
    title: string;
    description?: string;
    attendees?: string[];
    category?: EventCategory;
  }>;
  quarterly?: Array<{
    id: string;
    months: number[];
    day_of_month: number;
    start?: string;
    duration_min?: number;
    title: string;
    description?: string;
    attendees?: string[];
    category?: EventCategory;
  }>;
};

const DAY_INDEX: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function* eachDayBetween(start: Date, end: Date): Generator<Date> {
  const cur = new Date(start);
  while (cur <= end) {
    yield new Date(cur);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
}

async function readCadence(): Promise<CadenceFile> {
  try {
    const raw = await fs.readFile(path.join(STATE_DIR, "cadence.yaml"), "utf8");
    return YAML.parse(raw) as CadenceFile;
  } catch {
    return {};
  }
}

async function readOneOffEvents(): Promise<CalendarEvent[]> {
  const dir = path.join(STATE_DIR, "events");
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith(".yaml"));
  } catch {
    return [];
  }
  const events: CalendarEvent[] = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    const data = YAML.parse(raw);
    if (!data?.date || !data?.title) continue;
    events.push({
      id: data.id || f.replace(/\.yaml$/, ""),
      date: data.date,
      start: data.start,
      duration_min: data.duration_min,
      title: data.title,
      description: data.description,
      category: (data.category as EventCategory) || "other",
      attendees: data.attendees,
      related_milestone: data.related_milestone,
      related_risks: data.related_risks,
      source: "event",
    });
  }
  return events;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  // month: 0-based. weekday: 0 (Sun) - 6 (Sat). n: 1-based.
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7));
}

function expandMonthlyDayOfMonth(spec: string | number, year: number, month: number): Date | null {
  if (typeof spec === "number") {
    const d = new Date(Date.UTC(year, month, spec));
    return d.getUTCMonth() === month ? d : null;
  }
  const m = String(spec).match(/^(first|second|third|fourth|last)-(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i);
  if (!m) return null;
  const ordinal = m[1].toLowerCase();
  const wd = DAY_INDEX[m[2].toLowerCase()];
  if (ordinal === "last") {
    const last = new Date(Date.UTC(year, month + 1, 0));
    const offset = (last.getUTCDay() - wd + 7) % 7;
    return new Date(Date.UTC(year, month, last.getUTCDate() - offset));
  }
  const n = { first: 1, second: 2, third: 3, fourth: 4 }[ordinal] || 1;
  return nthWeekdayOfMonth(year, month, wd, n);
}

export async function getEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  const cadence = await readCadence();
  const oneOff = await readOneOffEvents();
  const events: CalendarEvent[] = [];

  // Weekly
  for (const w of cadence.weekly || []) {
    const targetDay = DAY_INDEX[w.day.toLowerCase()];
    if (targetDay === undefined) continue;
    for (const day of eachDayBetween(rangeStart, rangeEnd)) {
      if (day.getUTCDay() !== targetDay) continue;
      events.push({
        id: `${w.id}-${isoDate(day)}`,
        date: isoDate(day),
        start: w.start,
        duration_min: w.duration_min,
        title: w.title,
        description: w.description,
        category: w.category || "other",
        attendees: w.attendees,
        source: "cadence-weekly",
      });
    }
  }

  // Monthly
  for (const m of cadence.monthly || []) {
    const cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1));
    while (cursor <= rangeEnd) {
      const date = expandMonthlyDayOfMonth(m.day_of_month, cursor.getUTCFullYear(), cursor.getUTCMonth());
      if (date && date >= rangeStart && date <= rangeEnd) {
        events.push({
          id: `${m.id}-${isoDate(date)}`,
          date: isoDate(date),
          start: m.start,
          duration_min: m.duration_min,
          title: m.title,
          description: m.description,
          category: m.category || "governance",
          attendees: m.attendees,
          source: "cadence-monthly",
        });
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  // Quarterly
  for (const q of cadence.quarterly || []) {
    for (const day of eachDayBetween(rangeStart, rangeEnd)) {
      const month = day.getUTCMonth() + 1;
      if (q.months.includes(month) && day.getUTCDate() === q.day_of_month) {
        events.push({
          id: `${q.id}-${isoDate(day)}`,
          date: isoDate(day),
          start: q.start,
          duration_min: q.duration_min,
          title: q.title,
          description: q.description,
          category: q.category || "deadline",
          attendees: q.attendees,
          source: "cadence-quarterly",
        });
      }
    }
  }

  // One-off events
  for (const e of oneOff) {
    const d = new Date(`${e.date}T00:00:00Z`);
    if (d >= rangeStart && d <= rangeEnd) events.push(e);
  }

  // Sort by date, then start time
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.start || "00:00").localeCompare(b.start || "00:00");
  });
  return events;
}

export const CATEGORY_STYLE: Record<
  EventCategory,
  { dot: string; pill: string; label: string }
> = {
  comms:      { dot: "bg-sky-500",     pill: "bg-sky-100 text-sky-900 ring-sky-300",          label: "Comms" },
  technical:  { dot: "bg-violet-500",  pill: "bg-violet-100 text-violet-900 ring-violet-300",  label: "Technical" },
  consortium: { dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-900 ring-emerald-300", label: "Consortium" },
  retro:      { dot: "bg-amber-500",   pill: "bg-amber-100 text-amber-900 ring-amber-300",      label: "Retro" },
  governance: { dot: "bg-indigo-600",  pill: "bg-indigo-100 text-indigo-900 ring-indigo-300",   label: "Governance" },
  deadline:   { dot: "bg-red-600",     pill: "bg-red-100 text-red-900 ring-red-300",            label: "Deadline" },
  milestone:  { dot: "bg-orange-500",  pill: "bg-orange-100 text-orange-900 ring-orange-300",   label: "Milestone" },
  other:      { dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-700 ring-slate-300",      label: "Other" },
};
