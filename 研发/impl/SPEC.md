# Base Slice — Contract (English SPEC)

Status: working hypothesis (工作台假设) | Date: 2026-08-23
Source: 契约/切片-Slice-契约.md (Chinese), trimmed to **base-only**.
Scope: strictly the base abstract class — 元素/信息源/通道/调度 are out of scope.

> This SPEC is a working hypothesis, not a locked contract. It will be corrected by
> implementation and usage (scope discipline in PLAN.md). Any change goes through the
> folder's revision rules (02 / 06 / 契约).

## 1. Definition & responsibilities

**Slice** is the free container and the base class of all abstract classes in Sponge (02).
It exists to be derived from, persisted, and named — and to never interpret what it carries.

Responsibilities (base only):
- be persistent (content-addressed snapshots);
- be nameable;
- be subclassable (derive new kinds without breaking existing content);
- carry opaque content (no interpretation).

Non-responsibilities (explicitly NOT the base's job):
- interpret `kind` or `content` (semantics belong to subclasses);
- decide when to create/release/evolve (scheduler's job);
- store 当下状态 (InfoSource's job).

## 2. Interface (language-neutral)

```text
Slice
├── id: SliceId            // stable handle; immutable after first persist
├── name: Name             // nameable; not globally unique
├── kind: Kind             // open namespace; default "free"; base never interprets
├── parent: SliceId | nil  // derivation chain; nil for root
├── content: Content       // opaque payload (any JSON); base never interprets
└── latest: Hash | nil     // content-addressed snapshot hash; nil until first save

create(parent?: SliceId, kind?: Kind) -> Slice
rename(slice: Slice, newName: Name) -> Slice
save(slice: Slice, store: Store) -> Hash        // serialize; content-hash snapshot; returns hash
load(id: SliceId, store: Store) -> Slice        // restore from latest snapshot
subclass(parent: Slice, kind: Kind) -> Slice    // derive: content preserved; new id; parent link
```

### Store (content-addressed snapshot pool)

```text
store/
├── snapshots/{hash}.json   // snapshot pool; named by content hash (dedup for free)
└── pointers/{id}.json      // per-slice pointer: { id, latest: hash }
```

Snapshot payload (the hashed unit):

```text
{ id, name, kind, parent, content }
```

- No volatile metadata (e.g., savedAt) inside the hashed payload — re-saving unchanged
  content must produce the same hash (dedup). Volatile metadata, if ever needed, lives
  outside the hash (in the pointer or elsewhere).
- `rename()` changes `name`, hence the next `save()` produces a new hash — a new version,
  not a mutation of the old one.

## 3. Semantics / invariants

1. **id immutability**: `id` never changes after the first persist. Content addressing
   applies to **snapshots** (per draft 2.3: 快照的身份由快照内容哈希决定), not to the
   handle itself — the handle stays stable, each save adds a new hashed snapshot.
2. **content addressing**: snapshot identity = hash(payload); identical payloads map to
   the same snapshot (dedup; rollback-ready — 04 演化「如何回滚」).
3. **derivation preserves content**: `subclass()` carries `content` over to the child;
   the parent is untouched.
4. **base ignorance**: the base code contains zero knowledge of any concrete `kind`.
   Adding a new kind requires zero changes to the base (acceptance criterion).
5. **name is not a locator**: names are not globally unique; `id` locates a slice.

## 4. State & lifecycle

```text
[unsaved] --create--> [Active] --save--> [Persisted]
   [Active] --subclass--> [Active·child] --save--> [Persisted·child]
```

- **Active**: in memory; operable.
- **Persisted**: at least one snapshot in the store; restorable by `id`.
- Invariant: `load()` returns an Active slice with id/name/kind/parent/content intact.

## 5. Dependencies

- **Depends on**: nothing (foundation plate, per 契约).
- **Depended on by** (future, out of scope now): Element, AgentPark kind, Scheduler.

## 6. Interactions

| Counterpart | Interaction (base only) |
|---|---|
| 元素 Element | out of scope; will live inside slices via content or derivation (decided later) |
| 信息源 InfoSource | orthogonal: slice stores structure, InfoSource stores 当下状态 |
| 调度系统 Scheduler | decides slice lifecycle timing (out of scope now) |

## 7. Divergences from the Chinese contract draft (flagged)

| Draft (契约/切片-Slice-契约.md) | This SPEC | Reason |
|---|---|---|
| `elements: Element[]` in the base interface | opaque `content` instead | Element is out of scope; the base must not presume what it carries |
| `create(parent?)` + `subclass(kind)` as separate signatures | `create(parent?, kind?)` + `subclass(parent, kind)` | merged into one derivation story (create = root or derived; subclass = derive from an existing slice) |
| invariant "one element in at most one slice" (2.1) | deferred | Element does not exist yet |
| `SliceKind = Free | Plugin | PipelineSpace | ...` | `kind` is an open string namespace, default `free`; the base lists no concrete kinds | base ignorance (acceptance criterion) |

## 8. Open questions (working hypotheses; do not resolve now)

- Is `content` arbitrary JSON with no schema? — working assumption: yes (base ignorance).
- At derivation, is content copied or referenced? — working assumption: copied into the
  child's payload; snapshots stay content-addressed.
- Where does `name` live relative to the hash? — inside the payload (renaming = new version).
