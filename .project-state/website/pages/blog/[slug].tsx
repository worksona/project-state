import Link from 'next/link';
import Layout from '../../components/Layout';
import { getBlogPosts, getBlogPost, type BlogPost } from '../../lib/scsiwyg';

interface Props {
  post: BlogPost | null;
}

export async function getStaticPaths() {
  try {
    const posts = await getBlogPosts();
    return {
      paths: posts.map(p => ({ params: { slug: p.slug } })),
      fallback: 'blocking',
    };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  try {
    const post = await getBlogPost(params.slug);
    if (!post) return { notFound: true, revalidate: 300 };
    return { props: { post }, revalidate: 300 };
  } catch {
    return { notFound: true, revalidate: 300 };
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlogPostPage({ post }: Props) {
  if (!post) {
    return (
      <Layout title="Post not found">
        <p>This blog post could not be found.</p>
        <Link href="/blog/">Back to blog</Link>
      </Layout>
    );
  }

  return (
    <Layout title={post.title}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/blog/" style={{ fontSize: 14, color: '#666' }}>
          &larr; All posts
        </Link>
      </div>

      <article>
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            style={{
              width: '100%',
              height: 320,
              objectFit: 'cover',
              borderRadius: 10,
              display: 'block',
              marginBottom: 24,
            }}
          />
        )}

        <h1 style={{ margin: '0 0 8px 0' }}>{post.title}</h1>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
          {formatDate(post.publishedAt)}
          {post.tags && post.tags.length > 0 && (
            <span style={{ marginLeft: 12 }}>
              {post.tags.map(t => (
                <span
                  key={t}
                  style={{
                    marginLeft: 4,
                    padding: '1px 8px',
                    background: '#f0f0f0',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>

        {post.html ? (
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        ) : post.body ? (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.body}</div>
        ) : (
          <p style={{ color: '#888' }}>No content available.</p>
        )}
      </article>
    </Layout>
  );
}
