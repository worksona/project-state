#!/usr/bin/env python3
"""
migrate-v1-to-v2.py — non-destructive migration of a v1.x .project-state/ to v2.0.

What it does:
  1. Reads existing manifest.yaml (v1 schema).
  2. Writes manifest.v1.bak.yaml as a backup.
  3. Generates new manifest.yaml in v2 schema, splitting PIC fields into the funder.pic namespace.
  4. Generates initial reporting-matrix.yaml seeded from packs_loaded (default: pic-pcais).
  5. Leaves all other state (milestones, decisions, risks, IP, documents, logs) untouched.

What it does NOT do:
  - Install v2 skills (do that separately by symlinking v2 skill folders into ~/.claude/skills/).
  - Remove v1 skills (they coexist with v2 by name; cut over manually when ready).
  - Modify any data outside manifest.yaml + the new reporting-matrix.yaml.

Usage:
  python3 migrate-v1-to-v2.py /path/to/.project-state [--pack pic-pcais]

Reversible:
  rm reporting-matrix.yaml
  mv manifest.v1.bak.yaml manifest.yaml
"""

import argparse
import sys
import shutil
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("Install PyYAML: pip install pyyaml")


def load_v1_manifest(path: Path) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def build_v2_manifest(v1: dict, packs: list[str]) -> dict:
    proj = v1.get("project", {})

    v2 = {
        "schema_version": 2,
        "manifest_kind": "project",
        "project": {
            "name": proj.get("short_name", "TODO-ProjectName"),
            "long_name": proj.get("long_name"),
            "one_liner": proj.get("one_liner", "TODO"),
            "kind": "grant_consortium" if "pic-pcais" in packs else "generic",
            "start_date": v1.get("dates", {}).get("project_start"),
            "end_date": v1.get("dates", {}).get("project_end"),
            "packs_loaded": packs,
            "reporting_matrix_path": "reporting-matrix.yaml",
        },
        "stakeholders": [],
        "phases": {
            "preset": "grant-default" if "pic-pcais" in packs else "TODO-pick-preset",
            "current_phase": v1.get("phases", [{}])[2].get("id") if len(v1.get("phases", [])) > 2 else None,
        },
        "surfaces": v1.get("surfaces", {}),
        "concurrency": v1.get("concurrency", {
            "model": "shared-drive",
            "write_rules": "file-per-entity, frontmatter timestamps, advisory lockfiles, append-only logs",
            "lock_ttl_seconds": 300,
        }),
        "meta": {
            "schema_version": 2,
            "created": v1.get("meta", {}).get("created"),
            "created_by": v1.get("meta", {}).get("created_by"),
            "last_modified": "v2-migration",
            "last_modified_by": "scripts/migrate-v1-to-v2.py",
        },
    }

    # Stakeholders — internal team always present
    v2["stakeholders"].append({
        "id": "internal.team",
        "organization": v1.get("consortium", {}).get("project_lead_organization", {}).get("name", "TODO"),
        "role": "Project Team",
    })

    # Consortium members → consortium.<short_code> stakeholders
    for member in v1.get("consortium", {}).get("members", []):
        v2["stakeholders"].append({
            "id": f"consortium.{member.get('short_code', 'unknown').lower()}",
            "organization": member.get("organization"),
            "role": member.get("role"),
            "contacts": {
                "ceo": member.get("ceo"),
                "ceo_email": member.get("ceo_email"),
            },
        })

    # PIC namespace — only if pic-pcais pack is loaded
    if "pic-pcais" in packs:
        v2["stakeholders"].append({
            "id": "funder.pic",
            "organization": v1.get("project", {}).get("funder", "Protein Industries Canada"),
            "role": "Funder",
            "contacts": v1.get("pic_contacts", {}),
        })
        v2["funder"] = {
            "pic": {
                "project_number": proj.get("pic_project_number"),
                "program": proj.get("program", "PCAIS"),
                "governing_document": proj.get("governing_document", "Master Project Agreement (MPA)"),
                "schedule_a_workbook": proj.get("schedule_a_workbook"),
                "financial_assessment_workbook": proj.get("financial_assessment_workbook"),
                "proposal_docx": proj.get("proposal_docx"),
                "contacts": v1.get("pic_contacts", {}),
                "reporting_calendar": v1.get("reporting_calendar", {}),
            }
        }

    return v2


def seed_reporting_matrix(packs: list[str], pack_dir: Path) -> dict:
    matrix = {
        "schema_version": 2,
        "manifest_kind": "reporting_matrix",
        "entries": [
            {
                "id": "monday-tracker-email",
                "stakeholder_group": "internal.team",
                "report": "Monday tracker email",
                "cadence": {"kind": "weekly", "day": "monday", "lead_time_hours": 8},
                "format": "md",
                "surface": "gmail.draft + slack",
                "generator": "project-status-reporter",
                "description": "Generated from previous Friday retrospective.",
            }
        ],
    }

    for pack_id in packs:
        defaults_path = pack_dir / pack_id / "reporting-matrix-defaults.yaml"
        if defaults_path.exists():
            with open(defaults_path) as f:
                pack_defaults = yaml.safe_load(f)
                matrix["entries"].extend(pack_defaults.get("defaults", []))
        else:
            print(f"  WARNING: pack '{pack_id}' has no reporting-matrix-defaults.yaml; skipping seed for that pack")

    return matrix


def main():
    ap = argparse.ArgumentParser(description="Migrate v1.x .project-state/ to v2.0")
    ap.add_argument("project_state_dir", type=Path, help="Path to .project-state/")
    ap.add_argument("--pack", action="append", default=[],
                    help="Pack(s) to load. Default: pic-pcais. Can repeat: --pack pic-pcais --pack client-services")
    ap.add_argument("--pack-dir", type=Path, default=Path(__file__).parent.parent / "packs",
                    help="Directory containing pack folders (default: ../packs/ relative to this script)")
    args = ap.parse_args()

    state_dir = args.project_state_dir
    if not state_dir.exists():
        sys.exit(f"ERROR: {state_dir} does not exist")
    manifest_v1 = state_dir / "manifest.yaml"
    if not manifest_v1.exists():
        sys.exit(f"ERROR: {manifest_v1} not found")

    packs = args.pack if args.pack else ["pic-pcais"]
    print(f"Loading packs: {packs}")
    print(f"Pack dir: {args.pack_dir}")

    # 1. Backup v1 manifest
    backup = state_dir / "manifest.v1.bak.yaml"
    if backup.exists():
        sys.exit(f"ERROR: backup file already exists: {backup}\n"
                 "Migration appears to have run already. Remove the backup if you want to re-run.")
    shutil.copy(manifest_v1, backup)
    print(f"  Backed up v1 manifest to {backup.name}")

    # 2. Build v2 manifest
    v1_data = load_v1_manifest(manifest_v1)
    v2_data = build_v2_manifest(v1_data, packs)
    with open(manifest_v1, "w") as f:
        yaml.safe_dump(v2_data, f, sort_keys=False, default_flow_style=False)
    print(f"  Wrote v2 manifest to {manifest_v1.name}")

    # 3. Seed reporting matrix
    matrix_path = state_dir / "reporting-matrix.yaml"
    if matrix_path.exists():
        print(f"  reporting-matrix.yaml already exists; skipping seed (run --force-matrix to overwrite)")
    else:
        matrix = seed_reporting_matrix(packs, args.pack_dir)
        with open(matrix_path, "w") as f:
            yaml.safe_dump(matrix, f, sort_keys=False, default_flow_style=False)
        print(f"  Seeded reporting matrix at {matrix_path.name} ({len(matrix['entries'])} entries)")

    print("\nDone. Migration complete.")
    print("\nNext steps:")
    print("  1. Review the new manifest.yaml — especially the stakeholders list and funder namespace.")
    print("  2. Review reporting-matrix.yaml — adjust cadences, recipients, generators as needed.")
    print("  3. Symlink v2 skills into ~/.claude/skills/ (see INSTALL.md).")
    print("  4. Test: ask Claude 'what phase are we in?' — should still work.")
    print("  5. When confident, archive v1 skills (mv ~/.claude/skills/project-claim-prep .archive-v1/, etc.)")
    print("\nReversible: rm reporting-matrix.yaml && mv manifest.v1.bak.yaml manifest.yaml")


if __name__ == "__main__":
    main()
