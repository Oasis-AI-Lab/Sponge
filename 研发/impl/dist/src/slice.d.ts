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
export declare const FREE_KIND = "free";
export interface CreateOptions {
    /** Parent slice id — derivation chain (SPEC §2). */
    parent?: SliceId;
    /** Defaults to `free`. */
    kind?: Kind;
    name?: string;
    content?: Content;
}
/** Create a new slice, optionally as a derived (child) slice. */
export declare function create(opts?: CreateOptions): Slice;
/** Rename: returns a new slice; the next save produces a new snapshot version. */
export declare function rename(slice: Slice, newName: string): Slice;
/**
 * Derive a child slice with a new kind. Content is copied into the child; the parent
 * is untouched (SPEC §3.3). Working assumption: the child inherits the parent's name
 * unless one is given (SPEC §8).
 */
export declare function subclass(parent: Slice, kind: Kind, name?: string): Slice;
/** The hashed snapshot payload: a pure function of the slice, no volatile metadata (SPEC §2). */
export declare function payloadOf(slice: Slice): string;
/** Content-addressed snapshot hash (SPEC §2): identical payloads ⇒ identical hash. */
export declare function hashOf(slice: Slice): Hash;
/** Persist: write the hashed snapshot (idempotent) and the per-slice pointer. Returns the hash. */
export declare function save(slice: Slice, store: Store): Promise<Hash>;
/** Restore a slice from its latest snapshot; throws if the id or snapshot is unknown. */
export declare function load(id: SliceId, store: Store): Promise<Slice>;
