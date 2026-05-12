import { categoryColor, getRisks, severityColor } from "@/lib/state";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Risk Register" };

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

export default async function RisksPage() {
  const risks = await getRisks();
  const sorted = [...risks].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.score?.toLowerCase() || "low") -
      SEVERITY_ORDER.indexOf(b.score?.toLowerCase() || "low"),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Risk Management"
        title="Risk Register"
        description={`Every risk actively tracked — ${risks.length} in total, sorted by severity. Each entry pairs the risk description with a mitigation (what we are already doing) and a contingency (what we will do if it materializes). Owners and related milestones are called out so the right person is on the hook.`}
        meta={
          <>
            Source: <code>.project-state/risks/</code>. New risks should be
            raised via the <code>project-state</code> skill or directly as
            YAML. Severity should be reviewed at every review meeting.
          </>
        }
      />

      <div className="space-y-4">
        {sorted.map((r) => {
          const sevBar =
            r.score?.toLowerCase() === "critical" ? "bg-red-600" :
            r.score?.toLowerCase() === "high" ? "bg-orange-500" :
            r.score?.toLowerCase() === "medium" ? "bg-amber-400" :
            r.score?.toLowerCase() === "low" ? "bg-emerald-500" : "bg-slate-300";
          return (
            <article
              key={r.id}
              id={r.id}
              className="bg-white border border-[var(--border)] rounded-xl p-6 scroll-mt-24 shadow-sm relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sevBar}`} />
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2 pl-2">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1">
                    <span className="font-mono font-semibold text-slate-700">{r.id}</span>
                    <span className="text-slate-300">·</span>
                    <span className={`px-2 py-0.5 rounded-full ring-1 ${categoryColor(r.category)} font-semibold`}>
                      {r.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[var(--muted)]">Owner: {r.owner_org}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{r.title}</h2>
                </div>
                <span className={`shrink-0 px-3 py-1 text-xs rounded-full ring-1 font-bold uppercase tracking-wider ${severityColor(r.score)}`}>
                  {r.score}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
                <Field label="Probability">{r.probability}</Field>
                <Field label="Impact">{r.impact}</Field>
                <Field label="Related Milestones">{r.related_milestones?.join(", ") || "—"}</Field>
              </div>

              {r.description && (
                <div className="mt-4 text-sm text-slate-700 whitespace-pre-line">{r.description}</div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                {r.mitigation && <Block label="Mitigation" tone="emerald">{r.mitigation}</Block>}
                {r.contingency && <Block label="Contingency" tone="amber">{r.contingency}</Block>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-800 font-medium capitalize">{children}</div>
    </div>
  );
}

function Block({ label, children, tone = "slate" }: {
  label: string; children: React.ReactNode; tone?: "slate" | "emerald" | "amber";
}) {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-950",
    amber: "bg-amber-50 border-amber-200 text-amber-950",
  };
  const labelTones = {
    slate: "text-slate-500",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  };
  return (
    <div className={`border rounded-lg p-3.5 ${tones[tone]}`}>
      <div className={`text-xs uppercase tracking-wider mb-1 font-bold ${labelTones[tone]}`}>{label}</div>
      <div className="whitespace-pre-line leading-relaxed">{children}</div>
    </div>
  );
}
