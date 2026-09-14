# Plan Specification

> A plan is a promise about an outcome, not a description of work.
> Effective: 2026-08-30.

---

## Why plans exist

Sponge claims that depth is a property of the system, not of the weights — that structure can be built. Plans are where that claim is tested in the small: each one turns part of the vision into something observable, doubtable, and either kept or discarded.

Three things every plan protects:

- **Direction** — the container (信息空间) as the object of the work, and the central scheduler as the moat. Work that serves neither needs a reason to exist.
- **Honesty** — an unknown is never dressed as a known; a step nobody can verify is not a step.
- **Continuity** — work handed between tracks without a stated interface is work that will be done twice.

## Direction

Every plan is traceable in two directions:

- **Upward** — it serves a claim, an ambition, or a decision. Never "it seemed useful".
- **Downward** — its outcome is something a person can observe in the running system, or a measurement with a stated protocol.

## Principles

**Vision over mechanics.** A plan says where it is going and why that matters. It does not prescribe every motion; detail belongs in the work, not in the specification of the work.

**Outcomes over outputs.** "The package exists" is not progress. "A person opens the container page and sees who lives there" is.

**Honesty over optimism.** Every work item is marked for what it actually is — known, uncertain, hard, or blocked. Hard work states the reduced version that is genuinely achievable. Estimates are marked as estimates. A date that passes is recorded, not quietly moved.

**One home per fact.** Decisions live in the decision log; plans point at them and never restate them, because two copies drift apart.

**Interfaces before integration.** A plan states what it takes from upstream and what it gives downstream, including who consumes it. An interface exists only when both sides state it — especially the frontend↔backend contract, which must name its transport, its data, and where that data comes from.

**Data tells the truth.** Anything displayed before the real system produces it is marked as derived, minimal, or not-yet-real — and the surface itself says so.

**Dates are commitments, or they are labelled.** A date either binds, or it carries `est.`.

## Shape

```
plans/
├── README.md     what is active, what is blocked, what is next
├── SPEC.md       this file
├── roadmap/      where we are going, and by when
├── exec/         per-track plans — what a track does, and how it is judged
├── status/       weekly truth: progress, blockers, next
├── archive/      closed plans, frozen
└── decisions/    pointers to the decision log (研发/06)
```

**Every name carries its date and its subject**: `<YYYY-MM-DD>-<kind>-<subject>.md` — for example
`2026-08-30-plan-mode-switch.md`, `2026-08-30-brainstorm-editor-ui.md`, `2026-08-30-research-camel.md`;
roadmaps are `<YYYY-MM-DD>-<goal>-<horizon>.md`. A track may hold several dated plans: the latest date
is the current one, a superseding plan is a **new file**, and the superseded one is archived. Revisions
append inside the file and never rename it.

Each document opens by naming its **status, owner, approver, horizon, basis, exit** — the six facts that make it accountable.

A plan that declares no interfaces is incomplete. A roadmap that declares no dates is a wish.

## Markers used across plans

| Purpose | Markers |
|---|---|
| Truthfulness of a work item | ✅ known · ⚠️ uncertain · 🔴 hard · ❓ blocked (blocked names its decision) |
| Truthfulness of displayed data | **A** derived · **B** minimal new service · **C** not real yet (the surface says so) |
| Truthfulness of a date | plain = commitment · `est.` = estimate |

## Lifecycle

```
draft → approved → executing → archived
```

Approved plans are appended to, never rewritten: history stays readable, including the parts that were wrong.

## Roles

- **Strategic layer** — direction, scope, priority, decisions; owns roadmaps.
- **Execution layer** — execution plans, weekly status, evidence; owns how.
- **Review** — asks one question: reading only this plan, could a person tell whether it succeeded?

## Language

Plans and specifications in English. Product copy stays Chinese (repository rule). Design discourse stays in `研发/`.
