# Project Website Starter Template

This is the starter template that `project-website-publisher.init-website` copies into `.project-state/website/` for a new project.

## What's here

```
website/
├── README.md           — this file
├── package.json        — Next.js + MDX + gray-matter dependencies
├── next.config.js      — Next.js config with MDX and visibility-aware routing
├── vercel.json         — Vercel deploy settings (also netlify.toml / wrangler.toml provided)
├── netlify.toml        — Netlify deploy settings (alternative)
├── wrangler.toml       — Cloudflare Pages settings (alternative)
├── pages/
│   ├── index.tsx       — homepage with navigation generated from documents/index.yaml
│   ├── docs/[slug].tsx — dynamic route serving any doc slug
│   ├── downloads/[file].tsx — downloads route
│   ├── _app.tsx
│   └── api/
│       └── revalidate.ts — webhook target for "doc published" events
├── components/
│   ├── VisibilityBanner.tsx   — renders "team" / "consortium-confidential" banner
│   ├── DocLayout.tsx          — wraps all doc pages with banner + footer
│   ├── HomeNavigation.tsx     — auto-generated nav from index.yaml
│   ├── TrackerLink.tsx        — link to current tracker xlsx in /downloads/
│   └── FundingAcknowledgment.tsx — PIC + ISED footer
├── styles/
│   └── globals.css
├── content/
│   └── docs/           — populated by project-website-publisher.regenerate from documents/published/
└── public/
    ├── downloads/      — copied xlsx, pdf, zip artifacts
    └── images/         — copied from doc image references
```

## Initial setup (one-time, per project)

```bash
# 1. Inside .project-state/, the init-website action copies this template
cd .project-state/
# (project-website-publisher.init-website does this automatically)

# 2. Install dependencies
cd website/
npm install

# 3. Link to your hosting platform
# Vercel:
vercel link
vercel --prod   # first deploy

# Netlify:
netlify init
netlify deploy --prod

# Cloudflare Pages:
wrangler pages project create <project-name>
wrangler pages deploy out

# GitHub Pages:
# Enable Pages in repo settings, set source to gh-pages branch.
# .github/workflows/deploy.yml is included.
```

## Updating after the initial setup

Don't edit content/docs/ or public/downloads/ by hand — they're regenerated. To change a doc, edit it in `documents/working/`, promote to `documents/published/`, and let `project-website-publisher.regenerate` rebuild.

To change the layout, navigation, or branding, edit `components/` or `pages/`. These are stable across regenerates.

## Visibility tiers

The `DocLayout.tsx` component reads the `visibility` field from MDX frontmatter and renders the appropriate banner:

- `team` — yellow banner: "Internal — A47 + CDI only — do not redistribute"
- `consortium` — light banner: "Consortium-confidential"
- `public` — no banner

Visibility is also enforced at build time (public docs require cleared publication review) and via `robots.txt` (only `public` tier is crawlable).
