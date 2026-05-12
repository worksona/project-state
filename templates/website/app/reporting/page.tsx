import Link from "next/link";
import { listReportDocs } from "@/lib/documents";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Reporting" };

export default async function ReportingPage() {
  const docs = await listReportDocs();
  const docxDocs = docs.filter((d) => d.ext === "docx");
  const xlsxDocs = docs.filter((d) => d.ext === "xlsx");

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Documents"
        title="Reporting"
        description={`Every formal document the project has produced — currently ${docs.length} ${docs.length === 1 ? "document" : "documents"}. As the project progresses this section grows to include weekly reports, review meeting packs, quarterly claim packages, and final reports.`}
        meta={
          <>
            Documents are rendered inline (text and tables fully searchable);
            originals stay available for download. Source folder: <code>reports/</code>.
          </>
        }
      />

      {docs.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
          <p className="text-slate-600">No documents yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Drop <code>.docx</code> or <code>.xlsx</code> files into the <code>reports/</code> folder adjacent to the site.
          </p>
        </div>
      ) : (
        <>
          {docxDocs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Documents ({docxDocs.length})
              </h2>
              <ul className="bg-white border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                {docxDocs.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/reporting/${d.slug}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{d.title}</div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{d.file}</div>
                      </div>
                      <div className="text-xs text-[var(--muted)] flex items-center gap-3">
                        <span>{d.sizeKb} KB</span>
                        <span className="text-[var(--accent)]">View →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {xlsxDocs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Workbooks ({xlsxDocs.length})
              </h2>
              <ul className="bg-white border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                {xlsxDocs.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/reporting/${d.slug}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{d.title}</div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{d.file}</div>
                      </div>
                      <div className="text-xs text-[var(--muted)] flex items-center gap-3">
                        <span>{d.sizeKb} KB</span>
                        <span className="text-[var(--accent)]">View →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
