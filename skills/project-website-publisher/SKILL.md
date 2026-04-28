---
name: project-website-publisher
description: Build and deploy a full project website (Next.js on Vercel) that surfaces every dimension of the project — dashboard, milestones with full specs, blog (from scsiwyg), wiki (from scsiwyg), reference docs (from documents/published/), team directory, decision log, risk register, and about page. Reads .project-state/ YAML/JSON for substrate data and the scsiwyg API for blog posts and wiki pages. Use whenever the user says "publish to the site", "update the project website", "deploy", "regenerate the website", "rebuild and deploy", "init the project website", "what URL for [doc]", or any request to surface project state on the project URL.
---

# Project Website Publisher

This skill builds and deploys a full project website from the `.project-state/` substrate, the scsiwyg blog, and the scsiwyg wiki. The website is the project's single shareable URL — a live dashboard that surfaces every dimension of the project to the appropriate audience.

## What it owns

- The `website/` source tree (Next.js + MDX) inside `.project-state/`.
- The data loading layer (`lib/state.ts`, `lib/scsiwyg.ts`) that reads the substrate and scsiwyg API.
- All pages, components, and layouts that render project state.
- Regeneration when source data changes.
- Deployment via Vercel CLI.

## What it does not own

- Authoring docs — those live in `documents/working/` and get promoted via `project-document-curator`.
- Authoring blog posts — those are published via `project-blog-publisher` to scsiwyg.
- Authoring wiki pages — those are published via scsiwyg MCP tools directly.
- The underlying data — milestones, decisions, risks, people are managed by their respective `project-*` skills.

## Mental model

The website is a **read-only view** across three data sources:

```
.project-state/                          ← substrate (YAML/JSON/NDJSON)
├── manifest.yaml                        → /about
├── state.json                           → / (dashboard)
├── milestones/*.yaml                    → /milestones, /milestones/[id]
├── people/*.yaml                        → /team
├── decisions/*.yaml                     → /decisions
├── risks/*.yaml                         → /risks (when populated)
├── phases/*/manifest.yaml               → /about (lifecycle)
├── reporting-matrix.yaml                → /about (reporting matrix)
├── logs/activity.ndjson                 → / (recent activity feed)
├── documents/published/                 → /docs/[slug] (reference docs)
└── documents/index.yaml                 → /docs (doc listing)

scsiwyg API (username from manifest)     ← blog + wiki
├── /api/sites/{username}/posts          → /blog, /blog/[slug]
└── /api/sites/{username}/wiki/*         → /wiki, /wiki/[slug]
```

The website does not hold state. It reads at build time (SSG) or with ISR (5-minute revalidation for blog/wiki from scsiwyg). The substrate YAML files are the source of truth; the website renders them.

## Site structure

| URL | Source | Content |
|---|---|---|
| `/` | Dashboard | Project name, phase badge, milestone progress summary, milestone card grid, recent activity feed, quick links |
| `/milestones` | `milestones/*.yaml` | Card grid — id, title, owner, dates, progress bar, status badge |
| `/milestones/[id]` | `milestones/<id>.yaml` | Full spec — description, schedule (planned vs actual), deliverables list with status, technical progress narrative, at-risk reason |
| `/blog` | scsiwyg API | Post listing — title, date, tags, excerpt. ISR 300s. |
| `/blog/[slug]` | scsiwyg API | Full post — markdown body rendered as HTML. ISR 300s, fallback: blocking. |
| `/wiki` | scsiwyg API | Hierarchical tree of wiki pages. ISR 300s. |
| `/wiki/[slug]` | scsiwyg API | Full wiki page — markdown body, confidence badge, sources, see-also links. ISR 300s, fallback: blocking. |
| `/docs` | `documents/index.yaml` | Doc listing grouped by visibility tier (public, consortium, team) |
| `/docs/[slug]` | `content/docs/*.mdx` | Full doc — MDX rendered with visibility banner, last-modified date |
| `/team` | `people/*.yaml` | People directory — name, org, title, role, email |
| `/decisions` | `decisions/*.yaml` | Decision log table — date, title, decision, rationale, material-change flag |
| `/about` | `manifest.yaml` + phases + matrix | Project identity, lifecycle phases with gate criteria, reporting matrix, how the site updates |
| `/downloads/*` | `public/downloads/` | xlsx/pdf/zip artifacts from `tracking/` |

## Architecture

### Data loaders (`lib/`)

**`lib/state.ts`** — reads `.project-state/` files at build time:
- `getManifest()` — parse `manifest.yaml`
- `getState()` — parse `state.json`
- `getMilestones()` — read all `milestones/*.yaml`, return sorted by id
- `getMilestone(id)` — read single milestone
- `getPeople()` — read all `people/*.yaml`
- `getDecisions()` — read all `decisions/*.yaml`, sorted by date desc
- `getRisks()` — read all `risks/*.yaml`
- `getPhases()` — read all `phases/*/manifest.yaml`
- `getReportingMatrix()` — parse `reporting-matrix.yaml`
- `getActivityLog(limit?)` — read last N lines of `logs/activity.ndjson`

The state root is `path.join(process.cwd(), '..')` — the website dir is inside `.project-state/`.

**`lib/scsiwyg.ts`** — fetches from scsiwyg public API:
- `getBlogPosts()` — `GET /api/sites/{username}/posts`
- `getBlogPost(slug)` — `GET /api/sites/{username}/posts/{slug}`
- `getWikiTree()` — `GET /api/sites/{username}/wiki/tree`
- `getWikiPage(slug)` — `GET /api/sites/{username}/wiki/{slug}`

Graceful error handling — returns empty arrays/null if the API is down. The site builds without blog/wiki data.

### Components

| Component | Purpose |
|---|---|
| `Layout` | Shared wrapper — Nav header + footer, used by all non-doc pages |
| `Nav` | Navigation bar — Dashboard, Milestones, Blog, Wiki, Docs, About. Active state highlighting. |
| `ProgressBar` | Horizontal bar with color coding (green ≥70%, yellow ≥30%, red <30%) |
| `StatusBadge` | Colored pill for status values (complete, in_progress, planned, at_risk, blocked) |
| `PhaseBadge` | Purple badge for lifecycle phase display |
| `ActivityFeed` | Renders activity log entries with event icons and timestamps |
| `MilestoneCard` | Card for milestone grid — title, owner, progress bar, status badge |
| `DocLayout` | Doc page wrapper — visibility banner, last-modified date, funding acknowledgment |
| `VisibilityBanner` | Team (yellow) / consortium (blue) / public (none) banner |

### Styling

Minimal — system fonts, no CSS framework. `styles/globals.css` covers typography, tables, code blocks. Components use inline styles for layout. The aesthetic is clean project dashboard, not marketing site.

## Sub-actions

### `init-website`

One-shot scaffold of `website/` inside the project facility:

1. Copy the Next.js template (pages, components, lib, styles).
2. Create `documents/index.yaml` from `documents/published/`.
3. Regenerate MDX files in `content/docs/`.
4. Set `.env.local` from manifest (project name, one-liner, consortium).
5. Run `npm install && npm run build` to verify.
6. Deploy to Vercel with `vercel --prod --yes`.
7. Update `manifest.yaml:surfaces.website.production_url`.
8. Set Vercel env vars for NEXT_PUBLIC_* values.
9. Log `website.initialized` and `website.deployed` to activity log.

### `regenerate`

Rebuild the content layer from current state:

1. For each doc in `documents/index.yaml` with `surfaces: [website]`, transform the published markdown to MDX with frontmatter (title, description, visibility, last_modified).
2. Escape angle brackets that would break MDX parsing.
3. Copy the index to `content/_index.yaml` for homepage nav.
4. Copy tracker xlsx/pdf from `tracking/` to `public/downloads/`.
5. Write `.build-manifest.json` with content hashes for incremental rebuilds.

Substrate pages (milestones, decisions, team, etc.) do not need regeneration — they read YAML directly at build time via `lib/state.ts`.

### `build`

Run `next build` inside `website/`. Validates:
- All MDX files compile
- All internal links resolve
- All download links point at existing files
- Publication review cleared for `public`-visibility docs (if `require_review_for_public` is true)

### `deploy`

Run `vercel --prod --yes`. Log the deployment URL into the activity log with timestamp and changelog. Post notification via `project-notifier` if Slack is enabled.

### `what-url`

Look up the URL for a given entity:
- Doc slug → `/docs/<slug>/`
- Milestone id → `/milestones/<id>/`
- Blog post slug → `/blog/<slug>/`
- Wiki page slug → `/wiki/<slug>/`

Used by `project-notifier` when composing emails — emit links instead of attachments.

## Configuration

In `manifest.yaml`:

```yaml
surfaces:
  blog:
    enabled: true
    site_slug: "project-state"              # scsiwyg username
    site_url: "https://www.scsiwyg.com/project-state"
  website:
    enabled: true
    framework: "nextjs"
    hosting: "vercel"
    production_url: "https://project-state-docs.vercel.app"
    auto_deploy_on_publish: true
    require_review_for_public: false         # true for regulated projects
    default_visibility: "public"
```

The `blog.site_slug` is used by `lib/scsiwyg.ts` to construct API URLs. If blog is disabled, blog/wiki pages render with empty-state messages.

## Triggers

- **Doc promoted to `documents/published/`.** Curator emits `document.published` → skill runs `regenerate` + `build` + `deploy`.
- **Milestone updated.** Any `milestone.updated` or `milestone.completed` event → rebuild picks up new YAML at build time.
- **Blog post published.** `project-blog-publisher` publishes to scsiwyg → ISR revalidates within 5 minutes; full rebuild for immediate update.
- **Wiki page published.** Same ISR pattern as blog.
- **Manual rebuild.** User says "regenerate the website" or "redeploy the site."

## Inputs / outputs

- **Reads:** `manifest.yaml`, `state.json`, `milestones/*.yaml`, `people/*.yaml`, `decisions/*.yaml`, `risks/*.yaml`, `phases/*/manifest.yaml`, `reporting-matrix.yaml`, `logs/activity.ndjson`, `documents/published/`, `documents/index.yaml`, scsiwyg API (blog posts, wiki tree, wiki pages)
- **Writes:** `website/content/docs/*.mdx`, `website/content/_index.yaml`, `website/public/downloads/`, `website/.build-manifest.json`, activity log (deploy events)
- **Calls:** `project-state` (read), `project-notifier` (post-deploy notification), `project-external-comms` (clearance check for public docs)
- **Called by:** `project-orchestrator`, `project-document-curator`, `project-blog-publisher`, user

## Acceptance criteria

- Dashboard shows current phase, milestone progress, and recent activity.
- Every milestone in `milestones/` has a detail page at `/milestones/<id>/`.
- Blog posts from scsiwyg appear at `/blog/` within 5 minutes of publication.
- Wiki pages from scsiwyg appear at `/wiki/` within 5 minutes of publication.
- Docs from `documents/published/` appear at `/docs/<slug>/` within one rebuild.
- Team directory reflects `people/*.yaml`.
- Decision log reflects `decisions/*.yaml`.
- `npm run build` succeeds with zero errors.
- Deploy URL logged to activity log after every successful deploy.

## Failure modes

- **scsiwyg API down.** Blog/wiki pages render empty-state messages. Site still builds and deploys with substrate data.
- **MDX parse error.** Build log identifies the file. Usually unescaped angle brackets — run `regenerate` to fix.
- **Vercel deploy fails.** CLI error surfaced to user. No retry loop.
- **Publication review blocks a doc.** Intentional — skill refuses deploy and points to `project-external-comms`.
