import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getReportDocBySlug,
  listReportDocs,
  renderDocxToHtml,
  renderXlsxToSheets,
} from "@/lib/documents";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const docs = await listReportDocs();
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(props: PageProps<"/reporting/[slug]">) {
  const { slug } = await props.params;
  const doc = await getReportDocBySlug(slug);
  return { title: doc ? doc.title : "Document" };
}

export default async function ReportDocPage(props: PageProps<"/reporting/[slug]">) {
  const { slug } = await props.params;
  const doc = await getReportDocBySlug(slug);
  if (!doc) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/reporting" className="text-xs text-[var(--accent)] hover:underline">
            ← Reporting
          </Link>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-[var(--accent)]">
            {doc.title}
          </h1>
          <div className="mt-1 text-xs text-[var(--muted)] font-mono">
            {doc.file} · {doc.sizeKb} KB
          </div>
        </div>
        <a
          href={`/api/reporting/${doc.slug}/download`}
          className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-md hover:opacity-90"
        >
          Download original .{doc.ext}
        </a>
      </div>

      {doc.ext === "docx" ? (
        <DocxView file={doc.file} />
      ) : (
        <XlsxView file={doc.file} />
      )}
    </div>
  );
}

async function DocxView({ file }: { file: string }) {
  const html = await renderDocxToHtml(file);
  return (
    <article className="bg-white border border-[var(--border)] rounded-lg p-8 md:p-12">
      <div className="prose-doc" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

async function XlsxView({ file }: { file: string }) {
  const sheets = await renderXlsxToSheets(file);
  return (
    <div className="space-y-6">
      {sheets.map((s) => (
        <section key={s.name} className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <header className="px-5 py-3 bg-slate-50 border-b border-[var(--border)]">
            <h3 className="font-semibold text-slate-800 text-sm">{s.name}</h3>
            <p className="text-xs text-[var(--muted)]">{s.rows.length} rows</p>
          </header>
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="sheet-table">
              <thead>
                <tr>
                  {(s.rows[0] || []).map((c, i) => (
                    <th key={i}>{cellStr(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((c, j) => (
                      <td key={j}>{cellStr(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  return String(v);
}
