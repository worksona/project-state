import fs from "node:fs/promises";
import path from "node:path";
import { STATE_DIR } from "@/lib/paths";
import Markdown from "@/components/markdown";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Context" };

async function readContextMd(): Promise<string | null> {
  const candidates = [
    path.join(STATE_DIR, "references", "context.md"),
    path.join(STATE_DIR, "context.md"),
  ];
  for (const p of candidates) {
    try {
      return await fs.readFile(p, "utf8");
    } catch {
      // try next
    }
  }
  return null;
}

export default async function ContextPage() {
  const content = await readContextMd();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Project Context"
        title="Context"
        description="Background, collaboration model, technical rationale, and working agreements — everything a new or returning team member needs to understand how this project works and why."
        meta={
          <>
            Source: <code>.project-state/references/context.md</code>. Edit this file
            to update the context; changes appear within 5 minutes.
          </>
        }
      />

      {content ? (
        <div className="prose-doc bg-white border border-[var(--border)] rounded-lg p-8 md:p-12 max-w-3xl">
          <Markdown>{content}</Markdown>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center max-w-3xl">
          <p className="text-slate-600">No context document yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create <code>.project-state/references/context.md</code> to populate this page.
            This is a great place to describe the collaboration model, technical approach,
            working agreements, and anything else that helps team members understand the project.
          </p>
        </div>
      )}
    </div>
  );
}
