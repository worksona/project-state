# Installing project-state

## Option A — Claude Code plugin (recommended)

### Add the marketplace and install

```
/plugin marketplace add github:atomic47/project-state
/plugin install project-state@atomic47
```

All 23 skills become available immediately, namespaced as `project-state:project-*`.

### Set up your first project

Navigate to the root of your project's shared drive folder, then run:

```
/project-scaffolder
```

The scaffolder asks about your project, selects a compliance pack, and creates `.project-state/` ready to go. Takes about 5 minutes.

### Verify

```
What phase are we in?          →  project-phase-gate
Show me the milestones         →  project-milestone-manager
What should I do this week?    →  project-orchestrator
Show the reporting matrix       →  project-state
```

---

## Option B — Local install from zip

If you received the plugin as a zip file:

```
/plugin install --local /path/to/project-state.zip
```

Then follow the same setup steps from Option A.

---

## Option C — Manual symlinks (advanced / contributor workflow)

For contributors working directly in the repo, or for teams on shared drives that pre-date plugin support:

```bash
cd ~/.claude/skills

for skill in \
  project-state project-scaffolder \
  project-phase-gate project-document-curator \
  project-milestone-manager project-status-reporter \
  project-orchestrator project-notifier \
  project-review-meeting project-funder-reporting \
  project-change-register project-blog-publisher \
  project-website-publisher project-doc-suite \
  project-sred-tracker project-sred-reviewer \
  project-onboarder project-ip-tracker \
  project-external-comms project-lessons \
  project-archive project-onboarding project-harvester
do
  ln -sf "/path/to/project-state/skills/$skill" .
done
```

Replace `/path/to/project-state` with the actual path to this repo.

---

## Compliance packs

When the scaffolder asks which pack to load, choose based on your project type:

| Pack | Choose if… |
|---|---|
| `agile-default` | Engineering team, Scrum/Kanban, no external funder |
| `board-investor` | Startup with board reporting obligations |
| `client-services` | Client-facing engagement, QBR cadence |
| `open-source-community` | Community-governed open-source project |
| `sred-canada` | Canadian project claiming SR&ED tax credits |

You can load multiple packs. Load none and the suite runs with bare presets — useful for custom configurations.

The `pic-pcais` pack (for Protein Industries Canada consortiums) is distributed separately. Contact [david@atomic47.co](mailto:david@atomic47.co) if you need it.

---

## Optional: project website

The `templates/website/` directory contains a Next.js App Router starter that renders `.project-state/` as a live team website. To set it up:

```bash
cp -r /path/to/project-state/templates/website ./website
cd website
npm install
```

See `docs/PROJECT-WEBSITE.md` for the full setup and deployment guide.

---

## Updating

To update the plugin to the latest version:

```
/plugin update project-state@atomic47
```

To update a specific pack after a new version is released, replace the pack directory in `.project-state/packs/<pack-id>/` with the new version.

---

## Description length constraint (for contributors)

Every `SKILL.md` frontmatter `description` field must be ≤ 1024 characters. Verify with:

```bash
python3 -c "
import re, glob
for f in sorted(glob.glob('skills/*/SKILL.md')):
    m = re.search(r'^description:\s*[\"\'](.*?)[\"\']', open(f).read(), re.DOTALL)
    if m:
        n = len(m.group(1))
        flag = ' *** OVER LIMIT ***' if n > 1024 else ''
        print(f'{f}: {n} chars{flag}')
"
```
