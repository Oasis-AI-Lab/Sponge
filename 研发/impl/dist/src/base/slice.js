/**
 * Base Slice — the base abstract class of the Sponge paradigm.
 *
 * A Slice is a free container: persistent (content-addressed snapshots), nameable,
 * subclassable — and it never interprets what it carries (SPEC §1). Semantics belong
 * to subclasses; the base knows zero concrete kinds.
 *
 * @see SPEC.md
 */
import { createHash, randomUUID } from "node:crypto";
export const FREE_KIND = "free";
/** Create a new slice, optionally as a derived (child) slice. */
export function create(opts = {}) {
    return {
        id: randomUUID(),
        name: opts.name ?? "",
        kind: opts.kind ?? FREE_KIND,
        parent: opts.parent ?? null,
        content: opts.content ?? null,
        latest: null,
    };
}
/** Rename: returns a new slice; the next save produces a new snapshot version. */
export function rename(slice, newName) {
    return { ...slice, name: newName };
}
/**
 * Derive a child slice with a new kind. Content is copied into the child; the parent
 * is untouched (SPEC §3.3). Working assumption: the child inherits the parent's name
 * unless one is given (SPEC §8).
 */
export function subclass(parent, kind, name) {
    return {
        id: randomUUID(),
        name: name ?? parent.name,
        kind,
        parent: parent.id,
        content: parent.content,
        latest: null,
    };
}
/** The hashed snapshot payload: a pure function of the slice, no volatile metadata (SPEC §2). */
export function payloadOf(slice) {
    return JSON.stringify({
        id: slice.id,
        name: slice.name,
        kind: slice.kind,
        parent: slice.parent,
        content: slice.content,
    });
}
/** Content-addressed snapshot hash (SPEC §2): identical payloads ⇒ identical hash. */
export function hashOf(slice) {
    return createHash("sha256").update(payloadOf(slice), "utf8").digest("hex");
}
/** Persist: write the hashed snapshot (idempotent) and the per-slice pointer. Returns the hash. */
export async function save(slice, store) {
    const hash = hashOf(slice);
    await store.writeSnapshot(hash, payloadOf(slice));
    await store.writePointer(slice.id, hash);
    return hash;
}
/** Restore a slice from its latest snapshot; throws if the id or snapshot is unknown. */
export async function load(id, store) {
    const hash = await store.readPointer(id);
    if (hash === null) {
        throw new Error(`slice not found: ${id}`);
    }
    const payload = await store.readSnapshot(hash);
    if (payload === null) {
        throw new Error(`snapshot not found: ${hash} (slice ${id})`);
    }
    const data = JSON.parse(payload);
    return {
        id: data.id,
        name: data.name,
        kind: data.kind,
        parent: data.parent,
        content: data.content,
        latest: hash,
    };
}
//# sourceMappingURL=slice.js.map