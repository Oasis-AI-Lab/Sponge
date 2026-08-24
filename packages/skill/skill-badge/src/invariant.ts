/**
 * Package-owned invariant companion for `@oasisailab/sponge-skill-badge`.
 * @module @oasisailab/sponge-skill-badge/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@oasisailab/sponge-cordis'
import type { InvariantInstaller } from '@oasisailab/sponge-invariants'

const PACKAGE_NAME = '@oasisailab/sponge-skill-badge'

/** Cordis companion plugin name. */
export const name = 'skill-badge-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package owns one immutable provider registration,
 * while the skill registry owns registration uniqueness and lifecycle checks.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
