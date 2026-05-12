# Project Website

**Version:** 2.0 (App Router template)
**Template location:** `templates/website/`
**Owns:** the `templates/website/` source tree + the deployed project URL (Vercel/Netlify/Cloudflare Pages)
**Skill:** `project-website-publisher`

This document covers the v2.0 Next.js App Router website template — what it is, how it reads `.project-state/` at runtime, how to deploy it for a new project, and how to configure it.

---

## What it is

`templates/website/` is a full-featured Next.js 16 project that renders `.project-state/` as a live team website. It uses the App Router with ISR (revalidate every 5 minutes) so pages are always current without a rebuild. All pages are password-protected via a cookie-based auth middleware.

The site provides:

| Route | Content source |
|---|---|
| `/` | Dashboard: milestones, Gantt, budget, quick stats |
| `/milestones` | All milestones with progress bars and owner badges |
| `/people` | Team roster grouped by organisation |
| `/blog` | Blog posts from scsiwyg (if configured) |
| `/blog/[slug]` | Full post rendered as Markdown |
| `/wiki/[...slug]` | Wiki pages from scsiwyg wiki |
| `/calendar` | Upcoming events from cadence.yaml + events/*.yaml |
| `/context` | Free-form context page from `.project-state/references/context.md` |
| `/decisions` | Decision log from `decisions/*.yaml` |
| `/risks` | Risk register from `risks/*.yaml` |
| `/reporting` | Baseline / report documents from `reports/` or `Baseline-Reports-*/` |
| `/reporting/[slug]` | Single report with doc preview |
| `/documents` | Document chain-of-custody index |
| `/about/the-project` | Funding, consortium, timeline from manifest |
| `/about/this-site` | What this site is |
| `/about/how-it-updates` | How content flows in |
| `/about/agentic-state-system` | The project-state skill system |

---

## Architecture

### Runtime reads, not build-time generation

Every page is a Next.js server component that reads `.project-state/` directly at request time. There is no static MDX compilation step and no content build pipeline. The layout is `force-dynamic` so no page is pre-rendered at build time.

```
Request → Next.js server component → reads .project-state/*.yaml → renders HTML → browser
```

ISR (`revalidate = 300`) keeps responses fast by caching the rendered output for 5 minutes, then revalidating in the background on the next request.

### File resolution

`lib/paths.ts` resolves the three key directories at startup:

```typescript
STATE_DIR  = .project-state/          // project root or parent
REPORTS_DIR = reports/ or Baseline-Reports-*/  // auto-discovered
SCSIWYG_USER = process.env.NEXT_PUBLIC_SCSIWYG_SITE ?? ""
```

When the website is deployed as a subdirectory of the project repo (`website/` inside the same repo as `.project-state/`), `lib/paths.ts` resolves paths upward automatically. When deployed standalone (Vercel with rootDirectory pointing at `website/`), run `npm run sync-state` (or `npm run vercel-build`) to copy `.project-state/` and `reports/` into the website directory before building.

### Stakeholder colours

`lib/colors.ts` provides a 5-slot palette assigned by stakeholder index. When the manifest lists:

```yaml
stakeholders:
  organizations:
    - short_code: ABC
    - short_code: XYZ
```

`buildStakeholderMap(orgs)` returns `Map { "ABC" → orange, "XYZ" → indigo, ... }`. All components (Gantt chart, milestones, people, dashboard) accept and use this map via `stakeholderStyle(shortCode, map)`. No project-specific colour hardcoding anywhere.

### Authentication

`middleware.ts` intercepts all routes except `/login` and `/api/auth/*`. A signed JWT in the `auth_token` cookie grants access. Set `AUTH_SECRET` (any random string, ≥32 chars) and `AUTH_PASSWORD` in your environment. The login page at `/login` issues the cookie.

---

## Directory layout

```
templates/website/
├── app/
│   ├── layout.tsx              force-dynamic, reads manifest for header/footer
│   ├── page.tsx                Dashboard
│   ├── login/page.tsx
│   ├── milestones/page.tsx
│   ├── people/page.tsx
│   ├── blog/page.tsx + [slug]/page.tsx
│   ├── wiki/[...slug]/page.tsx
│   ├── calendar/page.tsx
│   ├── context/page.tsx
│   ├── decisions/page.tsx
│   ├── risks/page.tsx
│   ├── reporting/page.tsx + [slug]/page.tsx
│   ├── documents/page.tsx
│   ├── about/{the-project,this-site,how-it-updates,agentic-state-system}/page.tsx
│   ├── globals.css             Tailwind v4, CSS variables for --accent/--muted/etc.
│   └── api/
│       ├── auth/{login,logout}/route.ts
│       └── reporting/[slug]/download/route.ts
├── components/
│   ├── timeline-bar.tsx        Progress bar across the project window in the header
│   ├── page-header.tsx         Kicker + title + description
│   ├── nav-dropdown.tsx        Desktop dropdown nav item
│   ├── mobile-nav.tsx          Hamburger nav for mobile
│   ├── markdown.tsx            react-markdown with GFM + syntax highlight
│   ├── mermaid.tsx             Client component for Mermaid diagrams
│   └── gantt-chart.tsx         SVG Gantt with dynamic owner colours
├── lib/
│   ├── paths.ts                STATE_DIR, REPORTS_DIR, SCSIWYG_USER
│   ├── state.ts                getManifest, getMilestones, getRisks, getDecisions, getPeople, fmtCAD
│   ├── timeline.ts             buildRange, progressFor, monthTicks, pctOfRange, dayDiff
│   ├── calendar.ts             getEvents, CATEGORY_STYLE
│   ├── scsiwyg.ts              listPosts, getPost, getWikiTree, getWikiPage, flattenTree
│   ├── documents.ts            listReportDocs, getReportDocBySlug, renderDocxToHtml, renderXlsxToSheets
│   ├── colors.ts               PALETTE, FALLBACK, buildStakeholderMap, stakeholderStyle
│   └── auth.ts                 signToken, verifyToken, AUTH_COOKIE
├── scripts/
│   └── sync-state.mjs          Copies .project-state/ + reports/ into website dir for standalone deploys
├── middleware.ts                JWT auth gate
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Setting up for a new project

### 1. Copy the template

```bash
# From inside the project repo (sibling to .project-state/)
cp -r /path/to/project-state/templates/website ./website
cd website
npm install
```

### 2. Set environment variables

Create `website/.env.local`:

```bash
# Required
AUTH_SECRET=<random-string-at-least-32-chars>   # e.g. openssl rand -hex 32
AUTH_PASSWORD=<your-team-password>

# Optional — connect the scsiwyg blog/wiki
NEXT_PUBLIC_SCSIWYG_SITE=<your-scsiwyg-username>
```

For Vercel/Netlify, set these as environment variables in the hosting dashboard instead of `.env.local`.

### 3. Run locally

```bash
# From the project repo root (where .project-state/ lives):
cd website
npm run dev        # dev server on http://localhost:3000
```

`lib/paths.ts` resolves `../. project-state` automatically when run from inside `website/`.

### 4. Deploy to Vercel

**Option A — whole repo (recommended)**

1. Push the repo to GitHub.
2. Create a new Vercel project, set **Root Directory** to `website`.
3. Set `AUTH_SECRET`, `AUTH_PASSWORD`, and optionally `NEXT_PUBLIC_SCSIWYG_SITE` in Vercel's Environment Variables.
4. Deploy. The `vercel-build` script (`node scripts/sync-state.mjs && next build`) copies `.project-state/` and `reports/` before building.

**Option B — website directory only**

If you're deploying only the `website/` folder (no parent repo on the host):

```bash
cd website
npm run sync-state   # copies ../. project-state → .project-state/ and finds reports dir
```

Then deploy. The sync script auto-discovers `reports/` or `Baseline-Reports-*/` in the parent directory and copies it as `reports/` in the website root.

---

## Configuration reference

### manifest.yaml fields used by the website

```yaml
project:
  short_name: "ABC-XYZ"          # header brand name
  long_name: "Full Project Name" # about/the-project title
  one_liner: "..."               # meta description, dashboard subtitle
  funder: "Funder Name"          # footer + about/the-project
  program: "Program Name"        # footer + about/the-project
  pic_project_number: "..."      # about/the-project
  governing_document: "..."      # about/the-project
  governing_document_status: "..." # about/the-project

dates:
  project_start: "2024-01-01"    # timeline bar, Gantt, about/the-project
  project_end:   "2026-12-31"

budget:
  total_project_cad: 1234567
  pic_co_investment_cad: 800000
  consortium_co_investment_cad: 434567

stakeholders:
  organizations:
    - id: abc
      short_code: ABC
      name: "Organisation ABC"
      role: "Lead Partner"
    - id: xyz
      short_code: XYZ
      name: "Organisation XYZ"
      role: "Research Partner"

surfaces:
  website:
    enabled: true
    production_url: "https://your-project.vercel.app/"
```

### Context page

Create `.project-state/references/context.md` (or `.project-state/context.md`) to populate the `/context` route. This page is for collaboration agreements, working norms, links, and any project-specific context that the team needs easy access to. If the file doesn't exist, the page shows a helpful empty state with instructions.

### Blog and wiki (scsiwyg)

Set `NEXT_PUBLIC_SCSIWYG_SITE` to your scsiwyg username. The blog page lists all posts from that account; the wiki route renders the scsiwyg wiki tree. If the env var is unset, both pages show empty states explaining how to connect.

### Calendar

Create `.project-state/cadence.yaml` for recurring events and `.project-state/events/*.yaml` for one-off events. The calendar page renders upcoming events from both sources.

---

## Stakeholder colour system

`lib/colors.ts` provides a 5-slot palette (orange, indigo, emerald, sky, violet) assigned round-robin by the order of `manifest.stakeholders.organizations`. Each `PaletteEntry` has four Tailwind class strings:

| Key | Used in |
|---|---|
| `bar` | Gantt chart milestone bars (gradient) |
| `dot` | Gantt chart owner dots |
| `pill` | Owner badges on milestone and people pages |
| `tag` | Tag pills elsewhere |

When adding a new project, no colour configuration is needed — just list the organisations in `manifest.yaml` in your preferred order and the palette assigns automatically.

---

## Reports directory

The `/reporting` route reads documents from a `reports/` directory (or any directory named `Baseline-Reports-*`). `lib/paths.ts` discovers the reports directory by scanning both `cwd` and its parent. Supported formats:

- `.docx` — rendered to HTML via mammoth
- `.xlsx` — rendered to a sheet table via xlsx
- `.pdf`, `.txt`, `.md` — served for download or rendered inline

`scripts/sync-state.mjs` handles copying the reports directory (regardless of its original name) as `reports/` when deploying standalone.

---

## Build and type checking

```bash
cd website
npm run build      # next build — must pass with zero TypeScript errors
```

The build succeeds without a `.project-state/` directory present because `app/layout.tsx` has both `export const dynamic = "force-dynamic"` (preventing build-time prerender) and an `EMPTY_MANIFEST` fallback with a try/catch around `getManifest()`.

Expected build output:
```
✓ Compiled successfully
ƒ (Dynamic)  server-rendered on demand   [all pages with force-dynamic layout]
● (SSG)      prerendered as static HTML  [blog/[slug], reporting/[slug], wiki/[...slug]]
```

The Turbopack NFT warning about `process.cwd()` in `lib/paths.ts` is expected and non-blocking.

---

## Operational notes

- **5-minute ISR**: Pages cache for 300 seconds. After updating `.project-state/` files, the site reflects changes within 5 minutes without a redeploy.
- **No rebuild needed for content changes**: Adding milestones, decisions, risks, people, or blog posts requires no rebuild — the next page request picks up the change.
- **Rebuild required for**: Changes to the website source code (components, pages, styles), dependency updates, or environment variable changes.
- **Auth**: The JWT expires after 30 days by default. Users log in again after expiry. Changing `AUTH_SECRET` invalidates all existing sessions immediately.
- **scsiwyg outage**: Blog and wiki pages degrade gracefully — they show empty states rather than crashing if the scsiwyg API is unreachable.

---

## Differences from v1.x

The v1.x website described in earlier documentation used a static MDX pipeline inside `.project-state/website/` with a `[slug].tsx` pages-router route. That approach required a rebuild and redeploy on every document change.

The v2.0 template (this document) replaces that with:

| v1.x | v2.0 |
|---|---|
| Static MDX compilation at build time | Server components reading YAML/MD at request time |
| Pages Router | App Router |
| Content in `.project-state/website/content/` | Content read directly from `.project-state/` |
| Rebuild on every doc change | ISR — no rebuild needed for content changes |
| Hardcoded visibility tiers in build | Auth middleware; all routes password-protected |
| Hardcoded stakeholder colours | Dynamic palette from `manifest.stakeholders.organizations` |
| Hardcoded `Baseline-Reports-2026-04-24` | Auto-discovered `REPORTS_DIR` |
| `/collaboration` page (project-specific) | `/context` page reads `references/context.md` |

The v1.x pattern is no longer supported. Projects using v1.x should migrate by replacing their `.project-state/website/` with a copy of `templates/website/` and updating their deploy configuration.
