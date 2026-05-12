import {
  buildRange,
  monthTicks,
  pctOfRange,
  progressFor,
} from "@/lib/timeline";
import type { Milestone } from "@/lib/state";
import { type PaletteEntry, FALLBACK } from "@/lib/colors";

const PHASE_GRADIENT: Record<string, string> = {
  "1": "from-sky-500 to-blue-600",
  "2": "from-emerald-500 to-teal-600",
  "3": "from-violet-500 to-indigo-600",
  "4": "from-fuchsia-500 to-pink-600",
  "5": "from-amber-500 to-orange-600",
  "6": "from-rose-500 to-red-600",
};

function phaseNumber(p: string): string {
  return p.match(/(\d)/)?.[1] ?? "1";
}

export default function GanttChart({
  milestones,
  start,
  end,
  ownerMap = new Map(),
}: {
  milestones: Milestone[];
  start: string;
  end: string;
  ownerMap?: Map<string, PaletteEntry>;
}) {
  const range = buildRange(start, end);
  const ticks = monthTicks(range);
  const progress = progressFor(start, end);

  // Build legend from unique owner_short values
  const ownerShorts = Array.from(new Set(milestones.map((m) => m.owner_short).filter(Boolean)));

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Project Gantt
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {start} → {end} · {range.totalWeeks} weeks · {milestones.length} milestones
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {ownerShorts.map((os) => {
            const style = ownerMap.get(os) ?? FALLBACK;
            return (
              <span key={os} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} /> {os}
              </span>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-[180px_1fr] gap-3">
          {/* Header row: month labels */}
          <div />
          <div className="relative h-6 border-b border-[var(--border)]">
            {ticks.map((t) => (
              <div
                key={t.label}
                className="absolute top-0 -translate-x-1/2 text-[10px] text-slate-500 font-medium tabular-nums"
                style={{ left: `${t.pct}%` }}
              >
                <div className="h-2 w-px bg-slate-300 mx-auto" />
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Milestone rows */}
          {milestones.map((m) => {
            const phase = phaseNumber(m.proposal_phase);
            const gradient = PHASE_GRADIENT[phase] || "from-slate-500 to-slate-700";
            const ownerStyle = ownerMap.get(m.owner_short) ?? FALLBACK;
            const startPct = pctOfRange(m.planned_start, range);
            const endPct = pctOfRange(m.planned_end, range);
            const widthPct = Math.max(0.5, endPct - startPct);
            const isComplete = m.status === "complete";
            const isInProgress = m.status === "in_progress";
            const isAtRisk = m.status === "at_risk" || m.status === "blocked";
            const id = m.id.replace(/-.*/, "");
            return (
              <div key={m.id} className="contents">
                <a
                  href={`/milestones#${id}`}
                  className="text-xs flex items-center gap-2 pr-2 truncate hover:text-[var(--accent)]"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ownerStyle.dot}`} />
                  <span className="font-mono font-semibold text-slate-700">
                    {id}
                  </span>
                  <span className="truncate text-slate-600">{m.title}</span>
                </a>
                <div className="relative h-6 my-0.5">
                  {ticks.map((t) => (
                    <div
                      key={t.label}
                      className="absolute top-0 bottom-0 w-px bg-slate-100"
                      style={{ left: `${t.pct}%` }}
                    />
                  ))}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-[var(--accent)]/60"
                    style={{ left: `${progress.percent}%` }}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded shadow-sm ring-1 ${
                      isAtRisk ? "ring-amber-500" : "ring-black/5"
                    }`}
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                    }}
                    title={`${id}: ${m.title} · ${m.planned_start} → ${m.planned_end} · ${m.percent_complete}%`}
                  >
                    <div
                      className={`absolute inset-0 rounded bg-gradient-to-r ${gradient} ${isComplete ? "opacity-100" : isInProgress ? "opacity-90" : "opacity-30"}`}
                    />
                    {m.percent_complete > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-l bg-white/35"
                        style={{ width: `${m.percent_complete}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
