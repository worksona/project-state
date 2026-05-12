import Link from "next/link";
import Image from "next/image";
import { listPosts } from "@/lib/scsiwyg";
import { SCSIWYG_API, SCSIWYG_USER } from "@/lib/paths";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Blog" };

function excerptFromBody(body: string | undefined, max = 220): string {
  if (!body) return "";
  let s = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, " — ")
    .replace(/\n/g, " ")
    .trim();
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, "") + "…";
  return s;
}

export default async function BlogIndex() {
  const posts = await listPosts();
  const siteUrl = SCSIWYG_USER ? `${SCSIWYG_API}/${SCSIWYG_USER}` : null;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Updates"
        title="Blog"
        description="The project's narrative thread — weekly updates, technical writeups, milestone-completion announcements, and decisions explained at length. If structured state on the dashboard tells you the what, the blog tells you the why and how."
        meta={
          siteUrl ? (
            <>
              Published via scsiwyg ·{" "}
              <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                {siteUrl.replace("https://", "")}
              </a>
              . New posts go live within 5 minutes.
            </>
          ) : undefined
        }
      />

      {posts.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
          <p className="text-slate-600">No posts yet.</p>
          {!SCSIWYG_USER && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Set <code>NEXT_PUBLIC_SCSIWYG_SITE</code> in your environment to connect a scsiwyg site.
            </p>
          )}
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {posts.map((p) => {
            const excerpt = p.excerpt || excerptFromBody(p.body);
            return (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--accent)]/30 transition"
                >
                  {p.coverImage ? (
                    <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                      <Image
                        src={p.coverImage}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-[1.02] transition"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 flex items-center justify-center">
                      <span className="text-xs uppercase tracking-widest text-slate-400">Project</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">
                      {p.publishedAt?.slice(0, 10) || p.createdAt?.slice(0, 10)}
                      {p.tags?.length ? <> · {p.tags.join(", ")}</> : null}
                    </div>
                    <h2 className="mt-1.5 text-lg font-semibold text-slate-900 leading-snug group-hover:text-[var(--accent)] transition">
                      {p.title}
                    </h2>
                    {excerpt && (
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">{excerpt}</p>
                    )}
                    <div className="mt-3 text-xs font-semibold text-[var(--accent)]">Read →</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
