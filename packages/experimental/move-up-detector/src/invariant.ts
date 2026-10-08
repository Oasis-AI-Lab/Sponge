/** Invariant companion for the Move Up detector runtime. @module @oasisailab/sponge-experimental-move-up-detector/invariant */

import type { Context } from '@oasisailab/sponge-cordis'
import type { InvariantFailure, InvariantInstaller } from '@oasisailab/sponge-invariants'
import type { MoveUpDetectorRuntime } from './index.ts'
import type { MoveUpDecision } from './types.ts'

const PACKAGE_NAME = '@oasisailab/sponge-experimental-move-up-detector'

/** Every decision a retained observation may carry. */
const DECISIONS: ReadonlySet<string> = new Set<MoveUpDecision>(['stay', 'move-up', 'ask'])

/** Cordis companion plugin name. */
export const name = 'move-up-detector-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * Check the relation between retained observations and the runtime that owns
 * them: every retained observation names a registered detector, a decision in
 * the three-value domain, a non-empty chunk text, and a non-empty reason.
 *
 * The retention bound is deliberately not re-checked: the runtime's single
 * writer already trims the buffer to the configured limit, so a check here could
 * never fail for a working runtime. What this companion does catch is drift the
 * runtime cannot see — a detector implementation unregistered while its
 * observations are still retained, and a result outside the decision domain that
 * a casting detector can return through a `never` assertion.
 *
 * Trigger: install time plus every dispatched session event, which is the feed
 * that can grow the buffer. A judgment is asynchronous, so an observation
 * recorded after the last conversation event — a direct `observe()` call from
 * the experimental harness — is validated at the next dispatched event rather
 * than at its own commit. That lag is this check's known coverage gap.
 */
function validate(runtime: MoveUpDetectorRuntime, fail: InvariantFailure): void {
  const retained = runtime.recent()
  const registered = runtime.detectors()
  for (const observation of retained) {
    if (observation.chunk.text.trim().length === 0) {
      fail('a retained observation carries an empty chunk text')
    }
    if (!DECISIONS.has(observation.result.decision)) {
      fail(`a retained observation carries unknown decision ${JSON.stringify(observation.result.decision)}`)
    }
    if (observation.result.reason.trim().length === 0) {
      fail('a retained observation carries an empty reason')
    }
    if (!registered.includes(observation.detector)) {
      fail(`a retained observation names unregistered detector ${JSON.stringify(observation.detector)}`)
    }
  }
}

/** Install the retained-observation relation check for loaded and newly observed state. */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  const runtime = ctx.moveUpDetector
  validate(runtime, fail)
  ctx.on('internal/dispatch', (_mode, eventName) => {
    if (eventName === 'session/event') validate(runtime, fail)
  }, { global: true })
}, { inject: ['moveUpDetector'] })

/**
 * Register the Move Up detector invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
