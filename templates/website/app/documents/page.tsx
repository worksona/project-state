import {
  custodyStatusColor,
  docTypeColor,
  getDocuments,
  type CustodyEvent,
  type DocumentCustody,
} from "@/lib/state";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export default async function DocumentsPage() {
  const docs = await getDocuments();

  const statusOrder: Record<string, number> = {
    rejected: 0,
    "under-review": 1,
    received: 2,
    expected: 3,
    accepted: 4,
  };
  const sorted = [...docs].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 5;
    const sb = statusOrder[b.status] ?? 5;
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });

  const counts = {
    expected: docs.filter((d) => d.status === "expected").length,
    received: docs.filter((d) => d.status === "received").length,
    underReview: docs.filter((d) => d.status === "under-review").length,
    accepted: docs.filter((d) => d.status === "accepted").length,
    rejected: docs.filter((d) => d.status === "rejected").length,
  };

  const milestoneSet = new Set<string>();
  for (const d of docs) {
    for (const m of d.related_milestones ?? []) milestoneSet.add(m);
  }
  const milestones = Array.from(milestoneSet).sort();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Document Custody & Provenance"
        title="Documents"
        description="Chain-of-custody tracking for every document delivered to or from the consortium. Records who provided what, when it was received, and its acceptance status."
        meta={
          <span>
            {docs.length} document{docs.length !== 1 ? "s" : ""} tracked
            {counts.expected > 0 && <> · <span className="text-amber-700 font-medium">{counts.expected} expected</span></>}
            {counts.received > 0 && <> · <span className="text-blue-700 font-medium">{counts.received} received</span></>}
            {counts.underReview > 0 && <> · <span className="text-amber-700 font-medium">{counts.underReview} under review</span></>}
            {counts.accepted > 0 && <> · <span className="text-emerald-700 font-medium">{counts.accepted} accepted</span></>}
            {counts.rejected > 0 && <> · <span className="text-red-700 font-medium">{counts.rejected} rejected</span></>}
          </span>
        }
      />

      {milestones.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-[var(--muted)] self-center">Filter:</span>
          {milestones.map((m) => (
            <a
              key={m}
              href={`#milestone-${m}`}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-[var(--accent)] hover:text-white transition font-mono font-semibold"
            >
              {m}
            </a>
          ))}
        </div>
      )}

      {milestones.map((m) => {
        const group = sorted.filter((d) => d.related_milestones?.includes(m));
        if (group.length === 0) return null;
        return (
          <section key={m} id={`milestone-${m}`} className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-[var(--accent)] font-bold border-b border-[var(--border)] pb-2">
              Milestone {m}
            </h2>
            <div className="space-y-4">
              {group.map((doc) => <DocCard key={doc.id} doc={doc} />)}
            </div>
          </section>
        );
      })}

      {(() => {
        const ungrouped = sorted.filter((d) => !d.related_milestones || d.related_milestones.length === 0);
        if (ungrouped.length === 0) return null;
        return (
          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-[var(--accent)] font-bold border-b border-[var(--border)] pb-2">
              General
            </h2>
            <div className="space-y-4">
              {ungrouped.map((doc) => <DocCard key={doc.id} doc={doc} />)}
            </div>
          </section>
        );
      })()}

      {docs.length === 0 && (
        <div className="bg-white border border-[var(--border)] rounded-xl p-10 text-center text-sm text-[var(--muted)]">
          No custody records yet. Add YAML files to{" "}
          <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            .project-state/documents/custody/
          </code>
        </div>
      )}
    </div>
  );
}

function DocCard({ doc }: { doc: DocumentCustody }) {
  const statusBadge = custodyStatusColor(doc.status);
  const typeBadge = docTypeColor(doc.document_type);
  const isComplete = doc.status === "accepted" || doc.status === "rejected";

  return (
    <div
      id={doc.id}
      className={`bg-white border rounded-xl overflow-hidden shadow-sm ${
        doc.status === "rejected" ? "border-red-200" :
        doc.status === "accepted" ? "border-emerald-200" : "border-[var(--border)]"
      }`}
    >
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-start gap-x-3 gap-y-2">
        <span className="font-mono text-xs text-slate-400 self-center">{doc.id}</span>
        <h3 className="flex-1 text-base font-semibold text-slate-900 leading-snug min-w-0">{doc.title}</h3>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ring-1 ${typeBadge}`}>
            {doc.document_type.replace(/-/g, " ")}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ring-1 ${statusBadge}`}>
            {doc.status.replace(/-/g, " ")}
          </span>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-4">
        {doc.description && (
          <p className="text-sm text-slate-600 leading-relaxed">{doc.description.trim()}</p>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {doc.provided_by?.organization && (
            <div>
              <span className="text-[var(--muted)] uppercase tracking-wider font-semibold text-[10px]">Provided by</span>
              <div className="mt-0.5 text-slate-700 font-medium">
                {doc.provided_by.organization}
                {doc.provided_by.person && <span className="text-slate-400 font-normal"> · {doc.provided_by.person}</span>}
              </div>
              {doc.provided_by.date_provided && <div className="text-slate-400 font-mono">{doc.provided_by.date_provided}</div>}
            </div>
          )}

          {doc.received_by?.organization && (
            <div>
              <span className="text-[var(--muted)] uppercase tracking-wider font-semibold text-[10px]">Received by</span>
              <div className="mt-0.5 text-slate-700 font-medium">
                {doc.received_by.organization}
                {doc.received_by.person && <span className="text-slate-400 font-normal"> · {doc.received_by.person}</span>}
              </div>
              {doc.received_by.date_received && <div className="text-slate-400 font-mono">{doc.received_by.date_received}</div>}
            </div>
          )}

          {isComplete && doc.acceptance?.accepted_by && (
            <div>
              <span className="text-[var(--muted)] uppercase tracking-wider font-semibold text-[10px]">
                {doc.status === "accepted" ? "Accepted by" : "Rejected by"}
              </span>
              <div className="mt-0.5 text-slate-700 font-medium">
                {doc.acceptance.accepted_by}
                {doc.acceptance.accepted_date && (
                  <span className="text-slate-400 font-mono font-normal"> · {doc.acceptance.accepted_date}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {doc.acceptance?.notes && (
          <p className="text-xs text-[var(--muted)] italic border-l-2 border-[var(--border)] pl-3">
            {doc.acceptance.notes}
          </p>
        )}

        {doc.custody_chain && doc.custody_chain.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold mb-2">Custody chain</div>
            <ol className="relative border-l border-slate-200 ml-1 space-y-3">
              {doc.custody_chain.map((ev, i) => (
                <CustodyEventRow key={i} event={ev} last={i === doc.custody_chain!.length - 1} />
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function CustodyEventRow({ event, last }: { event: CustodyEvent; last: boolean }) {
  const dotColor =
    event.event === "accepted" ? "bg-emerald-500" :
    event.event === "rejected" ? "bg-red-500" :
    event.event === "received" ? "bg-blue-500" :
    event.event === "under-review" || event.event === "reviewed" ? "bg-amber-500" : "bg-slate-300";

  return (
    <li className="ml-4">
      <span className={`absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full border-2 border-white ${dotColor}`} />
      <div className="text-xs text-slate-700">
        <span className={`font-semibold capitalize ${last ? "text-slate-900" : ""}`}>
          {event.event.replace(/-/g, " ")}
        </span>
        {event.date && <span className="ml-2 font-mono text-slate-400">{event.date}</span>}
        {event.actor && <span className="ml-2 text-slate-400">{event.actor}</span>}
        {event.notes && <div className="mt-0.5 text-slate-500 leading-snug">{event.notes}</div>}
      </div>
    </li>
  );
}
