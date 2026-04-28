import Link from 'next/link';
import Layout from '../../components/Layout';
import { getWikiPages, getWikiPage, type WikiPage } from '../../lib/scsiwyg';

interface Props {
  page: WikiPage | null;
}

export async function getStaticPaths() {
  try {
    const pages = await getWikiPages();
    return {
      paths: pages.map(p => ({ params: { slug: p.slug } })),
      fallback: 'blocking',
    };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  try {
    const page = await getWikiPage(params.slug);
    if (!page) return { notFound: true, revalidate: 300 };
    return { props: { page }, revalidate: 300 };
  } catch {
    return { notFound: true, revalidate: 300 };
  }
}

export default function WikiPageView({ page }: Props) {
  if (!page) {
    return (
      <Layout title="Page not found">
        <p>This wiki page could not be found.</p>
        <Link href="/wiki/">Back to wiki</Link>
      </Layout>
    );
  }

  return (
    <Layout title={page.title}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/wiki/" style={{ fontSize: 14, color: '#666' }}>
          &larr; Wiki
        </Link>
      </div>

      <article>
        <h1 style={{ margin: '0 0 8px 0' }}>{page.title}</h1>

        {page.confidence && (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            Confidence: <strong>{page.confidence}</strong>
          </div>
        )}

        {page.html ? (
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        ) : page.body ? (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{page.body}</div>
        ) : (
          <p style={{ color: '#888' }}>No content available.</p>
        )}

        {page.sources && page.sources.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16 }}>Sources</h2>
            <ul>
              {page.sources.map((s, i) => (
                <li key={i} style={{ fontSize: 14 }}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {page.seeAlso && page.seeAlso.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16 }}>See also</h2>
            <ul>
              {page.seeAlso.map((s, i) => (
                <li key={i}>
                  <Link href={`/wiki/${s}/`} style={{ fontSize: 14 }}>{s}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </Layout>
  );
}
