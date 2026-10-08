/**
 * Space object store: create, read, and status-update promoted objects over one
 * storage-domain table. Reads are synchronous from the domain's in-memory state;
 * every write is durable before it returns.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/store
 */

import { randomUUID } from 'node:crypto'
import type { KvTable } from '@oasisailab/sponge-storage-domain'
import { SpaceObjectId } from './brand.ts'
import { normalizeTitle } from './space.ts'
import type { SpaceId } from './brand.ts'
import type { SpaceObject, SpaceObjectInput } from './types.ts'

/** The store's record key type, recovered from the object it holds. */
type Key = SpaceObject['id']

/**
 * Objects promoted into one or more Spaces, over a single `objects` table. The
 * table is keyed by object id and every record carries its `spaceId`, so
 * workspace isolation is a read filter rather than a separate medium.
 */
export class SpaceObjectStore {
  /**
   * @param table - the opened `objects` table.
   */
  constructor(private readonly table: KvTable<Key, SpaceObject>) {}

  /**
   * Objects of one Space, most recently updated first.
   * @param spaceId - the Space to list.
   * @returns a detached array of the Space's objects.
   */
  list(spaceId: SpaceId): readonly SpaceObject[] {
    return [...this.table.entries()]
      .filter(([, object]) => object.spaceId === spaceId)
      .map(([, object]) => object)
      .sort((left, right) => right.updatedAt - left.updatedAt)
  }

  /**
   * One object of one Space.
   * @param spaceId - the Space to read from.
   * @param id - the object id.
   * @returns the object, or `undefined` when it is absent or belongs to another Space.
   */
  get(spaceId: SpaceId, id: Key): SpaceObject | undefined {
    const object = this.table.get(id)
    return object !== undefined && object.spaceId === spaceId ? object : undefined
  }

  /**
   * The object of one Space matching a kind and title under the MVP's minimal
   * resolve comparison (case- and whitespace-normalized title equality).
   * @param spaceId - the Space to search.
   * @param kind - the object kind.
   * @param title - the title to match.
   * @returns the matching object, or `undefined` when none matches.
   */
  find(spaceId: SpaceId, kind: string, title: string): SpaceObject | undefined {
    const wanted = normalizeTitle(title)
    return this.list(spaceId).find(object => object.kind === kind && normalizeTitle(object.title) === wanted)
  }

  /**
   * Create one object durably.
   * @param spaceId - the owning Space.
   * @param input - the promoted fields.
   * @returns the stored object, including its generated id.
   */
  async create(spaceId: SpaceId, input: SpaceObjectInput): Promise<SpaceObject> {
    const object: SpaceObject = {
      id: SpaceObjectId(randomUUID()),
      spaceId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      status: input.status,
      origin: input.origin,
      updatedAt: input.origin.at,
    }
    await this.table.put(object.id, object)
    return object
  }

  /**
   * Replace one object's status durably. This is the MVP's only mutation: the
   * object keeps its identity, title, body, and origin.
   * @param spaceId - the owning Space.
   * @param id - the object id.
   * @param status - the new status.
   * @param at - epoch milliseconds of the update.
   * @returns the updated object, or `undefined` when no such object exists in the Space.
   */
  async updateStatus(spaceId: SpaceId, id: Key, status: string, at: number): Promise<SpaceObject | undefined> {
    const current = this.get(spaceId, id)
    if (current === undefined) return undefined
    const next: SpaceObject = { ...current, status, updatedAt: Math.max(at, current.updatedAt) }
    await this.table.put(id, next)
    return next
  }

  /**
   * Every stored object across all Spaces. Diagnostic surface for the package
   * invariant companion; product reads go through {@link list}.
   * @returns a detached array of every stored object.
   */
  all(): readonly SpaceObject[] {
    return [...this.table.entries()].map(([, object]) => object)
  }
}
