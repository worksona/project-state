import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { REPORTS_DIR } from "./paths";

export type ReportDoc = {
  file: string;
  slug: string;
  title: string;
  ext: "docx" | "xlsx";
  sizeKb: number;
};

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.(docx|xlsx)$/i, "")
    .replace(/^(\d+)[-_]/, "$1 — ")
    .replace(/[-_]/g, " ")
    .replace(/\bv(\d)/g, "v$1");
}

function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.(docx|xlsx)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listReportDocs(): Promise<ReportDoc[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(REPORTS_DIR);
  } catch {
    return [];
  }
  const docs: ReportDoc[] = [];
  for (const f of entries) {
    if (f.startsWith("~$")) continue;
    const ext = f.toLowerCase().endsWith(".docx")
      ? "docx"
      : f.toLowerCase().endsWith(".xlsx")
        ? "xlsx"
        : null;
    if (!ext) continue;
    const stat = await fs.stat(path.join(REPORTS_DIR, f));
    docs.push({
      file: f,
      slug: slugFromFilename(f),
      title: titleFromFilename(f),
      ext,
      sizeKb: Math.round(stat.size / 1024),
    });
  }
  return docs.sort((a, b) => a.file.localeCompare(b.file));
}

export async function getReportDocBySlug(
  slug: string,
): Promise<ReportDoc | null> {
  const docs = await listReportDocs();
  return docs.find((d) => d.slug === slug) ?? null;
}

export async function renderDocxToHtml(file: string): Promise<string> {
  const full = path.join(REPORTS_DIR, file);
  const buf = await fs.readFile(full);
  const result = await mammoth.convertToHtml(
    { buffer: buf },
    {
      styleMap: [
        "p[style-name='Title'] => h1.doc-title:fresh",
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh",
        "p[style-name='Heading 3'] => h4:fresh",
      ],
    },
  );
  return result.value;
}

export type SheetData = {
  name: string;
  rows: (string | number | null)[][];
};

export async function renderXlsxToSheets(file: string): Promise<SheetData[]> {
  const full = path.join(REPORTS_DIR, file);
  const buf = await fs.readFile(full);
  const wb = XLSX.read(buf, { type: "buffer" });
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });
    return { name, rows };
  });
}
