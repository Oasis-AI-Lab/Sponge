/**
 * Space identity and object-title derivation for the Move Up MVP.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/space
 */

import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { SpaceId } from './brand.ts'

/** Namespace used by a session that carries no working directory. */
export const DEFAULT_SPACE_ID: SpaceId = SpaceId('workspace-default')

/** Longest title kept from a promoted chunk before it is truncated. */
const MAX_TITLE_LENGTH = 80

/**
 * Derive the MVP Space id from a session's working directory.
 *
 * The MVP Space is one workspace root: every session whose `cwd` resolves to the
 * same directory shares one object namespace, and no Space registry is invented.
 * The path is hashed so the id stays short and stable, and separators are
 * normalized so the same tree maps to one id on either platform.
 *
 * @param cwd - the session header's absolute working directory, when it has one.
 * @returns the workspace namespace id, or {@link DEFAULT_SPACE_ID} without a `cwd`.
 */
export function spaceIdForCwd(cwd: string | undefined): SpaceId {
  if (cwd === undefined || cwd.trim().length === 0) return DEFAULT_SPACE_ID
  const canonical = resolve(cwd).replace(/\\/g, '/')
  return SpaceId(`ws-${createHash('sha256').update(canonical).digest('hex').slice(0, 16)}`)
}

/**
 * Derive an object title from a promoted chunk: its first non-empty line,
 * truncated to a short referenceable phrase.
 * @param text - the chunk text.
 * @returns the title.
 */
export function titleOf(text: string): string {
  const line = text.split(/\r?\n/).map(part => part.trim()).find(part => part.length > 0) ?? text.trim()
  return line.length > MAX_TITLE_LENGTH ? `${line.slice(0, MAX_TITLE_LENGTH - 1)}…` : line
}

/**
 * Normalize a title for the MVP's minimal resolve comparison. Case and
 * whitespace are the only equivalence the MVP claims; semantic equivalence
 * remains open.
 * @param title - the title to normalize.
 * @returns the comparison form.
 */
export function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim().toLowerCase()
}
