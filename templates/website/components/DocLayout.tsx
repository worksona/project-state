import Head from 'next/head';
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

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {noindex && <meta name="robots" content="noindex, nofollow" />}
      </Head>
      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px', lineHeight: 1.6 }}>
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
    </>
  );
}
