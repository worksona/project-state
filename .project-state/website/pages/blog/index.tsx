import Link from 'next/link';
import Layout from '../../components/Layout';
import { getBlogPosts, type BlogPost } from '../../lib/scsiwyg';

const HERO_IMAGE = 'https://gwz1luetos5gdmyh.public.blob.vercel-storage.com/images/f1994352-403c-4f17-bd37-98c584c52179/generated-l41usmb9-hero-blog-listing-UHLCvwuZJDBPPsLnZgEhxQo8zEk1qi.png';

interface Props {
  posts: BlogPost[];
  error: boolean;
}

export async function getStaticProps() {
  try {
    const posts = await getBlogPosts();
    return {
      props: { posts, error: false },
      revalidate: 300,
    };
  } catch {
    return {
      props: { posts: [], error: true },
      revalidate: 300,
    };
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlogIndex({ posts, error }: Props) {
  const featured = posts.length > 0 ? posts[0] : null;
  const rest = posts.slice(1);

  return (
    <Layout title="Blog" description="Project blog posts">
      {/* Hero */}
      <div style={{
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 32,
        position: 'relative',
      }}>
        <img
          src={HERO_IMAGE}
          alt="project-state blog"
          style={{
            width: '100%',
            height: 240,
            objectFit: 'cover',
            display: 'block',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 24px 20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 28 }}>Blog</h1>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Updates, recipes, and thinking from the{' '}
            <a
              href="https://www.scsiwyg.com/project-state"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              project-state
            </a>{' '}
            blog
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fff8c5',
          border: '1px solid #d4a72c',
          borderRadius: 6,
          fontSize: 14,
          color: '#6b4c00',
          marginBottom: 16,
        }}>
          Unable to load blog posts. The scsiwyg API may be temporarily unavailable.
        </div>
      )}

      {!error && posts.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#888',
          background: '#fafafa',
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 16, margin: 0 }}>No blog posts yet.</p>
          <p style={{ fontSize: 14, margin: '8px 0 0 0' }}>
            Posts will appear here as they are published.
          </p>
        </div>
      )}

      {/* Featured post (latest) */}
      {featured && (
        <Link
          href={`/blog/${featured.slug}/`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 24 }}
        >
          <article style={{
            border: '1px solid #e5e5e5',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#fff',
            transition: 'box-shadow 0.15s',
          }}>
            {featured.coverImage && (
              <img
                src={featured.coverImage}
                alt={featured.title}
                style={{
                  width: '100%',
                  height: 280,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#888', letterSpacing: 1, marginBottom: 4 }}>
                Latest
              </div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: 22 }}>{featured.title}</h2>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                {formatDate(featured.publishedAt)}
                {featured.tags && featured.tags.length > 0 && (
                  <span style={{ marginLeft: 12 }}>
                    {featured.tags.map(t => (
                      <span key={t} style={{
                        marginLeft: 4,
                        padding: '1px 8px',
                        background: '#f0f0f0',
                        borderRadius: 4,
                        fontSize: 12,
                      }}>
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {featured.excerpt && (
                <p style={{ margin: 0, color: '#555', fontSize: 15, lineHeight: 1.5 }}>{featured.excerpt}</p>
              )}
            </div>
          </article>
        </Link>
      )}

      {/* Rest of posts in a grid */}
      {rest.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {rest.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article style={{
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.15s',
              }}>
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16, lineHeight: 1.3 }}>{post.title}</h3>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                    {formatDate(post.publishedAt)}
                  </div>
                  {post.excerpt && (
                    <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.5, flex: 1 }}>
                      {post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + '...' : post.excerpt}
                    </p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {post.tags.slice(0, 3).map(t => (
                        <span key={t} style={{
                          marginRight: 4,
                          padding: '1px 6px',
                          background: '#f0f0f0',
                          borderRadius: 4,
                          fontSize: 11,
                          color: '#888',
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
