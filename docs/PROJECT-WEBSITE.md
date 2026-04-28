# Project Website Integration

**Version:** 1.0
**Owns:** the `website/` source tree + the deployed project URL (Vercel/Netlify/Cloudflare Pages)
**Owned by skill:** `project-website-publisher`

This document covers the project-website pattern added in v1.1 of the suite — what it is, why it exists, how it's wired to `.project-state/`, how to scaffold one for a new project, how it interacts with publication review and visibility tiers, and how to extend it.

## Why a website at all

Before the website existed, every consortium-facing artifact (tracker, cadence playbook, baseline reports, milestone specs) lived in two places: the canonical markdown/docx in `documents/published/`, and an emailed-or-Drive-shared copy that quickly drifted out of date. Stakeholders asked "what's the latest version of X" and the answer required someone to look it up.

The website fixes this by exposing one stable URL per document — a URL that always serves the latest published version, with no per-recipient distribution mechanic. Email someone a link instead of an attachment; the link is current.

The site is intentionally read-only and intentionally minimal: it mirrors `documents/published/` with light navigation and visibility-aware rendering. Authoring still happens in markdown in the substrate. The site exists to *surface* the substrate, not to *replace* it.

## The pattern at a glance

```
.project-state/                                       (Google Drive / OneDrive / shared FS)
├── documents/
│   ├── working/                  ← author here
│   ├── published/                ← curator promotes here
│   └── index.yaml                ← slug → published path + visibility
├── tracking/
│   └── 03-Project-Tracker-v1.0.xlsx
└── website/                      ← project-website-publisher owns this
    ├── package.json
    ├── next.config.js / vercel.json
    ├── content/docs/             ← regenerated MDX from documents/published/
    ├── pages/                    ← landing, downloads, [slug] route
    ├── components/               ← visibility-banner, tracker-link, etc.
    └── public/
        ├── downloads/            ← copied xlsx, pdf, zip
        └── images/               ← copied from doc image refs

         ↓ deploy

https://<project>.vercel.app/
├── /                             ← homepage with navigation built from index.yaml
├── /docs/cadence-at-a-glance     ← visibility: consortium
├── /docs/team-summary            ← visibility: team (noindex banner)
├── /docs/tracker                 ← description page + download link
├── /docs/baseline-reports-index  ← table of contents
└── /downloads/<filename>         ← live tracker xlsx, etc.
```

## Doc lifecycle on the website

```
[author writes markdown in documents/working/foo.md]
                ↓
[project-document-curator promotes to documents/published/foo.md
 and updates documents/index.yaml: surfaces: [website]]
                ↓
[activity log emits document.published event]
                ↓
[project-website-publisher.regenerate]
   - reads documents/published/foo.md
   - emits website/content/docs/foo.mdx
   - rewrites internal links to /docs/<other-slug>
   - copies referenced images to website/public/images/
                ↓
[project-website-publisher.build]
   - next build inside website/
   - validates internal links, download paths, public-doc clearance
                ↓
[project-website-publisher.deploy]
   - vercel --prod (or push to main if GH auto-deploy)
   - logs deploy URL into state.json under surfaces.website.last_deploy
   - posts Slack notification via project-notifier
```

A doc rename triggers a Next.js redirect: the curator stamps the old slug into `redirect_from` on the new entry, and the build emits the redirect rule. External links to the old URL keep working.

## Visibility tiers

Each entry in `documents/index.yaml` carries a `visibility` field:

| Visibility | Audience | URL behavior | Publication review |
|---|---|---|---|
| `team` | A47 + CDI internal | Served at `/docs/<slug>`. `noindex` meta tag. "Internal — do not redistribute" banner. | None |
| `consortium` | A47 + CDI + immediate stakeholders | Served at `/docs/<slug>`. `noindex`. "Consortium-confidential" banner. | SC informational notice when promoted |
| `public` | World-readable; indexed by search | Served at `/docs/<slug>`. No banner. Indexed. | **Full 30-day review per MPA (14-day for abstracts)** |

Visibility is enforced at three points:
1. **Build time** — `public` docs whose `publication_review.status != approved` cause `project-website-publisher.build` to fail with a clear error pointing at `project-publications`.
2. **Render time** — the MDX layout component reads visibility frontmatter and emits the appropriate banner + meta tags.
3. **robots.txt** — `team` and `consortium` slugs are always disallowed; `public` slugs are allowed only after their review clears.

The robots.txt is regenerated on every build from the current `documents/index.yaml`.

## Configuration

Add a `website` block under `surfaces:` in your project's `manifest.yaml`:

```yaml
surfaces:
  website:
    enabled: true
    framework: "nextjs"           # nextjs | astro | eleventy
    hosting: "vercel"             # vercel | netlify | cloudflare-pages | github-pages
    production_url: "https://<project>.vercel.app/"
    preview_urls_enabled: true
    auto_deploy_on_publish: true  # rebuild + deploy when documents/published/ changes
    require_review_for_public: true   # enforce 30-day MPA review on public pages
    default_visibility: "consortium"  # what new docs default to until explicitly set
    download_dir_max_size_mb: 100
    notification_channel_after_deploy: "#proj-deploys"
```

Per-doc, in `documents/index.yaml`:

```yaml
- slug: cadence-at-a-glance
  doc_id: doc-cadence-at-a-glance-v0.2-summary
  source_path: documents/published/cadence-at-a-glance.md
  surfaces: [website, drive]      # which surfaces this doc lands on
  visibility: consortium
  publication_review:
    required: false
    status: not_required
  generated_artifacts:
    docx: outputs/18a-Cadence-At-a-Glance.docx   # for download
  redirect_from:                  # if you renamed the slug
    - cadence-summary
```

## Scaffolding a website for a new project

`project-website-publisher init-website` does this in one step. Manually it's:

```bash
# 1. Inside .project-state/, create the website directory
cd .project-state
mkdir -p website
cd website

# 2. Initialize Next.js with MDX support
npx create-next-app@latest . --typescript --no-tailwind --app=false --no-eslint
npm install @next/mdx @mdx-js/loader @mdx-js/react gray-matter

# 3. Drop in the suite's website-template/ files
#    (provided in the skills package under templates/website/)
cp -r ../../templates/website/* .

# 4. Wire production_url
#    Vercel: vercel link, then vercel --prod for first deploy
#    Netlify: netlify init
#    Cloudflare Pages: wrangler pages project create

# 5. Update manifest.yaml surfaces.website.production_url with the deploy URL
```

The `templates/website/` directory in this package contains a starter Next.js project with the visibility-aware MDX layout, the `[slug].tsx` route, the homepage navigation generator, the downloads route, and a sample `vercel.json`.

## Hosting choices

| Hosting | Strengths | Trade-offs |
|---|---|---|
| **Vercel** (default) | Zero-config Next.js. Preview URLs per branch. Generous free tier. | Vendor lock-in for some Next.js features. |
| **Netlify** | Similar to Vercel. Strong forms / functions story. | Slightly slower builds for large MDX sets. |
| **Cloudflare Pages** | Fastest CDN. No bandwidth caps. | More setup for SSR-heavy sites; Next.js partial support. |
| **GitHub Pages** | Free. No platform lock-in. | Static-only. No preview URLs. Manual workflow setup. |

The skill is hosting-agnostic — `manifest.yaml.surfaces.website.hosting` controls which deploy command it runs. The starter template includes configs for all four.

## CI / deployment automation

Two integration patterns:

**Push-to-deploy (recommended for active projects).** Connect the `website/` subdirectory to a GitHub repo and enable Vercel's GitHub integration. Every push to the production branch triggers a deploy; preview deploys run on every PR. The `regenerate` step still runs locally inside `.project-state/` and commits the changes to the repo.

**CLI-deploy (recommended for shared-drive-only teams without git).** The skill runs `vercel --prod` or `netlify deploy --prod` directly from the project facility. No git required. State.json tracks deploy history.

## Integration with other surfaces

- **`project-notifier`** asks `project-website-publisher.what-url(slug)` when composing email drafts so emails contain stable links instead of attachments. The Monday tracker email, the bi-weekly stakeholder update, and the SC pack distribution all use this.
- **`project-blog-publisher`** routes long-form *narrative* updates (milestone completions, retrospectives, monthly briefs) to scsiwyg as blog posts; the website hosts the *reference* (cadence, specs, tracker, milestone definitions). Blog posts can link into the website via `https://<project>.vercel.app/docs/<slug>`.
- **`project-document-curator`** triggers website regeneration when a doc lands in `documents/published/`. The curator owns visibility classification at promotion time.
- **`project-publications`** holds the 30/14-day review clock. The website skill defers to it for public-doc clearance — never short-circuits the review.

## Operational rhythms

- **Auto-deploy on doc publish** (default) — `documents/published/` changes trigger rebuild + deploy. Slack notification posts to the configured channel with deploy URL and a one-line changelog.
- **Manual rebuild** — user runs `regenerate the website`. Skill rebuilds even if nothing has changed (useful after dependency updates or template tweaks).
- **Visibility flip** — doc moves from `team` → `consortium` or `consortium` → `public`. After review clears (for public), the next build picks up the new tier and adjusts banner / robots.txt.
- **Tracker refresh** — the live tracker xlsx is copied to `website/public/downloads/` on every build, so the download link always serves the current version.

## Audit trail

Every deploy writes an event to `logs/activity.ndjson`:

```json
{"ts":"2026-04-27T15:23:08Z","actor":"project-website-publisher","event":"website.deployed","url":"https://ai26-10.vercel.app/","commit_sha":"abc1234","docs_changed":["cadence-at-a-glance","tracker"],"deploy_log":"reports/deploys/2026-04-27-15-23-08.txt"}
```

Every visibility flip writes a `document.visibility_changed` event. Every refused-deploy (e.g. failing public-doc review) writes a `website.deploy_blocked` event with the reason. The deploy history is queryable from `state.json.surfaces.website.deploy_history` (last 10 deploys retained).

## Failure modes and recovery

| Failure | Cause | Recovery |
|---|---|---|
| Build fails on broken internal link | Source markdown references a slug that no longer exists | Build log names the source file + missing slug. Fix the source. |
| Build fails on missing image | Image referenced by markdown isn't in `documents/published/`'s image dir | Add image or remove reference. |
| Deploy fails on quota | Vercel/Netlify free-tier bandwidth or build-minutes exhausted | Hosting platform's UI shows the cap. Upgrade or wait for reset. |
| Public doc held back | `publication_review.status != approved` for a `public`-marked doc | `project-publications` tracks where in the 30-day clock the doc is. Either wait, mark non-public, or fast-track via SC. |
| Image > 5MB | Large image committed to repo | Build flags it. Compress or move to CDN reference. |
| Stale download | Tracker xlsx updated but website not rebuilt | Manual `regenerate the website` or wait for next auto-deploy trigger. |

## Why this completes the surface story

The suite started with three external surfaces routed through `project-notifier`: Slack, Gmail (drafts only), and Google Calendar. `project-blog-publisher` added the scsiwyg narrative surface. `project-website-publisher` adds the *reference* surface — stable URLs for the documents that don't change daily but get referenced constantly.

Together those four surfaces let the suite send any kind of project artifact to its appropriate channel:
- **Action / coordination** → Slack post (project-notifier)
- **External / formal** → Gmail draft (project-notifier)
- **Time-bound** → Calendar event (project-notifier)
- **Narrative / running story** → scsiwyg blog post (project-blog-publisher)
- **Reference / always-current** → website page (project-website-publisher)

Every artifact has a home. The substrate (`.project-state/`) remains the single source of truth for all of them.

## Acceptance test for a new project's website setup

A project's website is "done enough to use" when:

1. Visiting the production URL serves the homepage with navigation generated from `documents/index.yaml`.
2. `https://<project>.vercel.app/docs/cadence-at-a-glance` (or your equivalent canonical doc) renders correctly with the right visibility banner.
3. `https://<project>.vercel.app/downloads/<tracker-filename>` serves the current xlsx.
4. A test doc promoted to `documents/published/` appears at its URL within one rebuild cycle.
5. A test doc marked `visibility: public` without `publication_review.status: approved` causes the build to fail with the expected error.
6. The robots.txt at `https://<project>.vercel.app/robots.txt` lists the right Allow / Disallow rules.

If all six pass, you're ready to start using the website as the share-link surface for the project.
