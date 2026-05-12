import { progressFor } from "@/lib/timeline";

export default function TimelineBar({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const p = progressFor(start, end);
  const hatchmarks = Array.from({ length: p.totalWeeks }, (_, i) => i);
  return (
    <div className="border-b border-[var(--border)] bg-white">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3">
        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold whitespace-nowrap">
          Week {p.currentWeekNumber} / {p.totalWeeks}
        </div>
        <div className="relative flex-1 h-3.5 select-none">
          {/* Track */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
          {/* Hatchmarks — one tick per week */}
          <div className="absolute inset-0 flex">
            {hatchmarks.map((i) => (
              <div key={i} className="flex-1 relative">
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-px ${
                    i % 13 === 0
                      ? "h-3 bg-slate-400"
                      : i % 4 === 0
                        ? "h-2 bg-slate-300"
                        : "h-1.5 bg-slate-200"
                  }`}
                />
              </div>
            ))}
          </div>
          {/* Filled progress */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
            style={{ width: `${p.percent}%` }}
          />
          {/* Today marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)]"
            style={{ left: `${p.percent}%` }}
            aria-label="Today"
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--accent)] rounded-full ring-2 ring-white" />
          </div>
        </div>
        <div className="text-[11px] font-mono font-semibold text-slate-700 tabular-nums whitespace-nowrap">
          {p.percent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
