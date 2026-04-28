# Migration: v1.x → v2.0

Five steps. Non-destructive. Reversible. Substrate format unchanged — only manifest, stakeholder model, phase definitions, and the new reporting matrix change.

## Before you start

- Confirm your `.project-state/` is on v1.0 or v1.1 (`grep schema_version manifest.yaml` should show `1`).
- Make sure no one is actively editing the substrate (CONCURRENCY rules apply).
- Allocate ~30 minutes — most of that is reviewing the seeded reporting matrix.

## Step 1 — Install v2.0 core skills alongside v1.x

Drop the v2 `skills/` folder into your `.project-state/skills-v2/` (use the `-v2` suffix to avoid name collisions). Both versions coexist on disk.

```bash
cp -r /path/to/pic-project-skills-v2.0/skills /path/to/.project-state/skills-v2
```

Symlink the v2 skills into your Claude skills directory under their v2 names (or aliased):

```bash
cd ~/.claude/skills
for s in /path/to/.project-state/skills-v2/project-*; do
  ln -s "$s" .   # creates ~/.claude/skills/project-state/, etc.
done
```

If your v1 skills are already symlinked under the same names (e.g. `project-state`), this will conflict — temporarily rename the v1 symlinks:

```bash
for s in ~/.claude/skills/project-*; do mv "$s" "${s}-v1"; done
```

**Effort:** 2 minutes. **Reversible:** delete the new symlinks; rename the v1 ones back.

## Step 2 — Install the PIC pack (or your chosen pack)

Drop the pack folder into `.project-state/packs/`:

```bash
cp -r /path/to/pic-project-skills-v2.0/packs/pic-pcais /path/to/.project-state/packs/
```

You can install multiple packs. Common combinations:

```bash
cp -r packs/{pic-pcais,client-services} /path/to/.project-state/packs/
cp -r packs/{board-investor,agile-default} /path/to/.project-state/packs/
```

**Effort:** 2 minutes. **Reversible:** delete the pack folder.

## Step 3 — Migrate manifest.yaml

Run the migration script:

```bash
python3 /path/to/pic-project-skills-v2.0/scripts/migrate-v1-to-v2.py /path/to/.project-state --pack pic-pcais
```

This:

- Backs up your v1 manifest as `manifest.v1.bak.yaml`.
- Generates a new v2-schema `manifest.yaml` with stakeholders, phases.preset, and the funder.pic namespace populated from your v1 PIC fields.
- Generates an initial `reporting-matrix.yaml` seeded from the loaded pack(s) defaults.

If you load multiple packs, repeat `--pack`:

```bash
python3 migrate-v1-to-v2.py /path/to/.project-state --pack pic-pcais --pack client-services
```

**Effort:** 5 minutes (plus review). **Reversible:** `mv manifest.v1.bak.yaml manifest.yaml && rm reporting-matrix.yaml`.

## Step 4 — Review the migrated manifest and reporting matrix

Open `manifest.yaml` and check:

- `project.kind` looks right
- `stakeholders` lists everyone the project communicates with
- `phases.preset` matches your project shape (`grant-default` for PIC, etc.)
- `funder.pic` namespace has the right contacts and PIC-specific fields
- `surfaces` block carried over correctly

Open `reporting-matrix.yaml` and check:

- Each entry's stakeholder, cadence, format, surface, and generator make sense
- Mark entries you don't want as `optional: true` (they won't auto-dispatch)
- Add entries the seed didn't capture
- Adjust lead times if your team prefers different draft timing

This is the only step that takes meaningful time — typically 20–30 minutes. The reporting matrix is the new entity; your project's specifics live there.

## Step 5 — Cut over

Once you're confident the v2 system is working:

```bash
cd ~/.claude/skills
# Remove the temporary v1 renaming
for s in ~/.claude/skills/project-*-v1; do
  archived="${s%-v1}.archived"
  mv "$s" "$archived"
done
```

The v2 symlinks are now the canonical project-* skills. v1 skills are archived (for emergency rollback) but no longer triggered.

Delete `manifest.v1.bak.yaml` once you're confident there's no rollback needed (or keep it indefinitely as historical record — it's small).

**Effort:** 5 minutes. **Reversible until the v1 archive is deleted.**

## What changes in your day-to-day after migration

| Workflow | v1.x | v2.0 |
|---|---|---|
| Update milestone | `update M03 to 55%` | `update M03 to 55%` (unchanged) |
| Draft PIC claim | `draft Q2 claim` | `draft Q2 claim` (unchanged — pack profile) |
| Schedule SC meeting | `schedule next SC meeting` | `schedule next review meeting` or `next SC` (alias works) |
| Add a stakeholder | edit consortium block | edit `stakeholders` list |
| Add a new report cadence | not supported | add entry to `reporting-matrix.yaml` |
| Load a customer pack | not supported | `packs_loaded: [pic-pcais, client-services]` + seed matrix |

Most workflows are identical. The new capability is the matrix — multi-stakeholder reporting beyond what the PIC pack alone provides.

## Rollback (full)

```bash
# Restore v1 manifest
mv manifest.v1.bak.yaml manifest.yaml
# Remove the new entity
rm reporting-matrix.yaml
# Switch skill symlinks back to v1
cd ~/.claude/skills
for s in ~/.claude/skills/project-*.archived; do
  mv "$s" "${s%.archived}"
done
# Remove v2 symlinks
# (do this carefully; verify which is v1 vs v2 by checking link targets)
```

## Common issues

- **Migration script can't find pack defaults.** Pass `--pack-dir /absolute/path/to/packs/` explicitly if the script's auto-detection doesn't work.
- **Manifest validation fails after migration.** Likely a custom field in your v1 manifest that the script didn't recognize. Hand-merge it into the v2 structure (the relevant namespaces are `project`, `stakeholders`, `funder.<id>`, `customer.<id>`, `surfaces`).
- **Reporting matrix has duplicate entries.** Two loaded packs both seed the same `id`. Review and remove duplicates; the matrix doesn't auto-dedupe.
- **Old skill name still firing.** A `-v1` symlink is still in `~/.claude/skills/`. Archive or delete it.

## Why this is cheap

The substrate format doesn't change in v2.0. Activity logs, decisions, milestones, risks, IP entries, document index, all your `.project-state/` data — formatted identically before and after. v2.0 reads v1.x state directly. That's why steps 3-5 take minutes, not days.
