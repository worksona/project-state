# Pack Catalog (v2.0)

Packs that ship with this v2.0 release. Install by copying the pack folder into `.project-state/packs/` and adding the pack ID to `manifest.yaml.project.packs_loaded`.

## Production packs

### `pic-pcais` — Protein Industries Canada PCAIS

Reproduces v1.x behavior of the suite for PIC PCAIS-funded consortium projects. Encodes:

- Quarterly claim cadence (Apr/Jul/Oct/Jan 20) with PIC MS & financial xlsx
- Steering Committee lifecycle per PIC PM Guide Appendix A
- MPA-mandated 30-day publication review and 14-day abstract review
- IP routing to PIC Director of Data and Intellectual Property
- Six-phase project lifecycle (LOI → Approval → Planning → Execution → Closeout → Archive)
- Final reporting workflow (90-day pre-close template distribution, 30-day post-close finalization, FTE confirmation, holdback release)

**Maturity:** production. Battle-tested on Ai26.10.

## Starter packs (reference implementations)

### `client-services` — Consulting / Client Engagement

For consulting firms or any project where the external party is a paying customer rather than a funder.

- Monthly customer invoicing with milestone-based billing entries
- Quarterly Business Reviews (QBR)
- Customer-confidentiality review (NDA enforcement, sensitive-data scrubbing)
- Engagement wrap workflow (customer signoff, post-engagement support window)

**Maturity:** starter. Tune the invoice template, QBR agenda, and signoff gates to match your client contract.

### `board-investor` — PE/VC-backed Startup

For startups reporting to a board and/or investors on a regular cadence.

- Board meeting lifecycle (monthly/bi-monthly/quarterly)
- Monthly investor updates with KPI snapshot
- Board pack assembly from substrate

**Maturity:** starter. Tune the KPI list and board pack template to your board's preferences.

### `agile-default` — Engineering Defaults

For engineering teams running Scrum/Kanban with release trains. Does not assume a funder or customer; load alongside other packs.

- Sprint cadence + retrospective lifecycle
- Sprint phase model (Discovery → Build-loops → Hardening → Release)

**Maturity:** starter.

### `open-source-community` — Community-Governed OSS

For open-source projects with public-by-default visibility and community governance.

- Community-RFC review windows (no MPA clock)
- Contributor recognition + release notes
- Sunset/maintenance phase model

**Maturity:** starter — minimal scaffold.

## Combinations that work well

| Project shape | Packs to load |
|---|---|
| Standalone PIC consortium | `pic-pcais` |
| PIC consortium that also engages a customer | `pic-pcais + client-services` |
| Engineering team building a PIC-funded project | `pic-pcais + agile-default` |
| Startup with VC funding doing client work | `board-investor + client-services + agile-default` |
| OSS project with corporate sponsor | `open-source-community + board-investor` |
| Internal product team with no external reporting | `agile-default` only |

## Roadmap (packs to ship in future releases)

- `nserc-academic` — Canadian academic R&D (NSERC/SSHRC/CIHR)
- `nih-rppr` — US federal research with NIH RPPR
- `nsf-merit` — US federal research with NSF
- `eu-horizon` — European research with periodic + final reports
- `soc2-evidence` — SOC2 audit evidence collection
- `iso-27001` — ISO 27001 control attestation
- `fda-part11` — FDA Part 11 electronic records compliance

These are scaffolded as stubs in v2.0 (pack folders exist with manifest + README explaining what they'll contain) but not built out. Community contributions welcome.

## How to contribute a pack

See `docs/PACK-AUTHORING.md` for the schema and pattern. For contributions back to this catalog, contact david@atomic47.co or open an issue/PR on the upstream repository.
