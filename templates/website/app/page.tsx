import Link from "next/link";
import {
  fmtCAD,
  getManifest,
  getMilestones,
  getRisks,
  getState,
  ragColor,
  severityColor,
  statusColor,
  type Milestone,
} from "@/lib/state";
import { isThisWeek, parseISODate, progressFor } from "@/lib/timeline";
import { buildStakeholderMap, stakeholderStyle } from "@/lib/colors";
import GanttChart from "@/components/gantt-chart";

export const revalidate = 300;

export default async function DashboardPage() {
  const [manifest, state, milestones, risks] = await Promise.all([
    getManifest(),
    getState(),
    getMilestones(),
    getRisks(),
  ]);

  const orgs = manifest.stakeholders?.organizations ?? [];
  const ownerMap = buildStakeholderMap(orgs);

  const phaseLabel = state.current_phase.replace(/^\d+-/, "").replace(/-/g, " ");
  const progress = progressFor(
    manifest.dates.project_start as string,
    manifest.dates.project_end as string,
  );

  const criticalRisks = risks.filter((r) => r.score?.toLowerCase() === "critical");
  const highRisks = risks.filter((r) => r.score?.toLowerCase() === "high");
  const inProgress = milestones.filter((m) => m.status === "in_progress");
  const atRisk = milestones.filter(
    (m) => m.status === "at_risk" || m.status === "blocked",
  );

  const activeThisWeek = milestones.filter((m) =>
    isThisWeek(m.planned_start, m.planned_end),
  );

  const today = progress.today;
  const horizon = new Date(today);
  horizon.setUTCDate(today.getUTCDate() + 21);
  const upcoming = milestones
    .filter((m) => {
      const s = parseISODate(m.planned_start);
      return s > today && s <= horizon;
    })
    .sort((a, b) => a.planned_start.localeCompare(b.planned_start));

  const hotItems: { kind: "risk" | "milestone"; id: string; title: string; href: string; tone: string }[] = [];
  for (const r of criticalRisks) {
    hotItems.push({ kind: "risk", id: r.id, title: r.title, href: `/risks#${r.id}`, tone: "critical" });
  }
  for (const m of atRisk) {
    hotItems.push({
      kind: "milestone",
      id: m.id.replace(/-.*/, ""),
      title: m.title,
      href: `/milestones#${m.id.replace(/-.*/, "")}`,
      tone: m.status === "blocked" ? "critical" : "high",
    });
  }

  const budget = manifest.budget;

  return (
    <div className="space-y-8">
      {/* Project identity */}
      <section className="border-b border-[var(--border)] pb-6">
        {(manifest.project.pic_project_number || manifest.project.funder || manifest.project.program) && (
          <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
            {[manifest.project.pic_project_number, manifest.project.funder, manifest.project.program]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          {manifest.project.long_name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 leading-relaxed">
          At-a-glance state of the project — phase, RAG health, this week's work, milestones in flight, and items needing attention. Everything below revalidates within 5 minutes of any state change.
        </p>
      </section>

      {/* Compact stats row */}
      <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <CompactStat label="Phase" value={phaseLabel} tone="indigo" />
        <CompactStat
          label="Health"
          value={state.health.overall_status?.toUpperCase() ?? "—"}
          tone={
            state.health.overall_status === "green" ? "emerald" :
            state.health.overall_status === "amber" ? "amber" :
            state.health.overall_status === "red" ? "red" : "slate"
          }
        />
        <CompactStat label="Week" value={`${progress.currentWeekNumber}/${progress.totalWeeks}`} tone="sky" />
        <CompactStat label="% Done" value={`${progress.percent.toFixed(1)}%`} tone="violet" />
        {budget?.total_project_cad != null && (
          <CompactStat label="Total" value={fmtCAD(budget.total_project_cad)} tone="slate" small />
        )}
        {budget?.pic_co_investment_cad != null && (
          <CompactStat label="Funder" value={fmtCAD(budget.pic_co_investment_cad)} tone="emerald" small />
        )}
      </section>

      {/* RAG row */}
      <section className="grid grid-cols-4 gap-3">
        {(["schedule", "budget", "scope", "risk"] as const).map((k) => {
          const status = state.health[`${k}_status`] || "";
          const dotColor =
            status === "green" ? "bg-emerald-500" :
            status === "amber" ? "bg-amber-500" :
            status === "red" ? "bg-red-500" : "bg-slate-400";
          return (
            <div key={k} className="flex items-center gap-2.5 bg-white border border-[var(--border)] rounded-lg px-3 py-2">
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold capitalize">{k}</span>
              <span className={`ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ragColor(status)}`}>
                {status}
              </span>
            </div>
          );
        })}
      </section>

      {/* Gantt */}
      <section>
        <GanttChart
          milestones={milestones}
          start={manifest.dates.project_start as string}
          end={manifest.dates.project_end as string}
          ownerMap={ownerMap}
        />
      </section>

      {/* This week + Active + Hot items */}
      <section className="grid lg:grid-cols-3 gap-5">
        <Card title="This Week" badge={activeThisWeek.length}>
          {activeThisWeek.length === 0 ? (
            <Empty>No milestones overlap the current week.</Empty>
          ) : (
            <ul className="space-y-3">
              {activeThisWeek.map((m) => (
                <MilestoneRow key={m.id} m={m} ownerMap={ownerMap} showStatus />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active Work" badge={inProgress.length} accent="blue">
          {inProgress.length === 0 ? (
            <Empty>No milestones in progress yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {inProgress.map((m) => (
                <MilestoneRow key={m.id} m={m} ownerMap={ownerMap} showProgress />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Hot Items" badge={hotItems.length} accent="red">
          {hotItems.length === 0 ? (
            <Empty>No critical risks or at-risk milestones.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {hotItems.slice(0, 6).map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  <Link href={h.href} className="flex items-start gap-2 group">
                    <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${h.tone === "critical" ? "bg-red-500" : "bg-orange-500"}`} />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
                        {h.kind === "risk" ? "Critical risk" : "Milestone"} · {h.id}
                      </div>
                      <div className="text-sm text-slate-800 group-hover:text-[var(--accent)] leading-snug">
                        {h.title}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Upcoming + Risks */}
      <section className="grid lg:grid-cols-2 gap-5">
        <Card title="Upcoming (next 21 days)" badge={upcoming.length}>
          {upcoming.length === 0 ? (
            <Empty>Nothing starting in the next three weeks.</Empty>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((m) => (
                <MilestoneRow key={m.id} m={m} ownerMap={ownerMap} showStart />
              ))}
            </ul>
          )}
        </Card>

        <Card title="High & Critical Risks" badge={criticalRisks.length + highRisks.length} accent="amber">
          <ul className="space-y-2.5">
            {[...criticalRisks, ...highRisks].slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ring-1 ${severityColor(r.score)}`}>
                  {r.score}
                </span>
                <Link href={`/risks#${r.id}`} className="text-sm text-slate-800 hover:text-[var(--accent)] leading-snug">
                  <span className="font-mono text-xs text-slate-500 mr-1">{r.id}</span>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Key dates */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DateCard label="Project Start" date={manifest.dates.project_start} />
        <DateCard label="Project End" date={manifest.dates.project_end} />
        <DateCard label="Next Claim Due" date={state.pointers.next_claim_due} highlight />
        <DateCard label="Proposal Submitted" date={manifest.dates.proposal_submitted} />
      </section>
    </div>
  );
}

const TONE_BG: Record<string, { bg: string; bar: string; value: string }> = {
  slate:   { bg: "bg-white",         bar: "bg-slate-300",   value: "text-slate-900" },
  indigo:  { bg: "bg-indigo-50/70",  bar: "bg-indigo-500",  value: "text-indigo-900" },
  sky:     { bg: "bg-sky-50/70",     bar: "bg-sky-500",     value: "text-sky-900" },
  violet:  { bg: "bg-violet-50/70",  bar: "bg-violet-500",  value: "text-violet-900" },
  emerald: { bg: "bg-emerald-50/70", bar: "bg-emerald-500", value: "text-emerald-900" },
  amber:   { bg: "bg-amber-50/70",   bar: "bg-amber-500",   value: "text-amber-900" },
  red:     { bg: "bg-red-50/70",     bar: "bg-red-500",     value: "text-red-900" },
};

function CompactStat({ label, value, tone = "slate", small = false }: {
  label: string; value: string; tone?: keyof typeof TONE_BG; small?: boolean;
}) {
  const t = TONE_BG[tone];
  return (
    <div className={`relative ${t.bg} border border-[var(--border)] rounded-lg px-3 py-2 overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${t.bar}`} />
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className={`mt-0.5 font-bold tabular-nums ${small ? "text-sm" : "text-lg"} ${t.value}`}>{value}</div>
    </div>
  );
}

function Card({ title, badge, accent, children }: {
  title: string; badge?: number; accent?: "blue" | "red" | "amber"; children: React.ReactNode;
}) {
  const accentBg =
    accent === "blue" ? "bg-blue-100 text-blue-900" :
    accent === "red" ? "bg-red-100 text-red-900" :
    accent === "amber" ? "bg-amber-100 text-amber-900" :
    "bg-slate-100 text-slate-700";
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {typeof badge === "number" && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${accentBg}`}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[var(--muted)] py-2">{children}</p>;
}

import type { PaletteEntry } from "@/lib/colors";

function MilestoneRow({ m, ownerMap, showStatus, showProgress, showStart }: {
  m: Milestone;
  ownerMap: Map<string, PaletteEntry>;
  showStatus?: boolean;
  showProgress?: boolean;
  showStart?: boolean;
}) {
  const id = m.id.replace(/-.*/, "");
  const style = stakeholderStyle(m.owner_short, ownerMap);
  return (
    <li className="flex items-start gap-2.5">
      <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <div className="flex-1 min-w-0">
        <Link
          href={`/milestones#${id}`}
          className="block text-sm font-medium text-slate-800 hover:text-[var(--accent)] leading-snug"
        >
          <span className="font-mono text-xs text-slate-500 mr-1">{id}</span>
          {m.title}
        </Link>
        <div className="text-[11px] text-[var(--muted)] mt-0.5">
          {m.owner_short} · {m.planned_start} → {m.planned_end}
          {showProgress && m.percent_complete > 0 && <> · {m.percent_complete}%</>}
        </div>
      </div>
      {showStatus && (
        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] rounded font-bold uppercase ring-1 ${statusColor(m.status)}`}>
          {m.status.replace("_", " ")}
        </span>
      )}
      {showStart && (
        <span className="shrink-0 text-[10px] text-[var(--muted)] font-mono">{m.planned_start}</span>
      )}
    </li>
  );
}

function DateCard({ label, date, highlight }: {
  label: string; date: string | null | undefined; highlight?: boolean;
}) {
  return (
    <div className={`bg-white border ${highlight ? "border-amber-300" : "border-[var(--border)]"} rounded-lg px-3 py-2`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${highlight ? "text-amber-900" : "text-slate-800"}`}>
        {date ?? <span className="text-[var(--muted)] font-normal">TBD</span>}
      </div>
    </div>
  );
}
