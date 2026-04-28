import Link from 'next/link';
import { useRouter } from 'next/router';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/milestones/', label: 'Milestones' },
  { href: '/risks/', label: 'Risks' },
  { href: '/reports/', label: 'Reports' },
  { href: '/blog/', label: 'Blog' },
  { href: '/wiki/', label: 'Wiki' },
  { href: '/docs/', label: 'Docs' },
  { href: '/about/', label: 'About' },
];

export default function Nav() {
  const router = useRouter();

  function isActive(href: string) {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href.replace(/\/$/, ''));
  }

  return (
    <header style={{
      borderBottom: '1px solid #e5e5e5',
      background: '#fafafa',
      padding: '0 20px',
    }}>
      <nav style={{
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        height: 52,
        flexWrap: 'wrap',
      }}>
        <Link
          href="/"
          style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
            fontWeight: 700,
            fontSize: 16,
            color: '#1a1a1a',
            textDecoration: 'none',
            marginRight: 32,
          }}
        >
          project-state
        </Link>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 14,
                color: isActive(link.href) ? '#1a1a1a' : '#666',
                background: isActive(link.href) ? '#e8e8e8' : 'transparent',
                fontWeight: isActive(link.href) ? 600 : 400,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
