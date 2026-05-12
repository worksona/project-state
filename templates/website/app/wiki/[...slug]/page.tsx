import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/markdown";
import { flattenTree, getWikiPage, getWikiTree } from "@/lib/scsiwyg";
import { WikiSidebar } from "../page";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const tree = await getWikiTree();
  return flattenTree(tree).map((n) => ({ slug: [n.slug] }));
}

export async function generateMetadata(props: PageProps<"/wiki/[...slug]">) {
  const { slug } = await props.params;
  const joined = slug.join("/");
  const page = await getWikiPage(joined);
  return { title: page ? `${page.title} — Wiki` : "Wiki" };
}

export default async function WikiPage(props: PageProps<"/wiki/[...slug]">) {
  const [{ slug }, tree] = await Promise.all([props.params, getWikiTree()]);
  const joined = slug.join("/");
  const page = await getWikiPage(joined);
  if (!page) notFound();

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      <WikiSidebar tree={tree} />
      <article className="max-w-3xl space-y-6">
        <Link href="/wiki" className="text-xs text-[var(--accent)] hover:underline">
          ← Wiki
        </Link>
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--accent)]">
            {page.title}
          </h1>
        </header>
        <div className="prose-doc bg-white border border-[var(--border)] rounded-lg p-8 md:p-12">
          <Markdown>{page.body || ""}</Markdown>
        </div>
      </article>
    </div>
  );
}
