# @oasisailab/sponge-experimental-move-up-detector

English | [中文](README.zh.md)

Shadow-mode observer for the Move Up concept: it reads the conversation log, judges candidate semantic chunks through registered detectors, and retains what it judged so a developer can inspect and compare judgment methods. It creates, updates, and deletes no Space object, and it appends nothing to the session log.

The point of this package is the bench, not the detector. Two built-in detectors implement no judgment at all, so the default deployment records an explicit `stay` for every candidate; the value of the package is that a different implementation can be dropped in, or a different one selected, without touching another package.

## Config

```yaml
- id: move-up-detector
  name: '@oasisailab/sponge-experimental-move-up-detector'
  config:
    detectors: [stub]
    contextWindow: 20
    recentLimit: 50
```

- `detectors` — registered detector ids to run per chunk, in order. The list must name at least one detector and must not repeat an id.
- `contextWindow` — maximum recent conversation events supplied to a judgment.
- `recentLimit` — maximum observations retained in memory for inspection.

No shipped profile mounts this package, so loading it is the only way it can change behavior.

## What it observes

The plugin subscribes to the existing `session/event` feed; it defines no message bus of its own. The V0 chunker turns at most one conversation message into one chunk and passes the text through unchanged, with these exclusions, which are behavior rather than implementation detail:

- A `user/message` event counts as conversation only when `source.kind === 'user'`. Synthetic injected context — file-change notices, AGENTS.md, skill content, goal continuation rounds — shares the user role but is system plumbing, and produces no chunk.
- Assistant text is conversation, so a hypothesis first stated by the agent is as eligible as one stated by the user.
- Every other event type produces no chunk.

Chunking is a seam, not a service: `V0_SEMANTIC_CHUNKER` is the one exported implementation, and a later chunker replaces the binding in this package without changing the detector boundary.

## The detector boundary

A detector is a small replaceable object:

```ts
interface MoveUpDetector {
  readonly id: MoveUpDetectorId
  detect(chunk: SemanticChunk, context: MoveUpDetectorContext): MoveUpDetectorResult | Promise<MoveUpDetectorResult>
}
```

`MoveUpDetectorResult.decision` is `'stay' | 'move-up' | 'ask'`. `existingObject` names an existing Space object the chunk would update instead of creating one. `confidence` is optional, because an implementation may estimate none.

Register an implementation from any plugin:

```ts
const provider = await ctx.plugin({
  inject: ['moveUpDetector'],
  apply(providerCtx) {
    providerCtx.moveUpDetector.registerDetector(myDetector)
  },
})
```

The registration is owned by the calling fiber: disposing that fiber removes it. `registerDetector` throws on an empty or already-registered id, and returns a disposer that removes exactly its own registration. `ctx.moveUpDetector` also exposes `detectors()`, `recent()`, and `observe(chunk, context?)`, so a manual judgment and a live conversation judgment take the same path.

A detector is judged in isolation. One that throws or rejects produces no observation for itself and logs a warning, while the detectors configured beside it still run — so a broken implementation cannot hide the behavior of the one it is compared against.

## Experimental harness

`runDetectorHarness(subject, entries?)` feeds the fixed [`MOVE_UP_CORPUS`](src/corpus.ts) to a runtime and returns one report per entry; `formatHarnessReport(reports)` renders it. The corpus is the experiment's input: the conversation shapes a real detector is expected to separate, including the cases that look important but should stay in the conversation and one that may belong to an object that already exists.

Run the suite, which is also the harness entry point:

```sh
pnpm vitest run packages/experimental/move-up-detector
```

## Lifecycle

Disposal removes the `session/event` listener, clears the retained observations, and unregisters the service; a judgment already in flight finishes without recording. `tests/plugin.spec.ts` pins each of those, and `tests/loader-composition.spec.ts` boots a real `cordis.yml` through the Loader to prove the config selects the implementation and unloading restores the pre-load state.

## Model Experience

None, as the shadow-mode observer registers no prompt, tool schema, or session event and writes nothing back into the model request.

#### KV Cache effect

None; the plugin never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **No Move Up judgment exists** — both built-in detectors are deliberately inert (`stub` always stays, `human-review` always asks). Choosing a detector, not writing one, is the current experiment.
- **Shadow mode only** — nothing is created, updated, or resolved. `Create`/`Update` are expressible in a result through `existingObject`, and the plugin acts on neither.
- **Space context is always empty** — `MoveUpDetectorContext.spaceObjects` is the update-target boundary, and Sponge has no Space runtime to read yet, so a detector must treat an empty list as "existence unknown", never as proof that nothing exists.
- **The chunker is not pluggable** — V0 binds `V0_SEMANTIC_CHUNKER` in this package. Message granularity is a placeholder for a real semantic chunking scheme, whose absence is the first open question in the concept record.
- **No UI or live surface** — inspection is `ctx.moveUpDetector.recent()` plus the harness report. No observation is durable, so nothing survives the process, and no client or Remote surface exposes it.
- **The invariant checks retained state, not the append** — the companion re-validates retained observations at install time and on each dispatched session event. An observation created by a direct `observe()` call after the last conversation event is validated at the next event rather than at its own commit.
