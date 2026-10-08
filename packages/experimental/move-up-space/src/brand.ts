/**
 * Branded identities of the Move Up MVP object store. Each type and its
 * constructor share a module so a caller never needs a local alias to avoid the
 * value/type name collision.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/brand
 */

import type { Branded } from '@oasisailab/sponge-brand'

/**
 * Stable identity of one promoted Space object. Branded so an object id cannot
 * be passed where another registry key is expected.
 */
export type SpaceObjectId = Branded<'SpaceObjectId'>

/**
 * Brand one Space object id.
 * @param value - the opaque object id.
 * @returns the same string, branded.
 */
export function SpaceObjectId(value: string): SpaceObjectId {
  return value as SpaceObjectId
}

/**
 * Identity of one MVP Space. A Space is a workspace-root object namespace, not
 * the information space of the concept record.
 */
export type SpaceId = Branded<'SpaceId'>

/**
 * Brand one Space id.
 * @param value - the derived namespace id.
 * @returns the same string, branded.
 */
export function SpaceId(value: string): SpaceId {
  return value as SpaceId
}
