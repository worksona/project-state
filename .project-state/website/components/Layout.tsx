import Head from 'next/head';
import Nav from './Nav';

interface Props {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export default function Layout({ title, description, children }: Props) {
  const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME ?? 'project-state';
  const pageTitle = title ? `${title} - ${projectName}` : projectName;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          padding: '32px 20px',
          flex: 1,
          lineHeight: 1.6
        }}>
          {children}
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
