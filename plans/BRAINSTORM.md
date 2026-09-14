# Brainstorm Specification

> A brainstorm is a search, not a decision.
> Effective: 2026-08-30.

---

## Why this exists

Sponge's design space is wide and its failures are quiet: an idea killed too early, or an analogy
accepted too fast, costs months before anyone notices. Brainstorming is how we widen and stress the
space *before* committing. Its output is **material for decisions — never decisions**.

## The three rules that matter

1. **Gather before thinking.** No session starts from memory. First produce a dossier: what exists,
   from whom, with links — facts only, no conclusions. (Precedent: `exec/core/2026-08-30-research-camel.md`.)
2. **Diverge first; converge only on request.** During the session, add — do not prune. Convergence
   happens at the end, explicitly, and only when the strategic layer asks for it.
3. **Mark provenance and confidence on every claim.** Note/decision (cited) · inference (marked) ·
   unknown (marked). Never let the second look like the first.

## What a session must produce

- a **dossier** — the material, with sources;
- **candidates** — each with its *contact surfaces* ("touches X, may change Y"), not just its merits;
- a **tension list** — where candidates conflict, and what would falsify each;
- the **open questions**, phrased so they can be decided later;
- explicitly, **what was not decided**.

## What a session must not produce

- documents edited to look decided — never write into the constitution mid-session;
- conclusions dressed as facts;
- a convergence nobody asked for;
- a shopping list of topics with no method attached.

## Discipline we learned the hard way

| Failure we have hit | Rule that prevents it |
|---|---|
| Premature collapse of the design space | diverge first; converge only on request |
| One idea wired to ten concepts before it ran once | every connection is a hypothesis until exercised |
| A formalization mistaken for the constitution | cite the source; mark inference; keep unknowns unknown |
| Abstraction offered where concreteness was asked | when the topic has pages or objects, brainstorm *at* that level |
| Prompts that list topics but not method | state how the session will work, not only what it covers |

## Session shape

1. **Question and scope** — what is in, what is out.
2. **Dossier** — gathered before the session, presented first.
3. **Divergence** — candidates, contact surfaces, counter-evidence.
4. **Tension** — conflicts, falsifiers, and what would change our mind.
5. **Handoff** — open questions, and the explicit "not decided" list.

## Roles

- **Strategic layer** — sets the question, judges, decides when to converge.
- **Execution layer** — gathers, diverges, marks, records.
- **Nobody** — converts a brainstorm into a decision inside the session.

## Capture

| Artifact | Location |
|---|---|
| Session output | `plans/exec/<track>/<YYYY-MM-DD>-brainstorm-<subject>.md` |
| Pre-session dossier | `plans/exec/<track>/<YYYY-MM-DD>-research-<subject>.md` |

One file per session; append, never rewrite. Names carry the date and the subject (see [SPEC.md](SPEC.md)).
