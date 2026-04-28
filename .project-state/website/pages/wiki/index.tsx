import Link from 'next/link';
import Layout from '../../components/Layout';
import { getWikiPages, type WikiPage } from '../../lib/scsiwyg';

interface Props {
  pages: WikiPage[];
  error: boolean;
}

export async function getStaticProps() {
  try {
    const pages = await getWikiPages();
    return {
      props: { pages, error: false },
      revalidate: 300,
    };
  } catch {
    return {
      props: { pages: [], error: true },
      revalidate: 300,
    };
  }
}

export default function WikiIndex({ pages, error }: Props) {
  return (
    <Layout title="Wiki" description="Project wiki">
      <h1 style={{ margin: '0 0 8px 0' }}>Wiki</h1>
      <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 14 }}>
        Knowledge base hosted on{' '}
        <a href="https://www.scsiwyg.com/project-state" target="_blank" rel="noopener noreferrer">
          scsiwyg
        </a>
      </p>

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
          Unable to load wiki pages. The scsiwyg API may be temporarily unavailable.
        </div>
      )}

      {!error && pages.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#888',
          background: '#fafafa',
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 16, margin: 0 }}>Wiki pages will appear here as they are created.</p>
        </div>
      )}

      {pages.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {pages.map(page => (
            <li key={page.slug} style={{ marginBottom: 4 }}>
              <Link
                href={`/wiki/${page.slug}/`}
                style={{ padding: '6px 0', display: 'block', fontSize: 15 }}
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
