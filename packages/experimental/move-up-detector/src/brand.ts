/**
 * Branded identity for one registered Move Up judgment implementation. The type
 * and its constructor share a module so a caller never needs a local alias to
 * avoid the value/type name collision.
 *
 * @module @oasisailab/sponge-experimental-move-up-detector/brand
 */

import type { Branded } from '@oasisailab/sponge-brand'

/**
 * Registry key of one Move Up judgment implementation. Branded so a detector id
 * cannot be passed where another registry key is expected.
 */
export type MoveUpDetectorId = Branded<'MoveUpDetectorId'>

/**
 * Brand one detector registry key.
 * @param value - the non-empty registry key a detector implementation declares.
 * @returns the same string, branded.
 */
export function MoveUpDetectorId(value: string): MoveUpDetectorId {
  return value as MoveUpDetectorId
}
