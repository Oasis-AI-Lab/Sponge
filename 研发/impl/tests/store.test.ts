import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileStore } from "../src/base/store.js";
import { create, payloadOf, save } from "../src/base/slice.js";

async function withTempStore(run: (store: FileStore, root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), "sponge-store-"));
  try {
    await run(new FileStore(root), root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("FileStore: snapshots are content-addressed and deduplicated", async () => {
  await withTempStore(async (store, root) => {
    const s = create({ name: "x", content: { n: 1 } });
    const h1 = await save(s, store);
    const h2 = await save(s, store); // unchanged re-save
    assert.equal(h1, h2);
    const files = await readdir(path.join(root, "snapshots"));
    assert.equal(files.length, 1); // dedup: one snapshot file for both saves
    assert.equal(files[0], `${h1}.json`);
  });
});

test("FileStore: pointer round-trip and content fidelity", async () => {
  await withTempStore(async (store) => {
    const s = create({ name: "p", content: "hello" });
    const hash = await save(s, store);
    assert.equal(await store.readPointer(s.id), hash);
    assert.equal(await store.readPointer("nope"), null);
    assert.equal(await store.readSnapshot(hash), payloadOf(s));
    assert.equal(await store.readSnapshot("deadbeef"), null);
  });
});
