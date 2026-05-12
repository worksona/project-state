---
name: project-website-publisher
description: Build and deploy a full project website (Next.js 16 App Router on Vercel/Netlify) that surfaces every dimension of the project — dashboard, Gantt, milestones, risks, decisions, people, blog (scsiwyg), wiki (scsiwyg), calendar, reporting documents, and about pages. Reads .project-state/ YAML/JSON/MD at runtime via server components with ISR revalidation. Use whenever the user says "publish to the site", "update the project website", "deploy", "regenerate the website", "rebuild and deploy", "init the project website", "what URL for [doc]", or any request to surface project state on the project URL.
---

# Project Website Publisher

This skill initialises, updates, and deploys a full project website from the `templates/website/` App Router starter. The website reads `.project-state/` at request time — there is no static content pipeline and no rebuild needed for data changes.

## What it owns

- The `website/` directory in the project repo (copied from `templates/website/`).
- The runtime data layer that reads `.project-state/` on every request.
- Password-protected authentication (JWT cookie via `middleware.ts`).
- Data sync for Vercel standalone deploys (`scripts/sync-state.mjs`).
- Deployment to Vercel/Netlify/Cloudflare Pages.

## What it does not own

- Authoring blog posts — use `project-blog-publisher`.
- Authoring wiki pages — use scsiwyg MCP tools directly.
- The substrate data — milestones, decisions, risks are managed by their respective `project-*` skills.

## Mental model

The website is a **read-only live mirror** of `.project-state/`:

```
.project-state/               ← substrate (YAML/JSON/MD/NDJSON)
├── manifest.yaml             → header brand, about/the-project, footer
├── milestones/*.yaml         → /, /milestones, Gantt chart
├── risks/*.yaml              → /risks
├── decisions/*.yaml          → /decisions
├── people/*.yaml             → /people
├── cadence.yaml              → /calendar
├── events/*.yaml             → /calendar
├── references/context.md     → /context  (or .project-state/context.md)
└── documents/index.yaml      → /documents

scsiwyg API (NEXT_PUBLIC_SCSIWYG_SITE)
├── posts                     → /blog, /blog/[slug]
└── wiki                      → /wiki/[...slug]

reports/ (or Baseline-Reports-*/)
└── *.docx/*.xlsx/*.pdf       → /reporting, /reporting/[slug]
```

Pages use Next.js server components + ISR (`revalidate = 300`). The layout is `force-dynamic` so no page is pre-rendered at build time — the build succeeds even without a `.project-state/` directory present.

## Site structure

| Route | Source | Content |
|---|---|---|
| `/` | Dashboard | Milestones, Gantt chart, budget, project stats |
| `/milestones` | `milestones/*.yaml` | All milestones with progress bars and owner badges |
| `/people` | `people/*.yaml` | Team roster grouped by organisation |
| `/blog` | scsiwyg API | Post listing with title, date, tags, excerpt |
| `/blog/[slug]` | scsiwyg API | Full post rendered as Markdown |
| `/wiki/[...slug]` | scsiwyg API | Wiki pages with sidebar tree |
| `/calendar` | `cadence.yaml` + `events/*.yaml` | Upcoming events with category styling |
| `/context` | `references/context.md` | Free-form context / working agreements |
| `/decisions` | `decisions/*.yaml` | Decision log with status badges |
| `/risks` | `risks/*.yaml` | Risk register with severity and owner |
| `/reporting` | `reports/` or `Baseline-Reports-*/` | Baseline / report documents |
| `/reporting/[slug]` | report file | Single document with preview |
| `/documents` | `documents/index.yaml` | Document chain-of-custody index |
| `/about/the-project` | `manifest.yaml` | Funding, consortium, timeline |
| `/about/this-site` | static | Site structure and audience |
| `/about/how-it-updates` | static | How content flows in |
| `/about/agentic-state-system` | static | The project-state skill system |
| `/login` | — | Password form (JWT cookie) |

## Architecture

### Stack

- **Next.js 16+** with App Router and Turbopack
- **Tailwind CSS v4** via `@tailwindcss/postcss` (requires `postcss.config.mjs`)
- **React 19** with server components for all data pages
- **Vercel** (default) for hosting with ISR support

### File layout (`templates/website/`)

```
website/
├── app/
│   ├── layout.tsx             # force-dynamic root layout; reads manifest for nav/footer
│   ├── page.tsx               # Dashboard
│   ├── globals.css            # Tailwind v4 + CSS variables (--accent, --muted, etc.)
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
│   └── api/
│       ├── auth/{login,logout}/route.ts
│       └── reporting/[slug]/download/route.ts
├── components/
│   ├── gantt-chart.tsx        # SVG Gantt with dynamic stakeholder colours
│   ├── timeline-bar.tsx       # Project progress bar in header
│   ├── page-header.tsx        # Kicker + title + description
│   ├── nav-dropdown.tsx       # Desktop dropdown nav
│   ├── mobile-nav.tsx         # Hamburger menu
│   ├── markdown.tsx           # react-markdown + GFM + syntax highlight
│   └── mermaid.tsx            # Client component for Mermaid diagrams
├── lib/
│   ├── paths.ts               # STATE_DIR, REPORTS_DIR, SCSIWYG_USER
│   ├── state.ts               # getManifest, getMilestones, getRisks, getDecisions, getPeople, fmtCAD
│   ├── timeline.ts            # buildRange, progressFor, monthTicks, pctOfRange, dayDiff
│   ├── calendar.ts            # getEvents, CATEGORY_STYLE
│   ├── scsiwyg.ts             # listPosts, getPost, getWikiTree, getWikiPage, flattenTree
│   ├── documents.ts           # listReportDocs, getReportDocBySlug, renderDocxToHtml, renderXlsxToSheets
│   ├── colors.ts              # PALETTE, FALLBACK, buildStakeholderMap, stakeholderStyle
│   └── auth.ts                # signToken, verifyToken, AUTH_COOKIE
├── scripts/
│   └── sync-state.mjs         # Copies .project-state/ + reports/ for standalone Vercel deploys
├── middleware.ts               # JWT auth gate — protects all routes except /login + /api/auth/*
├── next.config.ts
├── package.json               # vercel-build: "node scripts/sync-state.mjs && next build"
├── postcss.config.mjs
└── tsconfig.json
```

### Data loaders (`lib/state.ts`)

- `getManifest()` — `manifest.yaml`
- `getMilestones()` — `milestones/*.yaml`
- `getRisks()` — `risks/*.yaml`
- `getDecisions()` — `decisions/*.yaml`
- `getPeople()` — `people/*.yaml`
- `fmtCAD(n)` — format a number as CAD currency

### Path resolution (`lib/paths.ts`)

```typescript
STATE_DIR   = cwd/.project-state/   or   cwd/../.project-state/
REPORTS_DIR = auto-discovered: scans cwd and parent for reports/ or Baseline-Reports-*/
SCSIWYG_USER = process.env.NEXT_PUBLIC_SCSIWYG_SITE ?? ""
```

### Stakeholder colours (`lib/colors.ts`)

Five-slot palette (orange, indigo, emerald, sky, violet) assigned round-robin by the order of `manifest.stakeholders.organizations`. No hardcoding — `buildStakeholderMap(orgs)` returns `Map<shortCode, PaletteEntry>`, and `stakeholderStyle(shortCode, map)` looks up the entry. All components (Gantt, milestones, people, dashboard) accept and use this map.

### Authentication (`lib/auth.ts` + `middleware.ts`)

- JWT signed with `AUTH_SECRET` (env var, ≥32 chars)
- Password set via `AUTH_PASSWORD` (env var)
- Cookie `auth_token` set as httpOnly, secure in production, 30-day maxAge
- `middleware.ts` protects all routes except `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`

### Reports directory

`lib/paths.ts` `resolveReportsDir()` scans both `cwd` and its parent for `reports/` or any directory starting with `Baseline-Reports-`. `scripts/sync-state.mjs` copies the discovered reports dir as `reports/` when deploying standalone.

## Sub-actions

### `init-website`

One-shot scaffold of `website/` for a new project:

1. Copy `templates/website/` from the project-state skills package to the project root as `website/`.
2. `cd website && npm install`.
3. Create `website/.env.local`:
   ```
   AUTH_SECRET=<openssl rand -hex 32>
   AUTH_PASSWORD=<team password>
   NEXT_PUBLIC_SCSIWYG_SITE=<scsiwyg username if available>
   ```
4. Run `npm run build` to verify (succeeds even without `.project-state/` present).
5. Deploy to Vercel:
   - `npx vercel --prod --yes` (set rootDirectory to `website/` in Vercel project settings, or link first)
   - Set env vars in Vercel dashboard: `AUTH_SECRET`, `AUTH_PASSWORD`, `NEXT_PUBLIC_SCSIWYG_SITE`
   - **Important — disable SSO Deployment Protection** if this is a Vercel team project (see Known Pitfalls).
6. Update `manifest.yaml:surfaces.website.production_url` with the deploy URL.
7. Log `website.initialized` and `website.deployed` to `logs/activity.ndjson`.

### `deploy`

Rebuild and redeploy (needed only when website source code changes):

1. `cd website && npm run build` (runs sync-state if on standalone deploy, then next build).
2. `npx vercel --prod --yes`.
3. Update `manifest.yaml:surfaces.website.last_deploy`.
4. Log `website.deployed` to activity log.

### `what-url`

Look up the stable URL for a given entity:

| Entity | URL |
|---|---|
| Blog post `slug` | `<production_url>/blog/<slug>` |
| Wiki page `slug` | `<production_url>/wiki/<slug>` |
| Milestone page | `<production_url>/milestones` |
| Specific decision | `<production_url>/decisions` |
| Risk register | `<production_url>/risks` |
| Report doc `slug` | `<production_url>/reporting/<slug>` |

## Configuration

### manifest.yaml

```yaml
project:
  short_name: "ABC-XYZ"           # header brand name
  long_name: "Full Project Name"  # about/the-project title
  one_liner: "..."                # meta description, dashboard subtitle
  funder: "Funder Name"           # footer + about/the-project
  program: "Program Name"
  pic_project_number: "..."
  governing_document: "..."
  governing_document_status: "signed"

dates:
  project_start: "2024-01-01"
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
  scsiwyg:
    enabled: true
    site_slug: "your-scsiwyg-username"
```

### Context page

Create `.project-state/references/context.md` (or `.project-state/context.md`) for the `/context` route. Suitable content: collaboration agreements, working norms, channel links, project-specific context. If the file doesn't exist the page shows a helpful empty state.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | JWT signing key — any random string ≥32 chars |
| `AUTH_PASSWORD` | Yes | Team login password |
| `NEXT_PUBLIC_SCSIWYG_SITE` | No | scsiwyg username for blog/wiki |

## Known pitfalls

### Vercel deployment

1. **SSO Deployment Protection**: Team Vercel accounts enable SSO protection by default — your app never loads for external visitors. Disable via Vercel dashboard (Project → Settings → Deployment Protection → Off) or via API:
   ```bash
   curl -X PATCH "https://api.vercel.com/v9/projects/{projectId}?teamId={teamId}" \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"ssoProtection":null}'
   ```

2. **Output Directory**: Vercel may default to `out/`. Next.js uses `.next/`. The `next.config.ts` handles this; if needed add `"outputDirectory": ".next"` to `vercel.json`.

3. **rootDirectory**: If deploying from the full repo (not just `website/`), set Vercel's Root Directory to `website`. The `vercel-build` script handles the sync-state step automatically.

### Tailwind v4

4. **Missing postcss.config.mjs**: Tailwind v4 requires `postcss.config.mjs` exporting `{ plugins: { "@tailwindcss/postcss": {} } }`. Without it, no CSS is generated and the site renders unstyled.

### Data

5. **Turbopack NFT warning**: `lib/paths.ts` uses `process.cwd()` dynamically. Turbopack emits a non-blocking `Unexpected file in NFT list` warning. This is expected — ignore it.

6. **useSearchParams requires Suspense**: The login page wraps its form in `<Suspense>` — required by Next.js 16 when `useSearchParams()` is used inside a server-rendered page.

7. **Build without .project-state/**: The build succeeds cleanly without a `.project-state/` directory. `app/layout.tsx` has `export const dynamic = "force-dynamic"` and an `EMPTY_MANIFEST` fallback. Do not remove these.

## Triggers

- **Manifest updated.** Brand name, funder, dates, stakeholders → changes visible within 5 minutes (ISR).
- **Milestones / risks / decisions updated.** Changes visible within 5 minutes (ISR).
- **Blog post published via scsiwyg.** Visible within 5 minutes (ISR revalidation) or immediately after a manual rebuild.
- **Website source code changed.** Requires `npm run build` + redeploy.
- **Manual request.** "Regenerate the website", "redeploy the site", "push the latest state to the website."

## Inputs / outputs

- **Reads:** `.project-state/manifest.yaml`, `milestones/*.yaml`, `risks/*.yaml`, `decisions/*.yaml`, `people/*.yaml`, `cadence.yaml`, `events/*.yaml`, `references/context.md`, `documents/index.yaml`, `reports/` (or `Baseline-Reports-*/`), scsiwyg API (blog posts, wiki tree, wiki pages)
- **Writes:** `website/.project-state/` (sync-state copy for standalone deploys), `logs/activity.ndjson` (deploy events), `manifest.yaml:surfaces.website` (production_url, last_deploy)
- **Calls:** `project-state` (read), `project-notifier` (post-deploy notification)
- **Called by:** `project-orchestrator`, `project-blog-publisher`, user

## Acceptance criteria

A website setup is ready when:

1. The production URL loads the dashboard with the correct project name and timeline bar.
2. `/milestones` lists milestones with owner badges in the correct stakeholder colour.
3. `/people` lists team members grouped by organisation with colour-coded org pills.
4. `/blog` lists blog posts (or shows the empty state explaining how to connect scsiwyg).
5. `/reporting` lists report documents (or shows the empty state if no reports dir exists).
6. `/context` renders `references/context.md` (or shows the empty state with instructions).
7. `/login` works with the configured `AUTH_PASSWORD`.
8. `npm run build` passes with zero TypeScript errors.
9. The production URL is logged in `manifest.yaml:surfaces.website.production_url`.

## Failure modes

| Failure | Cause | Recovery |
|---|---|---|
| Site shows unstyled HTML | Missing `postcss.config.mjs` | Add `postcss.config.mjs` with Tailwind v4 plugin |
| All pages redirect to Vercel login | SSO Deployment Protection enabled | Disable in Vercel dashboard or API |
| Login fails (correct password rejected) | `AUTH_SECRET` mismatch between cookie issuance and verification | Ensure same `AUTH_SECRET` in all environments; changing it invalidates all sessions |
| Blog/wiki shows empty state | `NEXT_PUBLIC_SCSIWYG_SITE` not set or scsiwyg API down | Set env var; API outage resolves automatically |
| Reports page empty | No `reports/` or `Baseline-Reports-*/` dir found | Run `npm run sync-state` or create `website/reports/` symlink |
| Build fails on TypeScript error | Incompatible type added to template | Fix the type error; `PaletteEntry` must use `string` fields not literal unions |
| Pages show stale data | ISR cache not yet expired | Wait up to 5 minutes; or redeploy to clear cache |
