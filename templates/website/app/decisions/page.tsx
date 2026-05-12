import { getDecisions } from "@/lib/state";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Decisions Log" };

export default async function DecisionsPage() {
  const decisions = await getDecisions();
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Governance"
        title="Decisions Log"
        description={`The formal record of project-level decisions — what was chosen, why, and what consequences were accepted. Treat this like an Architecture Decision Record (ADR) log: write to it whenever a choice meaningfully affects scope, technology, IP, partners, or process. ${decisions.length} ${decisions.length === 1 ? "decision" : "decisions"} recorded so far.`}
        meta={
          <>
            Source: <code>.project-state/decisions/</code>. Decisions ratified at
            review meetings should reference the relevant meeting packet.
          </>
        }
      />

      <div className="space-y-4">
        {decisions.map((d) => (
          <article
            key={d.id}
            id={d.id}
            className="bg-white border border-[var(--border)] rounded-lg p-6 scroll-mt-24"
          >
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
              {d.id} {d.date && <>· {d.date}</>}{" "}
              {d.status && <>· {d.status}</>}
            </div>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{d.title}</h2>
            {d.context && <Section label="Context">{d.context}</Section>}
            {d.decision && <Section label="Decision">{d.decision}</Section>}
            {d.rationale && <Section label="Rationale">{d.rationale}</Section>}
            {d.consequences && <Section label="Consequences">{d.consequences}</Section>}
          </article>
        ))}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 text-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-slate-700 whitespace-pre-line leading-relaxed">{children}</div>
    </div>
  );
}
