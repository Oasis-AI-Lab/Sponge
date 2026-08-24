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
import type { Store } from "./store.js";

/** Stable handle; immutable after the first persist (SPEC §3.1). */
export type SliceId = string;

/** Open namespace; default is `free`; the base never interprets kinds (SPEC §3.4). */
export type Kind = string;

/** Opaque payload; the base never interprets content (SPEC §1). */
export type Content = unknown;

/** Content-addressed snapshot hash — sha256 hex of the serialized payload (SPEC §2). */
export type Hash = string;

export interface Slice {
  id: SliceId;
  name: string;
  kind: Kind;
  parent: SliceId | null;
  content: Content;
  latest: Hash | null;
}

export const FREE_KIND = "free";

export interface CreateOptions {
  /** Parent slice id — derivation chain (SPEC §2). */
  parent?: SliceId;
  /** Defaults to `free`. */
  kind?: Kind;
  name?: string;
  content?: Content;
}

/** Create a new slice, optionally as a derived (child) slice. */
export function create(opts: CreateOptions = {}): Slice {
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
export function rename(slice: Slice, newName: string): Slice {
  return { ...slice, name: newName };
}

/**
 * Derive a child slice with a new kind. Content is copied into the child; the parent
 * is untouched (SPEC §3.3). Working assumption: the child inherits the parent's name
 * unless one is given (SPEC §8).
 */
export function subclass(parent: Slice, kind: Kind, name?: string): Slice {
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
export function payloadOf(slice: Slice): string {
  return JSON.stringify({
    id: slice.id,
    name: slice.name,
    kind: slice.kind,
    parent: slice.parent,
    content: slice.content,
  });
}

/** Content-addressed snapshot hash (SPEC §2): identical payloads ⇒ identical hash. */
export function hashOf(slice: Slice): Hash {
  return createHash("sha256").update(payloadOf(slice), "utf8").digest("hex");
}

/** Persist: write the hashed snapshot (idempotent) and the per-slice pointer. Returns the hash. */
export async function save(slice: Slice, store: Store): Promise<Hash> {
  const hash = hashOf(slice);
  await store.writeSnapshot(hash, payloadOf(slice));
  await store.writePointer(slice.id, hash);
  return hash;
}

/** Restore a slice from its latest snapshot; throws if the id or snapshot is unknown. */
export async function load(id: SliceId, store: Store): Promise<Slice> {
  const hash = await store.readPointer(id);
  if (hash === null) {
    throw new Error(`slice not found: ${id}`);
  }
  const payload = await store.readSnapshot(hash);
  if (payload === null) {
    throw new Error(`snapshot not found: ${hash} (slice ${id})`);
  }
  const data = JSON.parse(payload) as {
    id: string;
    name: string;
    kind: string;
    parent: string | null;
    content: unknown;
  };
  return {
    id: data.id,
    name: data.name,
    kind: data.kind,
    parent: data.parent,
    content: data.content,
    latest: hash,
  };
}
