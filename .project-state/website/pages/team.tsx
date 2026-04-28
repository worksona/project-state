import Layout from '../components/Layout';
import { getPeople, type Person } from '../lib/state';

interface Props {
  people: Person[];
}

export async function getStaticProps() {
  return { props: { people: getPeople() } };
}

export default function TeamPage({ people }: Props) {
  return (
    <Layout title="Team" description="Project team members">
      <h1 style={{ margin: '0 0 8px 0' }}>Team</h1>
      <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 14 }}>
        {people.length} {people.length === 1 ? 'member' : 'members'}
      </p>

      {people.length === 0 ? (
        <p style={{ color: '#888' }}>No team members listed yet.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {people.map(person => (
            <div
              key={person.id}
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                padding: '20px',
                background: '#fff',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: '#e8e8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: '#888',
                marginBottom: 12,
              }}>
                {person.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{person.full_name}</h3>
              {person.title && (
                <div style={{ fontSize: 14, color: '#555' }}>{person.title}</div>
              )}
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
                {person.organization}
              </div>
              <div style={{
                fontSize: 13,
                color: '#0969da',
                background: '#ddf4ff',
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 12,
                marginTop: 8,
              }}>
                {person.role_on_project}
              </div>
              {person.email && (
                <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                  <a href={`mailto:${person.email}`} style={{ color: '#666' }}>{person.email}</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
