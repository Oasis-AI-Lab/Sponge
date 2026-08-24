import { test } from "node:test";
import assert from "node:assert/strict";
import { create, load, rename, save, subclass } from "../src/base/slice.js";
/** In-memory Store for deterministic tests (no file I/O). */
class MemoryStore {
    snapshots = new Map();
    pointers = new Map();
    async readSnapshot(hash) {
        return this.snapshots.get(hash) ?? null;
    }
    async writeSnapshot(hash, payload) {
        this.snapshots.set(hash, payload);
    }
    async readPointer(id) {
        return this.pointers.get(id) ?? null;
    }
    async writePointer(id, hash) {
        this.pointers.set(id, hash);
    }
}
test("lifecycle round-trip: create → save → load preserves state", async () => {
    const store = new MemoryStore();
    const s = create({ name: "root", content: { a: 1 } });
    const hash = await save(s, store);
    assert.equal(hash.length, 64); // sha256 hex
    const restored = await load(s.id, store);
    assert.equal(restored.id, s.id);
    assert.equal(restored.name, "root");
    assert.equal(restored.kind, "free");
    assert.equal(restored.parent, null);
    assert.deepEqual(restored.content, { a: 1 });
    assert.equal(restored.latest, hash);
});
test("content addressing: unchanged re-save yields the same hash", async () => {
    const store = new MemoryStore();
    const s = create({ name: "same", content: { x: [1, 2, 3] } });
    const h1 = await save(s, store);
    const h2 = await save(s, store);
    assert.equal(h1, h2);
});
test("content addressing: changed content yields a new hash; old snapshot survives", async () => {
    const store = new MemoryStore();
    const s = create({ name: "v", content: { n: 1 } });
    const h1 = await save(s, store);
    const h2 = await save({ ...s, content: { n: 2 } }, store);
    assert.notEqual(h1, h2);
    assert.ok((await store.readSnapshot(h1)) !== null); // rollback-ready
});
test("rename: new name ⇒ new version on next save", async () => {
    const store = new MemoryStore();
    const s = create({ name: "old" });
    const h1 = await save(s, store);
    const renamed = rename(s, "new");
    const h2 = await save(renamed, store);
    assert.notEqual(h1, h2);
    const restored = await load(s.id, store);
    assert.equal(restored.name, "new");
});
test("derivation: subclass preserves content, parent untouched, new kind applied", async () => {
    const store = new MemoryStore();
    const parent = create({ name: "wam-pipeline", content: { steps: ["read", "judge"] } });
    await save(parent, store);
    const child = subclass(parent, "pipeline-space");
    assert.equal(child.kind, "pipeline-space");
    assert.equal(child.parent, parent.id);
    assert.notEqual(child.id, parent.id);
    assert.deepEqual(child.content, parent.content); // content copied (SPEC §8)
    assert.equal(parent.kind, "free"); // parent untouched
    const childHash = await save(child, store);
    const restoredChild = await load(child.id, store);
    assert.equal(restoredChild.latest, childHash);
    assert.equal(restoredChild.kind, "pipeline-space");
    assert.equal(restoredChild.parent, parent.id);
});
test("base ignorance: brand-new kinds require zero base changes", async () => {
    // Any string kind works — the base validates nothing about kinds (SPEC §3.4).
    const s = create({ kind: "some-future-kind-xyz" });
    const child = subclass(s, "another-future-kind");
    assert.equal(s.kind, "some-future-kind-xyz");
    assert.equal(child.kind, "another-future-kind");
});
test("load of an unknown id fails loudly", async () => {
    const store = new MemoryStore();
    await assert.rejects(() => load("no-such-id", store), /slice not found/);
});
//# sourceMappingURL=slice.test.js.map