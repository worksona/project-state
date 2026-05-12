import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { REPORTS_DIR } from "@/lib/paths";
import { getReportDocBySlug } from "@/lib/documents";

export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const doc = await getReportDocBySlug(slug);
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const buf = await fs.readFile(path.join(REPORTS_DIR, doc.file));
  const mime =
    doc.ext === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${doc.file}"`,
    },
  });
}
