import Image from "next/image";
import { getManifest, getMilestones, statusColor, type Milestone } from "@/lib/state";
import { getReportDocBySlug, renderDocxToHtml } from "@/lib/documents";
import { buildStakeholderMap, stakeholderStyle } from "@/lib/colors";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Milestones" };

const PHASE_COLOR: Record<string, string> = {
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

export default async function MilestonesPage() {
  const [manifest, milestones] = await Promise.all([getManifest(), getMilestones()]);
  const orgs = manifest.stakeholders?.organizations ?? [];
  const ownerMap = buildStakeholderMap(orgs);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Project Plan"
        title="Milestones"
        description={`The ${milestones.length} milestones in the project plan — each one a unit of work with a planned window, completion criteria, and technical progress. Use this view to see where we are, what's coming, and the spec committed to deliver.`}
        meta={
          <>
            Source: <code>.project-state/milestones/</code>. Status updates appear in ≤5 min after a YAML edit and push.
          </>
        }
      />

      <div className="space-y-5">
        {milestones.map((m) => (
          <MilestoneCard key={m.id} m={m} ownerMap={ownerMap} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({
  m,
  ownerMap,
}: {
  m: Milestone;
  ownerMap: Map<string, import("@/lib/colors").PaletteEntry>;
}) {
  const id = m.id.replace(/-.*/, "");
  const phase = phaseNumber(m.proposal_phase);
  const phaseGradient = PHASE_COLOR[phase] || "from-slate-500 to-slate-700";
  const style = stakeholderStyle(m.owner_short, ownerMap);

  return (
    <article
      id={id}
      className="bg-white border border-[var(--border)] rounded-xl overflow-hidden scroll-mt-24 shadow-sm"
    >
      <div className={`h-1.5 bg-gradient-to-r ${phaseGradient}`} />
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {m.cover_image && (
            <div className="shrink-0 relative w-full sm:w-48 md:w-56 aspect-square rounded-lg overflow-hidden ring-1 ring-[var(--border)] bg-slate-50">
              <Image
                src={m.cover_image}
                alt={`${id} illustration`}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider flex-wrap">
                <span className="font-mono font-semibold text-slate-700">{id}</span>
                <span className="text-slate-300">·</span>
                <span className={`px-2 py-0.5 rounded-full ring-1 ${style.pill} font-semibold`}>
                  {m.owner_short}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[var(--muted)] font-medium">{m.proposal_phase}</span>
              </div>
              <span className={`shrink-0 px-3 py-1 text-xs rounded-full ring-1 font-semibold uppercase tracking-wide ${statusColor(m.status)}`}>
                {m.status.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
              {m.title}
            </h2>

            {m.description && (
              <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {m.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto pt-4">
              <Stat label="Owner" value={m.owner_org} tone="slate" />
              <Stat label="Planned Window" value={`${m.planned_start} → ${m.planned_end}`} tone="sky" />
              <Stat
                label="Progress"
                value={`${m.percent_complete}%`}
                tone={m.percent_complete >= 100 ? "emerald" : m.percent_complete > 0 ? "amber" : "slate"}
              />
            </div>
          </div>
        </div>

        {m.at_risk_reason && (
          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r text-sm text-amber-900">
            <span className="font-semibold">At risk:</span> {m.at_risk_reason}
          </div>
        )}

        {m.technical_progress && (
          <div className="mt-4 p-4 bg-slate-50 border border-[var(--border)] rounded-lg text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {m.technical_progress}
          </div>
        )}

        {m.completion_criteria && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-[var(--accent)] font-medium">
              Completion criteria
            </summary>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
              {m.completion_criteria}
            </p>
          </details>
        )}
      </div>
    </article>
  );
}

const TONE: Record<string, string> = {
  slate: "bg-slate-50 border-slate-200",
  sky: "bg-sky-50 border-sky-200",
  emerald: "bg-emerald-50 border-emerald-200",
  amber: "bg-amber-50 border-amber-200",
};

function Stat({ label, value, tone = "slate" }: {
  label: string; value: string; tone?: keyof typeof TONE;
}) {
  return (
    <div className={`rounded-lg border px-3.5 py-2.5 ${TONE[tone]}`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className="mt-0.5 text-sm text-slate-900 font-semibold">{value}</div>
    </div>
  );
}
