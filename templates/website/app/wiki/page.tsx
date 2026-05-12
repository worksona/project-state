import Link from "next/link";
import { flattenTree, getWikiTree, type ScsiwygWikiNode } from "@/lib/scsiwyg";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Wiki" };

export default async function WikiIndex() {
  const tree = await getWikiTree();
  const flat = flattenTree(tree);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      <WikiSidebar tree={tree} />
      <div className="space-y-6">
        <PageHeader
          kicker="Reference"
          title="Project Wiki"
          description="Long-lived knowledge — anything that should outlive a single update or post. Architecture rationale, glossaries, runbooks, vendor evaluations. The blog is for moments in time; the wiki is for things still true a year from now."
          meta={
            <>
              {flat.length} {flat.length === 1 ? "page" : "pages"} · authored via scsiwyg ·{" "}
              new pages live in ≤5 min.
            </>
          }
        />

        {flat.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
            <p className="text-slate-600">No wiki pages yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {flat.map((node) => (
              <li key={node.slug} className="bg-white border border-[var(--border)] rounded p-3">
                <Link href={`/wiki/${node.slug}`} className="text-[var(--accent)] hover:underline font-medium">
                  {node.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function WikiSidebar({ tree }: { tree: ScsiwygWikiNode[] }) {
  if (tree.length === 0) return <aside />;
  return (
    <aside className="text-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Wiki tree</div>
      <WikiNodeList nodes={tree} />
    </aside>
  );
}

function WikiNodeList({ nodes }: { nodes: ScsiwygWikiNode[] }) {
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.slug}>
          <Link href={`/wiki/${n.slug}`} className="block px-2 py-1 rounded text-slate-700 hover:bg-slate-100 hover:text-[var(--accent)]">
            {n.title}
          </Link>
          {n.children?.length ? (
            <div className="ml-3 border-l border-[var(--border)] pl-2 mt-1">
              <WikiNodeList nodes={n.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
