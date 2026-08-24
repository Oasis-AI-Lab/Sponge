# Sponge — Base Slice Implementation

English workspace for the **base abstract class (Slice)** of the Sponge paradigm.

The Slice is the free container and the base class of all abstract classes (02):
persistent, nameable, subclassable — and it never interprets semantics.

## Structure (approved 2026-08-23)

```
src/
├── base/        ✅ built     — Slice + content-addressed store
├── mechanism/   ⬜ planned   — scheduler · channel · agentpark
├── role/        ⬜ planned   — infosource · translator · receiver · scene
├── content/     ⬜ planned   — element
├── runtime/     ⬜ planned   — assembly + config (dual form = config)
└── tools/       ⬜ planned   — agent tool surface
experiment/      ⬜ planned   — falsification harness (scaffold vs Sponge)
apps/            ⬜ planned   — one minimal representation application
```

Planned directories are created when their plate starts (严格只做 slice).

## Contents
- [PLAN.md](PLAN.md) — execution plan (phases, milestones, approved structure)
- [SPEC.md](SPEC.md) — base-slice contract in English (written)

## Status
- Plan: approved (2026-08-23)
- Carrier decision (D-C): **TypeScript** — recorded in 06
- SPEC: written (Phase 0 done)
- Base slice + store: implemented (Phase 2 done)
- Verification: 10/10 tests green, including the derivation demo (Phase 3/4 done)

## Commands
```sh
npm test        # compile + run tests (node:test)
npm run build   # tsc → dist/
npm run typecheck
```
