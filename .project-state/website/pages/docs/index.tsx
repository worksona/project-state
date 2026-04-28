import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Layout from '../../components/Layout';

interface DocEntry {
  slug: string;
  title: string;
  description?: string;
  visibility: 'team' | 'consortium' | 'public';
  surfaces: string[];
}

interface Props {
  docs: DocEntry[];
}

export async function getStaticProps() {
  const indexPath = path.join(process.cwd(), 'content', '_index.yaml');
  let docs: DocEntry[] = [];
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    const parsed = yaml.load(raw) as { docs?: DocEntry[] };
    docs = (parsed.docs ?? []).filter(d => d.surfaces?.includes('website'));
  }
  return { props: { docs } };
}

function visibilityColor(v: string): { bg: string; color: string } {
  switch (v) {
    case 'public': return { bg: '#dafbe1', color: '#1a7f37' };
    case 'consortium': return { bg: '#ddf4ff', color: '#0969da' };
    case 'team': return { bg: '#fff8c5', color: '#9a6700' };
    default: return { bg: '#f0f0f0', color: '#656d76' };
  }
}

export default function DocsIndex({ docs }: Props) {
  const grouped = {
    public: docs.filter(d => d.visibility === 'public'),
    consortium: docs.filter(d => d.visibility === 'consortium'),
    team: docs.filter(d => d.visibility === 'team'),
  };

  return (
    <Layout title="Documentation" description="Project reference documentation">
      <h1 style={{ margin: '0 0 8px 0' }}>Documentation</h1>
      <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 14 }}>
        {docs.length} reference documents published from .project-state/
      </p>

      {(['public', 'consortium', 'team'] as const).map(tier => {
        const tierDocs = grouped[tier];
        if (tierDocs.length === 0) return null;
        const vc = visibilityColor(tier);
        return (
          <section key={tier} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 16,
              borderBottom: '1px solid #eee',
              paddingBottom: 8,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
              <span style={{
                fontSize: 12,
                padding: '1px 8px',
                borderRadius: 4,
                background: vc.bg,
                color: vc.color,
                fontWeight: 500,
              }}>
                {tierDocs.length}
              </span>
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tierDocs.map(doc => (
                <li key={doc.slug} style={{ padding: '8px 0' }}>
                  <Link href={`/docs/${doc.slug}/`} style={{ fontWeight: 500, fontSize: 15 }}>
                    {doc.title}
                  </Link>
                  {doc.description && (
                    <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
                      {doc.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Layout>
  );
}
