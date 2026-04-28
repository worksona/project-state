import Head from 'next/head';
import Nav from './Nav';
import VisibilityBanner from './VisibilityBanner';
import FundingAcknowledgment from './FundingAcknowledgment';

type Visibility = 'team' | 'consortium' | 'public';

interface Props {
  title: string;
  description?: string;
  visibility: Visibility;
  lastModified?: string;
  consortiumName?: string;
  children: React.ReactNode;
}

export default function DocLayout({
  title,
  description,
  visibility,
  lastModified,
  consortiumName,
  children
}: Props) {
  const noindex = visibility !== 'public';
  const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME ?? 'project-state';

  return (
    <>
      <Head>
        <title>{title} - {projectName}</title>
        {description && <meta name="description" content={description} />}
        {noindex && <meta name="robots" content="noindex, nofollow" />}
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 20px', flex: 1, lineHeight: 1.6 }}>
          <VisibilityBanner visibility={visibility} consortiumName={consortiumName} />
          <article>
            <h1 style={{ marginBottom: 4 }}>{title}</h1>
            {lastModified && (
              <div style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
                Last updated: {lastModified}
              </div>
            )}
            {children}
          </article>
          <hr style={{ margin: '40px 0', border: 0, borderTop: '1px solid #eee' }} />
          <FundingAcknowledgment />
        </main>
        <footer style={{
          borderTop: '1px solid #e5e5e5',
          padding: '20px',
          textAlign: 'center',
          color: '#888',
          fontSize: 13
        }}>
          Built by{' '}
          <a href="https://www.worksona.com" style={{ color: '#888' }}>Worksona</a>
          {' / '}
          <a href="https://www.atomic47.co" style={{ color: '#888' }}>Atomic47 Labs</a>
        </footer>
      </div>
    </>
  );
}
