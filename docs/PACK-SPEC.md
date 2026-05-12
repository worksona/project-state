# Pack Specification — project-state-suite

**Version:** 1.0
**Status:** Authoritative
**Supersedes:** `docs/PACK-AUTHORING.md`
**Audience:** Pack authors, suite integrators, plugin developers

---

## 1. What is a Pack

A **pack** is a versioned collection of YAML profile files, Markdown templates, and a `reporting-matrix-defaults.yaml` that configures the six pack-required skills in the project-state-suite for a specific funder, customer type, or industry compliance regime.

The suite's 19 skills divide into two groups:

- **13 generic skills** — fully functional with no pack. Examples: `project-state`, `project-milestone-manager`, `project-status-reporter`, `project-document-curator`.
- **6 pack-required skills** — operational in generic mode, but require a pack profile to fulfill their domain-specific behavior.

### The six pack-required skills

| Skill | Profile file | What the profile configures |
|---|---|---|
| `project-funder-reporting` | `funder-reporting.yaml` | Claim cadence, deadlines, templates, cost categories, holdback, signoff chain |
| `project-review-meeting` | `review-meeting.yaml` | Meeting name, cadence, quorum, agenda template, pack assembly, minutes distribution |
| `project-external-comms` | `external-comms.yaml` | Review pipeline, window durations, required acknowledgement text, confidentiality screening |
| `project-ip-tracker` | `ip-tracker.yaml` | Disclosure recipient, templates, annual questionnaire, commercialization reporting |
| `project-phase-gate` | `phase-gate.yaml` | Phase sequence, gate-in/gate-out criteria, required artifacts per phase |
| `project-archive` | `archive.yaml` | Final report workflow, required closeout artifacts, retention rules, archive destination |

### When you need a pack

Use a pack when the compliance behavior is **reusable across multiple projects** under the same funder, customer type, or industry standard. Examples:

- A funder with fixed reporting cadences and mandated templates (e.g., a government innovation cluster)
- A customer type with standard contract terms (e.g., enterprise SaaS engagements)
- An industry compliance regime (e.g., SOC2 evidence collection)
- A project-management discipline applied consistently across a portfolio (e.g., agile sprint governance)

### When you do not need a pack

Do not create a pack for:

- One-off customizations for a single project. Those belong in the project's `.project-state/manifest.yaml` under `project.custom_config`.
- Behavior that the generic core already handles without profile input.
- Variations that differ between projects using the same funder (use profile field overrides in the project manifest instead).

### Pack as plugin type

A pack can be delivered in two ways:

- **Bundled inside a suite plugin** — the pack lives in `packs/<pack-id>/` within the suite plugin's directory tree and is installed with it.
- **Standalone pack plugin** — the pack is its own installable plugin with `type: pack` in its `plugin.yaml`. The plugin installs the pack directory into the suite's pack install path.

Both delivery modes produce the same on-disk layout once installed. The distinction is only in how the pack is distributed and versioned.

---

## 2. Pack Directory Layout

```
packs/<pack-id>/
├── manifest.yaml                   pack identity, version, what it provides
├── README.md                       human-readable explanation for pack users
├── profiles/                       YAMLs consumed by pack-required skills
│   ├── funder-reporting.yaml       loaded by project-funder-reporting
│   ├── review-meeting.yaml         loaded by project-review-meeting
│   ├── external-comms.yaml         loaded by project-external-comms
│   ├── ip-tracker.yaml             loaded by project-ip-tracker
│   ├── phase-gate.yaml             loaded by project-phase-gate
│   └── archive.yaml                loaded by project-archive
├── templates/                      Markdown or DOCX files referenced by profiles
│   ├── claim-cover-email.md
│   ├── meeting-agenda.md
│   └── ...
└── reporting-matrix-defaults.yaml  default matrix entries; seeded by project-scaffolder
```

**Constraints:**

- The `<pack-id>` directory name must match the `pack.id` field in `manifest.yaml`.
- Not all six profiles are required. Provide only the profiles your pack configures. A skill that finds no profile from the active pack runs in generic mode.
- `templates/` is required only if one or more profiles reference template files.
- `reporting-matrix-defaults.yaml` is optional but strongly recommended for any pack that configures reporting cadences.

---

## 3. Pack manifest.yaml Schema

File location: `packs/<pack-id>/manifest.yaml`

```yaml
pack:
  id: "pic-pcais"                         # required; unique slug, lowercase, dashes; matches directory name
  name: "Protein Industries Canada — PCAIS"  # required; human-readable display name
  version: "1.0.0"                        # required; semver
  compatible_core: ">=2.0,<3.0"          # required; semver range against project-state-suite version
  description: |                          # required; what funder/customer/industry this pack serves
    Funder pack for Protein Industries Canada PCAIS-funded consortium projects.
    Encodes PIC PM Guide requirements: quarterly claim cadence, Steering Committee
    lifecycle, MPA-mandated publication review, IP routing, six-phase lifecycle,
    and final reporting workflow.
  authors:                                # required; list of "Name <email>" strings
    - "David Olsson <david@atomic47.co>"
  governing_documents:                    # required; list of source documents this pack encodes
    - "PIC PM Guide (Protein Industries Canada Project Management Guide)"
    - "Master Project Agreement template"
  released: "2026-04-27"                  # required; ISO 8601 date of initial release
  maturity: production                    # required; production | beta | starter

provides:
  profiles:                               # required; list of profile slugs this pack ships
    - funder-reporting
    - review-meeting
    - external-comms
    - ip-tracker
    - archive
    - phase-gate
  templates:                              # required if templates/ dir is non-empty
    - claim-cover-email.md
    - sc-agenda-appendix-a.md
    - final-report.md
    - ip-disclosure.md
    - publication-review-form.md
  reporting_matrix_defaults: true         # bool; true if reporting-matrix-defaults.yaml is present

depends_on:
  packs: []                               # list of pack IDs required before this pack is activated

conflicts_with:
  packs: []                               # list of pack IDs that cannot coexist with this pack
```

### Field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `pack.id` | string | Yes | Unique slug. Must match directory name exactly. |
| `pack.name` | string | Yes | Human-readable name shown in catalog and UI. |
| `pack.version` | string | Yes | Semver. Versioned independently from suite. |
| `pack.compatible_core` | string | Yes | Semver range. Installer rejects if suite version is outside range. |
| `pack.description` | string | Yes | What compliance regime this pack encodes and who it is for. |
| `pack.authors` | list | Yes | At least one `"Name <email>"` entry. |
| `pack.governing_documents` | list | Yes | Source documents the pack encodes (PM guide, contract template, standard). |
| `pack.released` | string | Yes | ISO 8601 release date. |
| `pack.maturity` | enum | Yes | `production`, `beta`, or `starter`. |
| `provides.profiles` | list | Yes | Slugs for each profile YAML present in `profiles/`. |
| `provides.templates` | list | Conditional | Required when `templates/` contains files. |
| `provides.reporting_matrix_defaults` | bool | No | Defaults to `false`. |
| `depends_on.packs` | list | No | Pack IDs that must be activated before this pack. |
| `conflicts_with.packs` | list | No | Pack IDs that cannot be active at the same time. |

---

## 4. Profile YAML Schemas

Each profile file in `profiles/` configures one pack-required skill. The consuming skill reads the profile when the pack is active. Fields marked **required** must be present; fields marked **optional** are only read if present and have the stated default when absent.

### 4.1 funder-reporting.yaml

Consumed by: `project-funder-reporting`

```yaml
profile_id: "pic-pcais.funder-reporting"   # required; "<pack-id>.funder-reporting"
stakeholder_group: "funder.pic"            # required; must match an id in manifest.yaml stakeholders

reports:
  - id: "pic-quarterly-claim"              # required; unique within this profile
    name: "PIC Quarterly Claim"            # required; human-readable label
    description: |                         # optional; one paragraph
      The PIC PM Guide MS & financial tracking workbook.
    cadence:                               # required
      kind: quarterly                      # quarterly | monthly | annual | ad-hoc | post-event
      due_days_of_year:                    # required when kind is quarterly with fixed dates
        - "04-20"
        - "07-20"
        - "10-20"
        - "01-20"
      coverage_window: "previous quarter"  # optional; description of what period the report covers
      lead_time_days: 14                   # optional; how many days before deadline to produce draft
    format:                                # required
      kind: xlsx                           # md | docx | xlsx | pdf | html | mdx
      template: "templates/ms-and-financial-tracking.xlsx"   # optional; path relative to pack root
      output_naming: "reports/funder.pic/claims/{YYYY}-Q{Q}-pic-claim.xlsx"   # optional
    field_mapping:                         # optional; how substrate fields map to report fields
      milestones:
        source: "milestones/*.yaml"
        fields:
          - { from: "id", to: "Milestone_ID" }
          - { from: "percent_complete", to: "Percent_Complete" }
          - { from: "technical_progress", to: "Technical_Progress_Narrative" }
      member_expenses:
        source: "communications/finance/{YYYY}-{MM}-member-expense.yaml"
        per_member: true
    cover_delivery:                        # optional; if present, skill drafts a cover email
      surface: gmail.draft                 # always gmail.draft; never auto-send
      to: "{funder.pic.contacts.pm}"
      cc:
        - "{funder.pic.contacts.financial_analyst}"
      template: "templates/claim-cover-email.md"   # path relative to pack root
      subject: "Ai26.10 — Q{Q} {YYYY} Claim Submission"
    signoff_required:                      # optional; roles that must approve before submission
      - role: project_lead
      - role: finance_representative
    submission: "manual"                   # required; always "manual" — skill never auto-submits

monthly_close_alignment: true             # optional; if true, claim participates in monthly close
```

**Field summary:**

| Field | Required | Description |
|---|---|---|
| `profile_id` | Yes | Namespaced ID: `<pack-id>.funder-reporting` |
| `stakeholder_group` | Yes | ID from manifest stakeholders; identifies the funder |
| `reports[].id` | Yes | Unique slug within this profile |
| `reports[].cadence` | Yes | When the report is due |
| `reports[].format` | Yes | Output format and template |
| `reports[].signoff_required` | No | Roles that must approve; default none |
| `reports[].submission` | Yes | Must be `"manual"` |
| `reports[].cover_delivery` | No | When present, skill produces a Gmail draft cover email |
| `monthly_close_alignment` | No | Default `false` |

### 4.2 review-meeting.yaml

Consumed by: `project-review-meeting`

```yaml
profile_id: "pic-pcais.review-meeting"    # required; "<pack-id>.review-meeting"

meeting:
  name: "Steering Committee"              # required; display name used in artifacts
  short_id_prefix: "SC"                  # required; prefix for meeting IDs (e.g., SC-2026-Q1)
  cadence:
    kind: quarterly                       # required; quarterly | monthly | bimonthly | annual
    minimum: true                         # optional; if true, cadence is the minimum (more is allowed)
    alignment: "first-month-of-quarter"   # optional; how meetings align to calendar
  notice_minimum_days: 5                 # optional; business days notice required before meeting
  lookahead_months: 3                    # optional; how far ahead to schedule; default 3
  minutes_distribution_max_days: 5       # optional; business days to distribute minutes after meeting
  duration_minutes: 90                   # optional; default meeting duration

attendees:                               # optional; attendee role configuration
  designate_roles_per_member:            # optional; consortium-member roles required to attend
    - id: project_lead
      required: true
      voting: true
    - id: finance_representative
      required: true
      voting: true
  funder_attendees:                      # optional; funder-side attendees
    - id: pic_pm
      required: false
      voting: false
      role_label: "PIC Project Manager (non-voting)"

agenda:
  template: "templates/sc-agenda-appendix-a.md"   # required; path relative to pack root
  source: "PIC PM Guide Appendix A"               # optional; citation of governing document
  required_sections:                              # optional; enforced section list for completeness check
    - "Approval of previous minutes"
    - "Project status and milestone progress"
    - "Financial status and quarterly claim review"
    - "Risk register review"
    - "Action items + next meeting date"

preread_pack:                            # optional; if present, skill assembles a pre-read document
  assembly:                              # list of substrate queries to include
    - status-reporter.weekly
    - milestone-manager.at-risk
    - risks.recently-changed
    - changes.pending-orders
  output: "reports/sc-meetings/{sc-id}-preread-pack.docx"   # output path
  distribution_lead_days: 5             # business days before meeting to distribute

minutes:
  capture: "manual or transcript-fed"   # optional; informational
  template: "templates/sc-minutes.md"   # optional; path relative to pack root
  filing: "sc-meetings/{sc-id}-minutes.md"   # optional; where to file in substrate
  distribution:
    surface: gmail.draft                # always gmail.draft
    to: "all SC designates + PIC PM"   # description; skill resolves from manifest
    deadline: "5 business days post-meeting"
  action_items:
    file_as: tasks                      # optional; where to write captured action items
    owner_required: true                # optional; enforce owner on each action item
    due_date_required: true             # optional; enforce due date on each action item
    link_to_meeting: true               # optional; link action items back to the meeting record
```

**Field summary:**

| Field | Required | Description |
|---|---|---|
| `profile_id` | Yes | Namespaced ID: `<pack-id>.review-meeting` |
| `meeting.name` | Yes | Display name for the recurring meeting type |
| `meeting.short_id_prefix` | Yes | Prefix used in meeting IDs |
| `meeting.cadence.kind` | Yes | Recurrence frequency |
| `agenda.template` | Yes | Path to agenda Markdown template |
| `preread_pack` | No | When present, skill assembles and distributes pre-read materials |
| `minutes.template` | No | Path to minutes template; skill uses generic template if absent |

### 4.3 external-comms.yaml

Consumed by: `project-external-comms`

```yaml
profile_id: "pic-pcais.external-comms"   # required; "<pack-id>.external-comms"

review_windows:                          # required; keyed by communication type
  full_publication:
    business_days: 30                    # required; review window duration
    reviewer: "Steering Committee"       # required; who performs the review
    description: "MPA-mandated 30-day full publication review"   # optional
  abstract:
    business_days: 14
    reviewer: "Steering Committee"
  presentation:
    business_days: 14
    reviewer: "Steering Committee"
  press_release:
    business_days: 14
    reviewer: "Steering Committee + PIC Communications"
  blog_public:
    business_days: 14
    reviewer: "Steering Committee"

required_acknowledgement:               # optional; if present, skill enforces at build/publish time
  template: |
    This work was supported by Protein Industries Canada through the {program} program
    (Global Innovation Cluster co-investment, Government of Canada through Innovation,
    Science and Economic Development Canada).
  enforcement: "build-time"             # build-time | review-time
  variables:
    program: "PCAIS"

confidentiality_screening:             # optional; prompts presented before external submission
  prompts:
    - "Does this content disclose any unpublished IP that has not yet been filed as a patent?"
    - "Does this content reveal member-confidential financial figures or commercial arrangements?"
    - "Does this content disclose any third-party data or trade secrets covered by NDA?"
  on_yes: "block; route to project-ip-tracker for IP review or to legal review"

patent_filing_delay:                   # optional; IP-publication coordination
  enabled: true
  coordinates_with: project-ip-tracker
  workflow: |
    If a proposed publication discloses unfiled IP, project-ip-tracker is consulted.
    The publication clock pauses until patent filing is complete.

reviewer_signoffs_required:            # optional; per communication type
  full_publication:
    - { role: project_lead, organization: "any consortium member" }
    - { role: signing_authority, organization: "publishing member" }
  abstract:
    - { role: project_lead, organization: "any consortium member" }
```

**Field summary:**

| Field | Required | Description |
|---|---|---|
| `profile_id` | Yes | Namespaced ID: `<pack-id>.external-comms` |
| `review_windows` | Yes | At least one communication type with `business_days` and `reviewer` |
| `required_acknowledgement` | No | Funder acknowledgement text enforced at publication |
| `confidentiality_screening` | No | Pre-submission screening prompts |
| `reviewer_signoffs_required` | No | Per-type signoff requirements |

### 4.4 ip-tracker.yaml

Consumed by: `project-ip-tracker`

```yaml
profile_id: "pic-pcais.ip-tracker"       # required; "<pack-id>.ip-tracker"

disclosure:
  recipient_role: "PIC Director of Data and Intellectual Property"   # required
  recipient_contact: "{funder.pic.contacts.director_ip}"            # required; template variable resolved from manifest
  delivery_surface: gmail.draft          # required; always gmail.draft
  template: "templates/ip-disclosure.md" # required; path relative to pack root
  routing: "as IP arises, not on a cadence"   # optional; informational description

definitions:                             # optional; definitional text included in disclosure forms
  foreground_ip: |
    Intellectual property created during the course of the project using project funding.
    Default ownership: jointly held by contributing consortium members per MPA Schedule.
  background_ip: |
    Intellectual property owned by a consortium member prior to the project start.
    Members retain ownership; granted licenses to the consortium per MPA terms.

ip_registry:                             # optional; if present, skill maintains an IP registry
  abstract_format: "templates/pic-ip-registry-abstract.md"   # path relative to pack root
  submission_cadence: "as foreground IP is recognized; reviewed annually"
  fields_required:
    - title
    - inventors
    - background_ip_dependencies
    - foreground_ip_summary
    - commercialization_intent
    - licensing_status
    - patent_status

annual_questionnaire:                    # optional; annual IP section configuration
  ip_section_template: "templates/pic-annual-questionnaire-ip-section.md"
  inputs_drawn_from:
    - "ip/disclosures/*.yaml"
    - "ip/rationale.md"
    - "ip/licenses-granted.yaml"
    - "ip/commercialization-status.yaml"

commercialization_reporting:            # optional; cadence for commercial event reporting
  cadence: "annual; ad-hoc on material events"
  events_triggering_ad_hoc:
    - "license granted to third party"
    - "patent filed"
    - "spinout incorporated"
    - "first commercial sale"
```

**Field summary:**

| Field | Required | Description |
|---|---|---|
| `profile_id` | Yes | Namespaced ID: `<pack-id>.ip-tracker` |
| `disclosure.recipient_role` | Yes | Human-readable role of the IP disclosure recipient |
| `disclosure.recipient_contact` | Yes | Template variable or literal email for the recipient |
| `disclosure.delivery_surface` | Yes | Must be `gmail.draft` |
| `disclosure.template` | Yes | Path to disclosure form template |
| `ip_registry` | No | When present, skill maintains a structured IP registry |
| `annual_questionnaire` | No | Configuration for the annual IP questionnaire section |
| `commercialization_reporting` | No | Cadence and triggers for commercialization updates |

### 4.5 phase-gate.yaml

Consumed by: `project-phase-gate`

```yaml
profile_id: "pic-pcais.phase-gate"       # required; "<pack-id>.phase-gate"

base_preset: grant-default               # required; generic preset to extend
                                         # grant | agile | waterfall | client-engagement | open-source

phase_gate_overrides:                    # required; list of phase overrides relative to base_preset
  - phase_id: "01-loi"                  # required; slug matching the preset's phase
    gate_in: ~                           # optional; null means no entry gate
    gate_out: "LOI accepted by PIC"      # optional; condition that must be met to exit phase

  - phase_id: "02-approval"
    gate_in: "LOI accepted by PIC"
    gate_out: "Proposal approved by PIC"

  - phase_id: "03-planning"
    gate_in: "Proposal approved by PIC"
    gate_out: "First Steering Committee meeting held; all SOPs established"
    additional_required_artifacts:       # optional; artifacts added on top of preset defaults
      - "Signed MPA (all parties)"
      - "Steering Committee Designates Contact Information form"
      - "Steering Committee SOP (PIC template)"
      - "Initial project risk register"

  - phase_id: "04-execution"
    gate_in: "Kickoff SC meeting complete"
    gate_out: "All milestones complete OR project end date reached"
    required_recurring:                  # optional; ongoing requirements while in this phase
      - "Quarterly Steering Committee meeting + minutes within 5 business days"
      - "Quarterly claim submission by 20th of Apr/Jul/Oct/Jan"
      - "Annual Questionnaire"
      - "Annual risk assessment"
      - "Ongoing IP reporting to PIC Director of Data and IP"

  - phase_id: "05-closeout"
    gate_in: "Project end date reached"
    gate_out: "Final reports accepted by PIC; holdback released"
    required_artifacts: "from packs/pic-pcais/profiles/archive.yaml"   # reference to archive profile

  - phase_id: "06-archive"
    gate_in: "Holdback released; MPA closed"
    gate_out: ~                          # null means terminal phase
```

**Field summary:**

| Field | Required | Description |
|---|---|---|
| `profile_id` | Yes | Namespaced ID: `<pack-id>.phase-gate` |
| `base_preset` | Yes | Generic preset the pack overrides. Valid values: `grant`, `agile`, `waterfall`, `client-engagement`, `open-source`. |
| `phase_gate_overrides` | Yes | At least one override. Fields not overridden inherit from base preset. |
| `phase_gate_overrides[].phase_id` | Yes | Must match a phase slug in the base preset. |
| `phase_gate_overrides[].gate_in` | No | Entry condition. Null means no gate. Inherits from preset if absent. |
| `phase_gate_overrides[].gate_out` | No | Exit condition. Inherits from preset if absent. |
| `phase_gate_overrides[].additional_required_artifacts` | No | Artifacts added to the preset's list. |
| `phase_gate_overrides[].required_recurring` | No | Ongoing requirements while in this phase. |

### 4.6 archive.yaml

Consumed by: `project-archive`

```yaml
profile_id: "pic-pcais.archive"          # required; "<pack-id>.archive"

closeout_workflow:
  pre_close_kickoff_days: 90            # required; days before project end to begin closeout
  draft_due: "by project end date"      # optional; description of draft deadline
  finalization_window_days: 30          # required; days post-project-end to finalize all artifacts

required_artifacts:                     # required; list of documents that must exist before archive
  - id: pic-final-report-per-member     # required; unique slug
    description: "PIC final report, one per consortium member, per PIC template"   # required
    template: "templates/pic-final-report.docx"   # optional; path relative to pack root
    one_per: "consortium member"        # optional; multiplier; default is one per project
    cover_delivery:                     # optional; if present, skill drafts a cover email
      surface: gmail.draft
      to: "{funder.pic.contacts.pm}"
      cc:
        - "{funder.pic.contacts.financial_analyst}"

  - id: ip-final-reporting
    description: "Final IP disclosure summary; commercialization status"
    template: "templates/pic-ip-final-report.md"
    coordinates_with: project-ip-tracker   # optional; skill that produces this artifact

  - id: fte-confirmation
    description: "Confirmed FTE counts per member, per PIC requirement"
    format: "xlsx; PIC-supplied template"
    template: "templates/pic-fte-confirmation.xlsx"

  - id: final-financial-reconciliation
    description: "Final claim covering closeout period; reconciliation against MPA budget"
    coordinates_with: project-funder-reporting
    profile_used: "pic-pcais.funder-reporting"   # optional; profile that governs this artifact

  - id: holdback-release-tracking
    description: "Track PIC holdback release after final reports accepted"
    timeline: "post-finalization, may take weeks-to-months"
    completion_event: "holdback.released"    # optional; substrate event that completes this artifact

post_close:
  archive_directory: ".project-state/archive-{closeout-date}/"   # optional; default path
  retention: "indefinite; per MPA records-retention requirements"   # optional; informational
  audit_trail_finalization: "last activity.ndjson entry timestamped + closeout README written"   # optional
```

**Field summary:**

| Field | Required | Description |
|---|---|---|
| `profile_id` | Yes | Namespaced ID: `<pack-id>.archive` |
| `closeout_workflow.pre_close_kickoff_days` | Yes | Days before end date to start closeout workflow |
| `closeout_workflow.finalization_window_days` | Yes | Days post-end to complete all required artifacts |
| `required_artifacts` | Yes | At least one artifact entry |
| `required_artifacts[].id` | Yes | Unique slug within this profile |
| `required_artifacts[].description` | Yes | What this artifact is |
| `required_artifacts[].template` | No | Path relative to pack root |
| `required_artifacts[].one_per` | No | Multiplier; omit for single artifact |
| `required_artifacts[].coordinates_with` | No | Skill that produces or assists with this artifact |
| `post_close` | No | Post-archival configuration |

---

## 5. reporting-matrix-defaults.yaml

### Purpose

`reporting-matrix-defaults.yaml` declares the reporting matrix entries that `project-scaffolder` seeds into `.project-state/reporting-matrix.yaml` when the pack is activated during project initialization. Without this file, the project's reporting matrix contains only generic defaults; with it, pack-appropriate cadences, formats, and surfaces are pre-populated.

### Schema

```yaml
# reporting-matrix-defaults.yaml
defaults:
  - id: "pic-quarterly-claim"                        # optional but recommended; unique entry ID
    stakeholder_group: "funder.pic"                  # required; must be declarable in manifest.stakeholders
    report: "pic-quarterly-claim"                    # required; human-readable report kind label
    cadence:                                         # required; matches cadence kinds in REPORTING-MATRIX.md
      kind: quarterly
      days: ["04-20", "07-20", "10-20", "01-20"]
      lead_time_days: 14
    format: xlsx                                     # required; md | docx | xlsx | pdf | html | mdx | meeting
    surface: gmail.draft                             # required; surface or combination
    generator: project-funder-reporting              # required; skill that produces this report
    profile: "pic-pcais.funder-reporting"            # optional; pack profile that configures the generator

  - id: "sc-meeting-pack"
    stakeholder_group: "funder.pic"
    report: sc-meeting-pack
    cadence:
      kind: quarterly
      alignment: "first-month-of-quarter"
    format: docx
    surface: "calendar.invite + gmail.draft"
    generator: project-review-meeting
    profile: "pic-pcais.review-meeting"

  - id: "ip-disclosures"
    stakeholder_group: "funder.pic"
    report: ip-disclosures
    cadence:
      kind: ad-hoc
      on_event: "ip.disclosure.created"
    format: "md + email"
    surface: gmail.draft
    generator: project-ip-tracker
    profile: "pic-pcais.ip-tracker"
```

### How project-scaffolder uses this file

1. `project-scaffolder` reads the active pack's `reporting-matrix-defaults.yaml`.
2. Entries are merged with the generic defaults already seeded from the suite's built-in matrix template.
3. If a default entry has the same `id` as a generic entry, the pack entry wins.
4. The merged set is written to `.project-state/reporting-matrix.yaml` under `entries:`.
5. `project-scaffolder` prompts the user to fill in any entries that contain unresolved template variables (e.g., `{customer_id}`, `{funder_id}`).

---

## 6. Pack Activation

### Declaration

The active pack for a project is declared in the project's `.project-state/manifest.yaml`:

```yaml
project:
  active_pack: "pic-pcais"    # single pack slug; only one pack can be active per project
```

Multiple packs cannot be simultaneously active. If a project's compliance needs span two domains (e.g., a funder pack and a customer pack), the recommended pattern is to create a composite pack that combines both profiles, or to accept that one pack is active and configure the other domain via project-level manifest fields.

### Resolution order

When a pack-required skill runs, it resolves its profile in this order:

1. Load `active_pack` from `.project-state/manifest.yaml`.
2. Look for the profile YAML at `packs/<active_pack>/profiles/<profile-slug>.yaml` relative to the suite's pack install path.
3. If no `active_pack` is declared, check whether the suite plugin's `plugin.yaml` declares a `packs.default` entry.
4. If no profile is found by either path, the skill runs in **generic mode**.

### Generic mode behavior

A skill running without a profile:

- Announces which profile is missing: `No <profile-slug>.yaml found for active pack. Running in generic mode.`
- States which capabilities are unavailable: template rendering, cadence enforcement, signoff chain, funder-specific field mapping.
- States which capabilities remain available: basic document scaffolding, manual milestone linking, generic output formats.
- Does not error or exit. The skill completes its generic operation and logs the missing-profile warning to `logs/activity.ndjson`.

---

## 7. Pack as Plugin

### 7.1 Standalone pack plugin

A pack distributed as its own installable plugin has the following layout:

```
project-state-suite-<pack-id>/         top-level plugin directory
├── plugin.yaml                        plugin manifest with type: pack
├── README.md
└── packs/
    └── <pack-id>/                     the pack itself; identical to bundled layout
        ├── manifest.yaml
        ├── profiles/
        │   └── ...
        ├── templates/
        │   └── ...
        └── reporting-matrix-defaults.yaml
```

`plugin.yaml` for a standalone pack plugin:

```yaml
plugin:
  id: "project-state-suite-pic-pcais"
  name: "PIC/PCAIS Pack for project-state-suite"
  version: "1.0.0"
  type: pack                           # distinguishes pack plugins from suite and skill plugins
  description: |
    Configures project-state-suite for Protein Industries Canada PCAIS-funded projects.

depends_on:
  plugins:
    - id: "project-state-suite"
      version: ">=2.0,<3.0"

pack:
  id: "pic-pcais"
  install_path: "~/.claude/skills/project-state-suite/packs"   # where the pack is placed on install
```

### 7.2 Bundled pack

A pack bundled inside a suite plugin lives in `packs/<pack-id>/` within the plugin root and is declared in the suite's `plugin.yaml`:

```yaml
packs:
  bundled:
    - pic-pcais
  install_path: "~/.claude/skills/project-state-suite/packs"
```

**When to bundle vs. distribute separately:**

| Scenario | Recommendation |
|---|---|
| Pack is owned by the same team as the suite and ships on the same release cadence | Bundle inside the suite plugin |
| Pack is owned by a third party or has an independent release cadence | Distribute as a standalone pack plugin |
| Pack is a reference/starter implementation shipped for documentation purposes | Bundle inside the suite plugin |
| Pack encodes a regulated funder's requirements and must be independently auditable | Distribute as a standalone pack plugin |

### 7.3 Installing a pack plugin

Installation copies `packs/<pack-id>/` into the suite's pack install path. It does **not** inject any lines into `CLAUDE.md`. Packs configure existing skills; they do not add new slash commands. The installed directory structure after installing a standalone pack plugin is identical to having the pack bundled inside the suite.

---

## 8. Template Conventions

### Format

Templates are Markdown files (`.md`) or DOCX placeholder files. Markdown templates are preferred for all textual output. DOCX files are used only when the funder or customer requires a specific binary format.

### Variable syntax

Template variables use double-brace syntax: `{{variable_name}}`.

### Standard variables

These variables are available in all templates regardless of which profile references the template:

| Variable | Source |
|---|---|
| `{{project_name}}` | `manifest.yaml:project.short_name` |
| `{{project_id}}` | `manifest.yaml:project.id` |
| `{{date}}` | Current ISO 8601 date at render time |
| `{{project_lead}}` | `manifest.yaml:team.project_lead.name` |
| `{{funder_name}}` | `manifest.yaml:stakeholders.<funder-group>.name` |
| `{{reporting_period}}` | Computed from cadence: "Q2 2026", "April 2026", etc. |

### Profile-specific variables

Each profile schema defines additional variables that its templates may use. These are resolved from the substrate at render time.

**funder-reporting templates:**

| Variable | Source |
|---|---|
| `{{quarter}}` | Computed from cadence |
| `{{year}}` | Computed from cadence |
| `{{coverage_start}}`, `{{coverage_end}}` | Computed from cadence and `coverage_window` |
| `{{claim_amount_cad}}` | Aggregated from `member-expense.yaml` entries |
| `{{milestones_advanced}}` | Computed from milestone state delta |
| `{{overall_percent_complete}}` | Computed from milestone weights |
| `{{per_member_summary}}` | Rendered table from member expense data |
| `{{narrative_highlights}}` | Assembled from milestone `technical_progress` fields |
| `{{finance_representative.organization}}` | Resolved from manifest team |

**review-meeting templates:**

| Variable | Source |
|---|---|
| `{{sc_id}}` | Generated meeting ID, e.g., `SC-2026-Q1` |
| `{{time}}`, `{{duration}}`, `{{location}}` | From meeting record |
| `{{attendee_list}}` | Rendered from manifest stakeholders and profile attendee config |
| `{{previous_sc_id}}`, `{{previous_sc_date}}` | From previous meeting record |
| `{{milestones_completed}}`, `{{milestones_at_risk}}` | From milestone state |
| `{{risks_changed}}`, `{{risks_high_priority}}` | From risk register |
| `{{change_log_count}}`, `{{change_orders_pending}}` | From change register |
| `{{ip_disclosures_count}}`, `{{publications_in_review}}` | From IP and comms state |

### Template resolution

1. Skill looks for the template at the path declared in the profile, relative to the pack root.
2. If the file is not found at that path, the skill falls back to the suite's built-in generic template for that artifact type (e.g., `templates/generic/claim-cover-email.md`).
3. If no generic fallback exists, the skill renders the artifact inline without a template and logs a warning.

---

## 9. Pack Compatibility and Versioning

### Versioning rules

Packs version independently from the suite. Pack semver follows the same MAJOR/MINOR/PATCH conventions:

| Change type | Bump |
|---|---|
| Profile field removed or renamed | MAJOR |
| Template variable renamed | MAJOR |
| Phase sequence changed (phases reordered or removed) | MAJOR |
| New optional profile field added | MINOR |
| New template variable added (with a safe default at render time) | MINOR |
| Additional phase gate conditions added | MINOR |
| New template file added | MINOR |
| Wording correction in template or description | PATCH |
| README update | PATCH |

### Compatibility enforcement

The `compatible_core` semver range in `manifest.yaml` is enforced by the installer:

```yaml
pack:
  compatible_core: ">=2.0,<3.0"
```

If the installed suite version falls outside this range, the installer refuses to activate the pack and reports the conflict. Projects already using the pack continue to function until the next skill invocation, at which point the skill reports the version conflict.

### Testing a pack

Before marking a pack `production`, verify the following checklist:

- [ ] All `profiles/*.yaml` files parse without YAML errors.
- [ ] `pack.id` in `manifest.yaml` matches the directory name exactly.
- [ ] Every profile slug listed in `provides.profiles` has a corresponding file in `profiles/`.
- [ ] Every template path referenced in any profile resolves to a file in `templates/`.
- [ ] All template files render without unresolved variable errors when supplied with the standard variables.
- [ ] `reporting-matrix-defaults.yaml` parses and passes the reporting matrix schema without errors.
- [ ] When `active_pack` is set to this pack's ID in a test project's `manifest.yaml`, the resolution order reaches the correct profile.
- [ ] Each of the six pack-required skills runs end-to-end without error against a minimal test project with the pack active.
- [ ] `project-scaffolder seed-matrix --pack <pack-id>` writes correct entries to `.project-state/reporting-matrix.yaml`.

---

## 10. Catalog Entry

When a pack reaches `beta` or `production` maturity, it receives an entry in `docs/PACK-CATALOG.md`. Catalog entries are maintained manually; a pack author adds the entry as part of the same change that bumps the pack version.

### Required catalog fields

```markdown
### `<pack-id>` — <pack.name>

<one-paragraph description of what funder/customer/industry this pack serves>

| Field | Value |
|---|---|
| **ID** | `<pack-id>` |
| **Version** | `<semver>` |
| **Maturity** | production / beta / starter |
| **Governing documents** | comma-separated list |
| **Profiles provided** | funder-reporting, review-meeting, ... (list only those present) |
| **Funder / customer / industry** | plain text |

**Maturity note:** (brief description of what has been validated in production)
```

### Maturity levels

| Level | Meaning |
|---|---|
| `production` | Battle-tested on at least one live project with the named funder or customer. All six profiles it claims to provide have been exercised end-to-end. |
| `beta` | Shape is complete and schema-valid but has not been fully exercised in production. May have edge cases. |
| `starter` | Structural scaffold is correct; template content and field mappings require tuning for specific project contexts. |
