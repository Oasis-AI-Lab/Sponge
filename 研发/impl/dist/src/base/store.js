/**
 * Snapshot store for the base Slice.
 *
 * Layout (SPEC §2): snapshots are immutable files named by content hash
 * (`snapshots/{hash}.json`); per-slice pointers (`pointers/{id}.json`) record the
 * latest snapshot hash. Deduplication falls out of content addressing.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
export class FileStore {
    snapshotsDir;
    pointersDir;
    constructor(root) {
        this.snapshotsDir = path.join(root, "snapshots");
        this.pointersDir = path.join(root, "pointers");
    }
    async readSnapshot(hash) {
        try {
            return await readFile(path.join(this.snapshotsDir, `${hash}.json`), "utf8");
        }
        catch (err) {
            if (isNodeError(err) && err.code === "ENOENT")
                return null;
            throw err;
        }
    }
    /** Snapshots are immutable: an existing file with the same hash is left untouched. */
    async writeSnapshot(hash, payload) {
        await mkdir(this.snapshotsDir, { recursive: true });
        try {
            await writeFile(path.join(this.snapshotsDir, `${hash}.json`), payload, { flag: "wx" });
        }
        catch (err) {
            if (isNodeError(err) && err.code === "EEXIST")
                return;
            throw err;
        }
    }
    async readPointer(id) {
        try {
            const raw = await readFile(path.join(this.pointersDir, `${id}.json`), "utf8");
            return JSON.parse(raw).latest;
        }
        catch (err) {
            if (isNodeError(err) && err.code === "ENOENT")
                return null;
            throw err;
        }
    }
    async writePointer(id, hash) {
        await mkdir(this.pointersDir, { recursive: true });
        const file = { id, latest: hash };
        await writeFile(path.join(this.pointersDir, `${id}.json`), JSON.stringify(file), "utf8");
    }
}
function isNodeError(err) {
    return err instanceof Error && "code" in err;
}
//# sourceMappingURL=store.js.map