import Link from 'next/link';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import FundingAcknowledgment from '../components/FundingAcknowledgment';

interface DocEntry {
  slug: string;
  title: string;
  description?: string;
  visibility: 'team' | 'consortium' | 'public';
  surfaces: string[];
}

interface Props {
  docs: DocEntry[];
  projectName: string;
  oneLiner: string;
}

export async function getStaticProps() {
  // Read documents/index.yaml from the project state to build navigation.
  // This is read at build time; project-website-publisher.regenerate writes the
  // current index alongside the website source so the build can read it.
  const indexPath = path.join(process.cwd(), 'content', '_index.yaml');
  let docs: DocEntry[] = [];
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    const parsed = yaml.load(raw) as { docs?: DocEntry[] };
    docs = (parsed.docs ?? []).filter(d => d.surfaces?.includes('website'));
  }

  return {
    props: {
      docs,
      projectName: process.env.NEXT_PUBLIC_PROJECT_NAME ?? 'Project',
      oneLiner: process.env.NEXT_PUBLIC_PROJECT_ONELINER ?? ''
    }
  };
}

export default function Home({ docs, projectName, oneLiner }: Props) {
  const grouped = {
    team: docs.filter(d => d.visibility === 'team'),
    consortium: docs.filter(d => d.visibility === 'consortium'),
    public: docs.filter(d => d.visibility === 'public')
  };

  return (
    <>
      <Head>
        <title>{projectName}</title>
        <meta name="description" content={oneLiner} />
      </Head>
      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px', lineHeight: 1.6 }}>
        <h1>{projectName}</h1>
        {oneLiner && <p style={{ color: '#444', fontSize: 18 }}>{oneLiner}</p>}

        {grouped.public.length > 0 && (
          <Section title="Public" docs={grouped.public} />
        )}
        {grouped.consortium.length > 0 && (
          <Section title="Consortium" docs={grouped.consortium} />
        )}
        {grouped.team.length > 0 && (
          <Section title="Team-internal" docs={grouped.team} />
        )}

        <hr style={{ margin: '40px 0', border: 0, borderTop: '1px solid #eee' }} />
        <FundingAcknowledgment />
      </main>
    </>
  );
}

function Section({ title, docs }: { title: string; docs: DocEntry[] }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: 8 }}>{title}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {docs.map(doc => (
          <li key={doc.slug} style={{ padding: '8px 0' }}>
            <Link href={`/docs/${doc.slug}/`} style={{ fontWeight: 500 }}>
              {doc.title}
            </Link>
            {doc.description && (
              <div style={{ color: '#666', fontSize: 14, marginTop: 2 }}>{doc.description}</div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
