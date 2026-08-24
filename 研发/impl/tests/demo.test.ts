import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileStore } from "../src/base/store.js";
import { create, load, save, subclass } from "../src/base/slice.js";

/**
 * Acceptance demo (PLAN Phase 3/4): a `free` slice is derived into a
 * `pipeline-space` kind with content intact and the base untouched.
 */
test("demo: free slice → subclass(PipelineSpace), content intact, base untouched", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sponge-slice-"));
  try {
    const store = new FileStore(root);

    // 1. a free slice holds some content
    const free = create({ name: "research-notes", content: { topic: "unknown-unknowns" } });
    await save(free, store);

    // 2. the agent derives it into a PipelineSpace kind — the base has no knowledge of it
    const park = subclass(free, "pipeline-space");
    await save(park, store);

    // 3. both load back with content intact; the derived slice carries the new kind
    const loadedFree = await load(free.id, store);
    const loadedPark = await load(park.id, store);
    assert.deepEqual(loadedFree.content, { topic: "unknown-unknowns" });
    assert.equal(loadedFree.kind, "free");
    assert.deepEqual(loadedPark.content, { topic: "unknown-unknowns" });
    assert.equal(loadedPark.kind, "pipeline-space");
    assert.equal(loadedPark.parent, free.id);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
