# Execution Plan — Base Slice (the base abstract class of Sponge)

Status: proposed | Date: 2026-08-23 | Owner: Sponge R&D

## 1. Goal

Build the **base abstract class** of the Sponge paradigm — the **Slice** — as a working
foundation.

Per 02 (概念与抽象类): *Slice is the free container, the base class of all abstract
classes.* Per 契约/切片-Slice-契约: it must be persistent, nameable, subclassable —
and, critically, it must **not interpret semantics** (semantics are the subclass's job).

The target is not "minimal content" but **minimal commitment**: exactly three
capabilities — persist, name, derive — plus the discipline of never interpreting what
it carries. Everything else in the paradigm grows out of `subclass()`.

## 2. Scope

### In scope
- Base slice data model: `id` (stable handle), `name`, `kind` (open namespace, default
  `free`), `parent?` (derivation chain), `content` (opaque JSON), `latest`
  (content-addressed snapshot hash).
- Persistence: content-addressed snapshot pool — files named by content hash;
  deduplication for free; rollback-ready (04: 演化「如何回滚」).
- Lifecycle API: `create(parent?, kind)` / `rename(name)` / `save()` / `load(id)` /
  `subclass(kind)`.
- Verification: invariants tests + one minimal derivation demo (`free` → `PipelineSpace`).
- All artifacts in English under `研发/impl/`.

### Out of scope (do not touch now)
- 元素 Element, 信息源 InfoSource, 通道 Channel, AgentPark mechanisms, 调度系统.
- Version-management UI, event protocols, cross-process/device sharing.
- Kind-registry semantics — the base never interprets `kind`.

### Scope discipline
- No speculative features. The base is exercised by its first real subclass; nothing is
  added until a running scenario demands it (防过度设计).
- The SPEC (Phase 0) is a **working hypothesis**, not a locked contract — it will be
  corrected by implementation and usage.

## 3. Phases

### Phase 0 — Contract (English SPEC)
- Artifact: `impl/SPEC.md` — base-slice contract in English:
  1. Definition & responsibilities
  2. Interface
  3. Semantics / invariants
  4. State & lifecycle
  5. Dependencies
  6. Interactions
- Source: 契约/切片-Slice-契约.md (Chinese) translated and trimmed to base-only;
  any divergence flagged in SPEC.
- Exit: SPEC is self-consistent and buildable.

### Phase 1 — Carrier decision (D-C gate)
- Decide the implementation language. Candidates:
  - **Rust** — notes' stated suggestion (D-C: 建议 Rust，与 Statuz 对齐);
  - **TypeScript** — dynamic / reflection-friendly; easier agent self-modification
    in later phases (野心一);
  - others.
- Criteria: alignment with Statuz, agent self-modification needs, tooling, time to a
  working base.
- Output: decision recorded in 06 (D-C) before implementation starts.

### Phase 2 — Implementation
- `impl/src/`: base slice + content-addressed snapshot store.
- Structure (per chosen language):
  - `slice` — data model & lifecycle methods;
  - `store` — hash-named snapshot pool, per-slice pointer.
- No features beyond the Phase-0 SPEC.

### Phase 3 — Verification
- Tests:
  1. lifecycle round-trip: create → save → load → identical state;
  2. content addressing: same content ⇒ same hash; changed content ⇒ new hash;
  3. derivation: `subclass(kind)` preserves content, parent untouched, new kind applied;
  4. id immutability after first persist;
  5. **base ignorance**: introducing a brand-new kind requires zero changes to the base.
- Demo: `free` slice → `subclass(PipelineSpace)` with content intact and the base file
  unchanged.

### Phase 4 — Acceptance
- Criterion (03 推论): the first real subclass derives **without modifying the base**.
- All tests green; demo passes; implementation matches SPEC (or SPEC amended
  explicitly).

### Phase 5 — Handoff hooks (not executed now)
- First real consumer decided later: 元素 (Element) or AgentPark-kind.
- Contract amendments flow back through 02 / 06 per the folder's revision rules.

## 4. Milestones (aligned with 05 M0)

| Milestone | Exit |
|---|---|
| M0a | `impl/` created; English SPEC written |
| M0b | D-C decided (06 updated) |
| M0c | base slice implemented; tests green |
| M0d | derivation demo passes (acceptance) |

## 5. Open decisions for the team

1. **Language (Phase 1)**: Rust (notes' suggestion) vs TypeScript vs other?
2. Directory confirmed as `研发/impl/`?
3. Divergences between the English SPEC and the Chinese contract draft are resolved
   explicitly (no silent drift).

## 6. Approved MVP-complete file structure (2026-08-23)

Team approved the draft layout (方案 B — layered by the nature of the abstract classes):

```
sponge-mvp/                 (研发/impl/ evolves into this)
├── src/
│   ├── base/          # Slice + store (the base abstract class) — BUILT
│   ├── mechanism/     # scheduler · channel · agentpark (mechanisms: run, change)
│   ├── role/          # infosource (interface + fake impl) · translator · receiver · scene
│   ├── content/       # element (callable units inside slices)
│   ├── runtime/       # assembly + config (FullyAgent/Coworker = config, not dirs)
│   └── tools/         # agent-facing tool surface (AgentPark editing entry)
├── experiment/        # falsification harness (常驻: scaffold vs Sponge, 01 六)
├── apps/              # one minimal representation application (proves 地基纯净, 03)
├── tests/
├── SPEC.md · PLAN.md · README.md
└── package.json
```

Cross-cutting decisions approved with the draft (revisable, 工作台):
- Contracts live in code (types + JSDoc); SPEC.md stays the single design doc.
- The MVP carries ONE minimal representation application (`apps/`) to prove the base
  does not know its upper layer (03 推论 / 04 判据 1).
- InfoSource: interface + a fake implementation live in `role/`; Statuz stays an
  external layer (03), connected later.
- Build discipline unchanged: only the plate currently being built exists on disk
  (严格只做 slice). Unbuilt directories are created when their plate starts.
