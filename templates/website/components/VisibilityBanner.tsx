// Visibility banner — rendered above doc content based on the doc's visibility tier.
// project-website-publisher.regenerate writes the visibility into the page's MDX frontmatter.

type Visibility = 'team' | 'consortium' | 'public';

interface Props {
  visibility: Visibility;
  consortiumName?: string;
}

export default function VisibilityBanner({ visibility, consortiumName = 'the consortium' }: Props) {
  if (visibility === 'public') return null;

  const isTeam = visibility === 'team';
  const bg = isTeam ? '#fff8e1' : '#f3f6fb';
  const border = isTeam ? '#f0c04a' : '#9bb6db';
  const text = isTeam ? '#6b4c00' : '#21456f';

  const message = isTeam
    ? `Internal — ${consortiumName} only — do not redistribute.`
    : `Consortium-confidential. Audience: ${consortiumName} + immediate stakeholders.`;

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        padding: '8px 12px',
        marginBottom: '16px',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: 500
      }}
      role="note"
    >
      {message}
    </div>
  );
}
