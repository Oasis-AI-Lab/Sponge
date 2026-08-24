import type { Hash, SliceId } from "./slice.js";
export interface Store {
    readSnapshot(hash: Hash): Promise<string | null>;
    writeSnapshot(hash: Hash, payload: string): Promise<void>;
    readPointer(id: SliceId): Promise<Hash | null>;
    writePointer(id: SliceId, hash: Hash): Promise<void>;
}
export declare class FileStore implements Store {
    private readonly snapshotsDir;
    private readonly pointersDir;
    constructor(root: string);
    readSnapshot(hash: Hash): Promise<string | null>;
    /** Snapshots are immutable: an existing file with the same hash is left untouched. */
    writeSnapshot(hash: Hash, payload: string): Promise<void>;
    readPointer(id: SliceId): Promise<Hash | null>;
    writePointer(id: SliceId, hash: Hash): Promise<void>;
}
