# Plans

Planning artifacts for Sponge.

- Authoring rules: [SPEC.md](SPEC.md)
- Brainstorm rules: [BRAINSTORM.md](BRAINSTORM.md) — a brainstorm is a search, not a decision

## Active roadmap

| Roadmap | Status | Horizon |
|---|---|---|
| [2026-08-30-mvp-2-month](roadmap/2026-08-30-mvp-2-month.md) | draft v2 — awaiting strategic approval | 2026-08-31 → 2026-10-30 |

## Execution plans

| Track | Plan | Status | Milestones |
|---|---|---|---|
| `portal` | [2026-08-30-plan-portal-m1-m5](exec/portal/2026-08-30-plan-portal-m1-m5.md) | approved — M0 decided (D-P1…D-P4) | M1–M5 |
| `editor` | [2026-08-30-plan-mode-switch](exec/editor/2026-08-30-plan-mode-switch.md) | **draft** — mode switch first; canvas gated on the content model | E0–E2 |
| `desktop` | [2026-08-30-plan-desktop-runnable](exec/desktop/2026-08-30-plan-desktop-runnable.md) | **draft** — P1 install our UI into Desktop, then P2 host replacement | D0–D4 |
| `core` | not written — blocked on **D-N** | — | — |
| `move-up` | [2026-10-08-plan-move-up-mvp](exec/move-up/2026-10-08-plan-move-up-mvp.md) | **draft** — prove one semantic unit leaves the conversation and affects a later session | M0–M3 |
| `experiment` | not written | — | — |

## Brainstorms and research

| Artifact | Track |
|---|---|
| [2026-08-30-brainstorm-cordis-support](exec/core/2026-08-30-brainstorm-cordis-support.md) | core |
| [2026-08-30-research-camel](exec/core/2026-08-30-research-camel.md) | core |
| [2026-08-30-brainstorm-camel-coordinates](exec/core/2026-08-30-brainstorm-camel-coordinates.md) | core |
| [2026-08-30-brainstorm-editor-ui](exec/editor/2026-08-30-brainstorm-editor-ui.md) | editor |

## Decisions required before execution

| Decision | Blocks |
|---|---|
| **D-N** — core lives in this repo as new packages, or in a separate repository? | `core` track plan; roadmap scope |
| **S1′** — structure-on-disk format (structure registration) | structure browser, editor file level (E3), structure service |
| **D-E1/E2/E3** — the one structure operation; prototype data source; top bar vs `sponge.portal.nav` | `editor` E0/E1/E3 |
| **Domain granularity** (P1-10) — MVP口径 = slice level? | domain surfaces |
| **D-Q** — Move Up MVP landing site and authority (object store, detect→promote wiring, promotion logging, Space identity) | `move-up` track plan (M0/M1) |

## Current status

- `status/2026-W36.md` — not started

## Related

- Decision log: `研发/06_开放问题与决策.md`
- Design discourse: `研发/00`–`研发/08`, `研发/契约/`
