/**
 * Package-owned invariant companion for the Move Up space plugin. It checks the
 * one relation the promotion bridge cannot see from inside its own write: that
 * every `move-up/promoted` session event names an object the authoritative
 * `space` domain actually holds, with the kind the event claims.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/invariant
 */

import type { Context } from '@oasisailab/sponge-cordis'
import type { Session, SessionEvent } from '@oasisailab/sponge-session'
import type { InvariantFailure, InvariantInstaller } from '@oasisailab/sponge-invariants'
import type { MoveUpDecision } from '@oasisailab/sponge-experimental-move-up-detector'
// Loads the `move-up/promoted` SessionEventMap merge this companion narrows on.
import type {} from './types.ts'

const PACKAGE_NAME = '@oasisailab/sponge-experimental-move-up-space'

/** Domain and table the bridge writes promoted objects to. */
const DOMAIN = 'space'
const TABLE = 'objects'

/** Every decision a `move-up/promoted` event may carry. */
const DECISIONS: ReadonlySet<string> = new Set<MoveUpDecision>(['stay', 'move-up', 'ask'])

/** Cordis companion plugin name. */
export const name = 'move-up-space-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/** One stored object as the invariant reads it back, keyed only by what it checks. */
interface StoredObject {
  readonly kind?: unknown
}

/**
 * Validate one dispatched session event against the Space domain. Only a
 * `move-up/promoted` event is checked: its object must exist in the domain the
 * bridge wrote it to, and the event's kind must agree with the stored kind, so a
 * promotion event and the object it names can never disagree.
 * @param ctx - context carrying the storage-domain facility.
 * @param event - the dispatched session event.
 * @param fail - invariant failure reporter.
 */
function validateEvent(ctx: Context, event: SessionEvent, fail: InvariantFailure): void {
  if (event.type !== 'move-up/promoted') return
  const { objectId, kind, decision } = event.data
  if (objectId.length === 0) fail('a move-up/promoted event carries an empty objectId')
  if (kind.length === 0) fail('a move-up/promoted event carries an empty kind')
  if (!DECISIONS.has(decision)) {
    fail(`a move-up/promoted event carries unknown decision ${JSON.stringify(decision)}`)
  }
  const domain = ctx.storageDomain.get(DOMAIN)
  /* v8 ignore next 2 -- the domain is open for every event the bridge can emit; this guards a teardown race */
  if (domain === undefined) return
  const stored = domain.table(TABLE).get(objectId) as StoredObject | undefined
  if (stored === undefined) {
    fail(`a move-up/promoted event names object ${JSON.stringify(objectId)} absent from the space domain`)
  } else if (stored.kind !== kind) {
    fail(
      `a move-up/promoted event kind ${JSON.stringify(kind)} disagrees with the stored kind `
      + `${JSON.stringify(stored.kind)}`,
    )
  }
}

/**
 * Install the promotion-event relation check.
 *
 * Trigger: every dispatched `session/event`. The bridge writes the object
 * durably before it appends the event, so the domain already holds the object
 * when this runs.
 */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  ctx.on('internal/dispatch', (_mode, eventName, args) => {
    if (eventName !== 'session/event') return
    const [, event] = args as [Session, SessionEvent]
    validateEvent(ctx, event, fail)
  }, { global: true })
}, { inject: ['storageDomain'] })

/**
 * Register the Move Up space invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
