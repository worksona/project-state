// All pages in this app read from .project-state/ at runtime.
// Disable build-time prerendering — pages are rendered on demand (ISR revalidate=300).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import NavDropdown from "@/components/nav-dropdown";
import MobileNav from "@/components/mobile-nav";
import TimelineBar from "@/components/timeline-bar";
import { getManifest } from "@/lib/state";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const manifest = await getManifest();
    return {
      title: manifest.project.short_name,
      description: manifest.project.one_liner,
    };
  } catch {
    return {
      title: "Project Site",
      description: "Internal project site powered by project-state.",
    };
  }
}

const PRIMARY_NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/blog", label: "Blog" },
  { href: "/milestones", label: "Milestones" },
  { href: "/people", label: "Team" },
  { href: "/context", label: "Context" },
  { href: "/wiki", label: "Wiki" },
];

const PROGRESS_ITEMS = [
  {
    href: "/reporting",
    label: "Reporting",
    description: "Baseline documents, weekly reports, SC packs, claim packages.",
  },
  {
    href: "/calendar",
    label: "Calendar",
    description: "Recurring cadence, review meetings, key deadlines.",
  },
  {
    href: "/decisions",
    label: "Decisions",
    description: "Formal decisions log — context, rationale, consequences.",
  },
  {
    href: "/risks",
    label: "Risks",
    description: "Risk register with severity, owners, mitigation, contingency.",
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Chain-of-custody tracking for delivered data, agreements, and approvals.",
  },
];

const ABOUT_ITEMS = [
  {
    href: "/about/this-site",
    label: "This Site",
    description: "What's here, who it's for, and how it's structured.",
  },
  {
    href: "/about/how-it-updates",
    label: "How It Updates",
    description: "When and how new content lands across each surface.",
  },
  {
    href: "/about/agentic-state-system",
    label: "Agentic State System",
    description: "The skill-driven project-state engine that powers it.",
  },
  {
    href: "/about/the-project",
    label: "The Project",
    description: "Scope, consortium, funding, and technical concept.",
  },
];

const EMPTY_MANIFEST = {
  project: { short_name: "Project Site", long_name: "Project Site", one_liner: "" },
  dates: { project_start: "2024-01-01", project_end: "2025-12-31" },
  stakeholders: { organizations: [] },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let manifest: Awaited<ReturnType<typeof getManifest>>;
  try {
    manifest = await getManifest();
  } catch {
    manifest = EMPTY_MANIFEST as any;
  }
  const orgs = manifest.stakeholders?.organizations ?? [];
  const subtitle = orgs.map((o) => o.short_code || o.name).join(" × ");

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-[var(--border)] bg-white/85 backdrop-blur sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
            <Link href="/" className="flex items-baseline gap-3">
              <span className="font-semibold tracking-tight text-[var(--accent)] text-lg">
                {manifest.project.short_name}
              </span>
              {subtitle && (
                <span className="hidden sm:inline text-xs text-[var(--muted)] uppercase tracking-wider">
                  {subtitle}
                  {manifest.project.program ? ` · ${manifest.project.program}` : ""}
                </span>
              )}
            </Link>
            <nav className="hidden lg:flex items-center gap-1 ml-auto text-sm">
              {PRIMARY_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-[var(--accent)] transition"
                >
                  {n.label}
                </Link>
              ))}
              <NavDropdown label="Progress" items={PROGRESS_ITEMS} />
              <NavDropdown label="About" items={ABOUT_ITEMS} />
            </nav>
            <MobileNav
              primary={PRIMARY_NAV}
              progress={PROGRESS_ITEMS}
              about={ABOUT_ITEMS}
            />
          </div>
          <TimelineBar
            start={manifest.dates.project_start as string}
            end={manifest.dates.project_end as string}
          />
        </header>
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-6 py-10">{children}</div>
        </main>
        <footer className="border-t border-[var(--border)] mt-16 py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-xs text-[var(--muted)] flex flex-wrap gap-4 justify-between">
            <span>
              {manifest.project.short_name} — Internal team site
              {manifest.project.funder
                ? `. Funded by ${manifest.project.funder}${manifest.project.program ? ` (${manifest.project.program})` : ""}.`
                : "."}
            </span>
            <span>
              Live data · revalidated every 5 minutes · last build{" "}
              {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC ·{" "}
              <a href="/api/auth/logout" className="hover:text-[var(--accent)] hover:underline">
                Sign out
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
