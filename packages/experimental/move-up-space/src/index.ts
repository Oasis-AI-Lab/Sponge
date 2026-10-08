/**
 * Move Up MVP plugin: the smallest closed loop that turns a conversation chunk
 * into a durable Space object and lets a later interaction recall it.
 *
 * It composes four parts over existing seams, defining no new bus or prompt:
 * the shadow Move Up detector judges chunks, a bridge turns a judgment into an
 * object action, a storage-domain table persists objects, and two tools recall
 * them. Loading it registers a rule detector on `ctx.moveUpDetector`, opens the
 * `space` domain, subscribes to `session/event`, and registers `space_recall`
 * and `space_list` on `ctx.tools`; unloading removes all four.
 *
 * The deployment must name this package's rule detector in the detector
 * plugin's `detectors` config (`detectors: [rule]`), because that config
 * selects which registered detector the runtime runs.
 *
 * @module @oasisailab/sponge-experimental-move-up-space
 */

import type { Context } from '@oasisailab/sponge-cordis'
import z from '@oasisailab/sponge-schemastery'
import type { UserQuestionService } from '@oasisailab/sponge-user-questions'
import { MoveUpBridge } from './bridge.ts'
import type { AskPromote } from './bridge.ts'
import { ruleDetector } from './rule-detector.ts'
import { spaceDomainSpec } from './spec.ts'
import { SpaceObjectStore } from './store.ts'
import { spaceListTool, spaceRecallTool } from './tools.ts'

export { RULE_DETECTOR_ID, ruleDetector, classify } from './rule-detector.ts'
export type { RuleClassification } from './rule-detector.ts'
export { SpaceObjectStore } from './store.ts'
export { MoveUpBridge } from './bridge.ts'
export type { AskPromote, BridgeLogger, BridgeOptions, MoveUpJudgmentSource } from './bridge.ts'
export { DEFAULT_SPACE_ID, normalizeTitle, spaceIdForCwd, titleOf } from './space.ts'
export { spaceDomainSpec, spaceObjectOriginSchema, spaceObjectSchema } from './spec.ts'
export { SpaceId, SpaceObjectId } from './brand.ts'
export type { SpaceId as SpaceIdType, SpaceObjectId as SpaceObjectIdType } from './brand.ts'
export type * from './types.ts'

/** Cordis plugin name. */
export const name = 'move-up-space'
/** Seams this plugin composes: object storage, the tool registry, and the detector runtime. */
export const inject = ['storageDomain', 'tools', 'moveUpDetector']

/** Default bound on the recent conversation events a judgment receives. */
const DEFAULT_CONTEXT_WINDOW = 20
/** Default bound on the objects one `space_recall` call returns. */
const DEFAULT_MAX_RECALLED = 20

/** The option label that approves a promotion. */
const PROMOTE_LABEL = 'Promote'
/** The option label that keeps the candidate in the conversation. */
const KEEP_LABEL = 'Keep in conversation'

/** Deployment configuration for the Move Up space plugin. */
export interface Config {
  /** Maximum recent conversation events supplied as judgment context. */
  readonly contextWindow?: number
  /** Maximum objects one `space_recall` call returns. */
  readonly maxRecalled?: number
}

/** Loader validation for the deployment's observation and recall bounds. */
export const Config: z<Config> = z.object({
  contextWindow: z.number().step(1).min(1).default(DEFAULT_CONTEXT_WINDOW),
  maxRecalled: z.number().step(1).min(1).default(DEFAULT_MAX_RECALLED),
})

/**
 * Validate one deployment bound at the configuration boundary. A non-positive
 * or fractional bound is a deployment mistake that would otherwise silently
 * change how much context a judgment sees or how many objects a recall returns.
 * @param name - config field name, named in the failure.
 * @param value - the configured bound.
 * @returns the validated bound.
 */
function positiveLimit(name: string, value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`move-up-space: ${name} must be a positive safe integer`)
  }
  return value
}

/**
 * Build the `ask` branch over the optional user-questions service. Absent, the
 * bridge degrades an `ask` judgment to a warning instead of promoting.
 * @param ctx - the plugin context.
 * @returns an asker, or `undefined` when no user-questions service is composed.
 */
function askerOf(ctx: Context): AskPromote | undefined {
  const userQuestions: UserQuestionService | undefined = ctx.get('userQuestions')
  if (userQuestions === undefined) return undefined
  return async ({ title, body, kind }) => {
    const answer = await userQuestions.ask({
      questions: [{
        id: 'move-up-promote',
        header: 'Move Up',
        question: `Promote this ${kind} into the Space?`,
        detail: `${title}\n\n${body}`,
        options: [{ label: PROMOTE_LABEL }, { label: KEEP_LABEL }],
      }],
    })
    const selected = answer.answers.find(item => item.id === 'move-up-promote')?.selected ?? []
    return selected.includes(PROMOTE_LABEL)
  }
}

/**
 * Compose the Move Up closed loop: register the rule detector, open the Space
 * object domain, start the detect-to-promote bridge, and register the recall
 * tools.
 * @param ctx - the plugin context.
 * @param config - the deployment's observation and recall bounds.
 * @returns resolution after the domain is open and every contribution is owned.
 */
export async function apply(ctx: Context, config: Config = {}): Promise<void> {
  const contextWindow = positiveLimit('contextWindow', config.contextWindow ?? DEFAULT_CONTEXT_WINDOW)
  const maxRecalled = positiveLimit('maxRecalled', config.maxRecalled ?? DEFAULT_MAX_RECALLED)

  const domain = await ctx.storageDomain.open(spaceDomainSpec)
  ctx.effect(() => () => domain.close(), 'move-up-space.domainClose')
  const store = new SpaceObjectStore(domain.table('objects'))

  ctx.moveUpDetector.registerDetector(ruleDetector)

  const ask = askerOf(ctx)
  const bridge = new MoveUpBridge({
    store,
    detector: ctx.moveUpDetector,
    contextWindow,
    logger: ctx.logger,
    ...(ask === undefined ? {} : { ask }),
  })
  ctx.effect(() => () => bridge.dispose(), 'move-up-space.bridgeDispose')
  ctx.on('session/event', (session, event) => { bridge.observe(session, event) })

  ctx.tools.register(spaceRecallTool(store, maxRecalled))
  ctx.tools.register(spaceListTool(store))
}
