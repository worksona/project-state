import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Markdown from "@/components/markdown";
import { getPost, listPosts } from "@/lib/scsiwyg";
import { SCSIWYG_API, SCSIWYG_USER } from "@/lib/paths";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  return {
    title: post ? `${post.title}` : "Post",
    description: post?.excerpt,
  };
}

export default async function BlogPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const sourceUrl = SCSIWYG_USER
    ? `${SCSIWYG_API}/${SCSIWYG_USER}/${post.slug}`
    : null;

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <Link href="/blog" className="text-xs text-[var(--accent)] hover:underline">
        ← Blog
      </Link>
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
          {post.publishedAt?.slice(0, 10) || post.createdAt?.slice(0, 10)}
          {post.tags?.length ? <> · {post.tags.join(", ")}</> : null}
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-[var(--accent)]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">{post.excerpt}</p>
        )}
      </header>
      {post.coverImage && (
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm bg-slate-100">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}
      <div className="prose-doc bg-white border border-[var(--border)] rounded-lg p-8 md:p-12">
        <Markdown>{post.body || ""}</Markdown>
      </div>
      {sourceUrl && (
        <p className="text-xs text-[var(--muted)]">
          Originally published at{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            {sourceUrl.replace("https://", "")}
          </a>
        </p>
      )}
    </article>
  );
}
