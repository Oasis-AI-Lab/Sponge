/**
 * Shadow-mode Move Up detector plugin: it observes the conversation log, judges
 * candidate semantic chunks through registered detectors, and retains what it
 * judged. It creates, updates, and deletes no Space object, and it writes
 * nothing to the session log.
 *
 * @module @oasisailab/sponge-experimental-move-up-detector
 */

import { Service } from '@oasisailab/sponge-cordis'
import type { Context } from '@oasisailab/sponge-cordis'
import z from '@oasisailab/sponge-schemastery'
import type { Session, SessionEvent } from '@oasisailab/sponge-session'
import { V0_SEMANTIC_CHUNKER } from './chunk.ts'
import { humanReviewDetector } from './human-review-detector.ts'
import { MoveUpDetectorId } from './brand.ts'
import { stubDetector, STUB_DETECTOR_ID } from './stub-detector.ts'
import type {
  Config,
  MoveUpDetector,
  MoveUpDetectorContext,
  MoveUpObservation,
  SemanticChunk,
} from './types.ts'

export * from './brand.ts'
export type * from './types.ts'
export { V0_SEMANTIC_CHUNKER } from './chunk.ts'
export { STUB_DETECTOR_ID, stubDetector } from './stub-detector.ts'
export { HUMAN_REVIEW_DETECTOR_ID, humanReviewDetector } from './human-review-detector.ts'
export { MOVE_UP_CORPUS } from './corpus.ts'
export type { CorpusEntry } from './corpus.ts'
export { formatHarnessReport, runDetectorHarness } from './harness.ts'
export type { HarnessReport, HarnessSubject } from './harness.ts'

declare module '@oasisailab/sponge-cordis' {
  interface Context {
    moveUpDetector: MoveUpDetectorRuntime
  }
}

const DEFAULT_DETECTORS: readonly string[] = [STUB_DETECTOR_ID]
const DEFAULT_CONTEXT_WINDOW = 20
const DEFAULT_RECENT_LIMIT = 50

/** No-context default for a judgment that has no conversation or Space behind it. */
const NO_CONTEXT: MoveUpDetectorContext = { recentEvents: [], spaceObjects: [] }

/** Validate one positive safe-integer deployment bound. */
function positiveLimit(name: string, value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`move-up-detector: ${name} must be a positive safe integer`)
  }
  return value
}

/**
 * Validate the configured execution order.
 *
 * A blank id, a repeated id, or an empty list is a deployment mistake that would
 * otherwise show up only as judgments that silently never happen, so it fails at
 * load instead.
 */
function detectorOrder(value: readonly string[]): readonly MoveUpDetectorId[] {
  if (value.length === 0) throw new Error('move-up-detector: detectors must name at least one detector')
  const ids = value.map((id) => {
    if (id.length === 0 || id.trim() !== id) {
      throw new Error(`move-up-detector: detector id ${JSON.stringify(id)} must be non-blank and trimmed`)
    }
    return MoveUpDetectorId(id)
  })
  if (new Set(ids).size !== ids.length) throw new Error('move-up-detector: detectors must not repeat a detector id')
  return ids
}

/** Render one failure for a warning line without losing a non-Error throw. */
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Shadow-mode Move Up detector runtime.
 *
 * Loading it changes one thing: conversation chunks are judged and the
 * observations are retained in memory. It registers two built-in stub detectors
 * that implement no judgment, so the default deployment records only explicit
 * `stay` and `ask` outcomes.
 */
export class MoveUpDetectorRuntime extends Service {
  static Config: z<Config> = z.object({
    detectors: z.array(z.string()).default([...DEFAULT_DETECTORS]),
    contextWindow: z.number().step(1).min(1).default(DEFAULT_CONTEXT_WINDOW),
    recentLimit: z.number().step(1).min(1).default(DEFAULT_RECENT_LIMIT),
  })

  /** Detector implementations available to this runtime, by registry key. */
  private readonly registry = new Map<MoveUpDetectorId, MoveUpDetector>()
  /** Configured execution order, resolved once at load. */
  private readonly order: readonly MoveUpDetectorId[]
  /** Configured bound on the conversation context one judgment receives. */
  private readonly contextWindow: number
  /** Configured bound on {@link recent}. */
  private readonly limit: number
  /** Retained observations, oldest first. */
  private readonly observations: MoveUpObservation[] = []
  /** Configured ids already reported missing, so the warning stays one per id. */
  private readonly reportedMissing = new Set<MoveUpDetectorId>()
  /** Serializes asynchronous judgments so retained observations keep conversation order. */
  private pending: Promise<void> = Promise.resolve()
  private stopped = false

  /**
   * Create the runtime, register the built-in detectors, and start observing.
   * @param ctx - Cordis context that owns the service.
   * @param config - detector selection and observation bounds.
   * @throws if a bound is not a positive safe integer or the detector list is invalid.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'moveUpDetector')
    this.order = detectorOrder(config.detectors ?? DEFAULT_DETECTORS)
    this.contextWindow = positiveLimit('contextWindow', config.contextWindow ?? DEFAULT_CONTEXT_WINDOW)
    this.limit = positiveLimit('recentLimit', config.recentLimit ?? DEFAULT_RECENT_LIMIT)
    this.registerDetector(stubDetector)
    this.registerDetector(humanReviewDetector)
    ctx.on('session/event', (session, event) => { this.observeConversation(session, event) })
    ctx.effect(() => () => {
      this.stopped = true
      this.observations.length = 0
    }, 'moveUpDetector.observations()')
  }

  /**
   * Register one judgment implementation. The registration is owned by the
   * calling fiber, so unloading the registering plugin removes its detector.
   * @param detector - implementation to register.
   * @returns a disposer that removes exactly this registration.
   * @throws if the detector id is empty or already registered.
   */
  registerDetector(detector: MoveUpDetector): () => void {
    const id = detector.id
    if (id.length === 0) throw new Error('move-up-detector: a detector id must not be empty')
    if (this.registry.has(id)) throw new Error(`move-up-detector: detector "${id}" is already registered`)
    this.registry.set(id, detector)
    const release = (): void => {
      if (this.registry.get(id) === detector) this.registry.delete(id)
    }
    this.ctx.effect(() => release, `moveUpDetector.registerDetector(${JSON.stringify(id)})`)
    return release
  }

  /**
   * Registered detector ids, in registration order.
   * @returns the registry keys currently available to this runtime.
   */
  detectors(): readonly MoveUpDetectorId[] {
    return [...this.registry.keys()]
  }

  /**
   * Observations retained in memory, oldest first.
   * @returns a detached copy; later judgments never mutate a returned array.
   */
  recent(): readonly MoveUpObservation[] {
    return [...this.observations]
  }

  /**
   * Judge one candidate chunk with every configured detector and retain the
   * observations. Live conversation observation enters here too, so a manual
   * harness call exercises the production path.
   *
   * A detector is judged in isolation: one that throws or rejects produces no
   * observation for itself and logs a warning, while the detectors configured
   * beside it still run. A throwing detector therefore never hides the behavior
   * of the implementation being compared against it.
   *
   * @param chunk - candidate unit to judge.
   * @param context - recent conversation and Space context; defaults to empty.
   * @returns one observation per detector that judged the chunk, in configured order.
   */
  async observe(
    chunk: SemanticChunk,
    context: MoveUpDetectorContext = NO_CONTEXT,
  ): Promise<readonly MoveUpObservation[]> {
    const judged: MoveUpObservation[] = []
    for (const id of this.order) {
      const detector = this.registry.get(id)
      if (detector === undefined) {
        // Fail loud without spamming: a configured id with no provider means the
        // judgment silently does not happen, which the operator must know about.
        if (!this.reportedMissing.has(id)) {
          this.reportedMissing.add(id)
          this.ctx.logger.warn(`move-up-detector: configured detector "${id}" is not registered; no judgment ran for it`)
        }
        continue
      }
      try {
        const result = await detector.detect(chunk, context)
        judged.push({ chunk, detector: id, result, time: Date.now() })
      } catch (error: unknown) {
        this.ctx.logger.warn(`move-up-detector: detector "${id}" failed: ${errorText(error)}`)
      }
    }
    for (const observation of judged) this.record(observation)
    return judged
  }

  /** Retain one observation within the configured bound. */
  private record(observation: MoveUpObservation): void {
    if (this.stopped) return
    this.observations.push(observation)
    const overflow = this.observations.length - this.limit
    if (overflow > 0) this.observations.splice(0, overflow)
  }

  /**
   * Turn one conversation event into judgments without blocking the
   * conversation. Disposal stops recording and clears retained observations; a
   * judgment already in flight finishes without recording.
   */
  private observeConversation(session: Session, event: SessionEvent): void {
    const chunks = V0_SEMANTIC_CHUNKER.chunk(session.id, event)
    if (chunks.length === 0) return
    const context: MoveUpDetectorContext = {
      recentEvents: session.events.slice(-this.contextWindow),
      spaceObjects: [],
    }
    for (const chunk of chunks) {
      // Chaining keeps retained observations in conversation order, and an
      // unhandled rejection can never escape into the conversation.
      this.pending = this.pending.then(async () => { await this.observe(chunk, context) })
    }
  }
}

export default MoveUpDetectorRuntime
