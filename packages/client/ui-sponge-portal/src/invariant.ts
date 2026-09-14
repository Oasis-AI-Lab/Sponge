/**
 * Package-owned invariant companion for `@oasisailab/sponge-client-ui-sponge-portal`.
 * @module @oasisailab/sponge-client-ui-sponge-portal/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@oasisailab/sponge-cordis'
import type { InvariantInstaller } from '@oasisailab/sponge-invariants'

const PACKAGE_NAME = '@oasisailab/sponge-client-ui-sponge-portal'

/** Cordis companion plugin name. */
export const name = 'client-ui-sponge-portal-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: a pure-consumer plugin registering presentational
 * components into two host-declared slots (the frame's `shell.page` page seat
 * and the sidebar's footer-action list) plus its own chain-routed main pages
 * and locale dictionaries — its inject face is stateless open/resume callbacks
 * and a startup destination; it emits no cordis events and owns no
 * cross-plugin mutable state beyond the exclusive route store it seats on
 * both of its own entries.
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
