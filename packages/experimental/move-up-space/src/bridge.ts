/**
 * Detect-to-promote bridge: subscribes to the conversation feed, judges each
 * candidate chunk through the detector seam, and turns the judgment into an
 * object action. `move-up` creates or updates an object, `ask` defers to the
 * user, `stay` does nothing.
 *
 * The bridge never appends to the session log synchronously inside the
 * `session/event` dispatch it is observing: `Session.append` rejects a reentrant
 * append, so every promotion runs on an asynchronous chain and appends only
 * after it settles.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/bridge
 */

import type { Session, SessionEvent } from '@oasisailab/sponge-session'
import { V0_SEMANTIC_CHUNKER } from '@oasisailab/sponge-experimental-move-up-detector'
import type {
  MoveUpDecision,
  MoveUpDetectorContext,
  MoveUpObservation,
  SemanticChunk,
} from '@oasisailab/sponge-experimental-move-up-detector'
import { classify } from './rule-detector.ts'
import { spaceIdForCwd, titleOf } from './space.ts'
import type { SpaceObjectStore } from './store.ts'
import type { SpaceId } from './brand.ts'

/** The judgment surface the bridge drives; the detector runtime satisfies it. */
export interface MoveUpJudgmentSource {
  /**
   * Judge one chunk.
   * @param chunk - the candidate unit.
   * @param context - recent conversation and current Space context.
   * @returns one observation per detector that judged the chunk.
   */
  observe(chunk: SemanticChunk, context: MoveUpDetectorContext): Promise<readonly MoveUpObservation[]>
}

/** Minimal logger surface the bridge needs. */
export interface BridgeLogger {
  /**
   * Report a contained failure.
   * @param message - the warning line.
   */
  warn(message: string): void
}

/**
 * Ask the user whether one candidate should be promoted. Resolves `true` when
 * the user approves.
 */
export type AskPromote = (input: {
  readonly title: string
  readonly body: string
  readonly kind: string
}) => Promise<boolean>

/** Construction inputs of {@link MoveUpBridge}. */
export interface BridgeOptions {
  /** The Space object store promotions write to. */
  readonly store: SpaceObjectStore
  /** The judgment surface. */
  readonly detector: MoveUpJudgmentSource
  /** Maximum recent conversation events supplied as judgment context. */
  readonly contextWindow: number
  /** Where contained failures are reported. */
  readonly logger: BridgeLogger
  /** User-confirmation surface for the `ask` branch; absent degrades to a warning. */
  readonly ask?: AskPromote
}

/** Render one failure without losing a non-Error throw. */
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Serializes judgments so objects are promoted in conversation order, and
 * contains every failure inside the chain so an unhandled rejection never
 * escapes into the conversation.
 */
export class MoveUpBridge {
  /** Tail of the judgment chain; every link settles. */
  private pending: Promise<void> = Promise.resolve()
  private stopped = false

  /**
   * @param options - store, judgment surface, bounds, and the optional asker.
   */
  constructor(private readonly options: BridgeOptions) {}

  /**
   * Observe one conversation event without blocking it.
   * @param session - the session the event belongs to.
   * @param event - the appended event, in log order.
   */
  observe(session: Session, event: SessionEvent): void {
    if (this.stopped) return
    const chunks = V0_SEMANTIC_CHUNKER.chunk(session.id, event)
    if (chunks.length === 0) return
    const spaceId = spaceIdForCwd(session.header.cwd)
    const context: MoveUpDetectorContext = {
      recentEvents: session.events.slice(-this.options.contextWindow),
      spaceObjects: this.options.store.list(spaceId).map(object => object.id),
    }
    for (const chunk of chunks) {
      this.pending = this.pending.then(
        () => this.judge(session, spaceId, chunk, context),
        () => undefined,
      )
    }
  }

  /**
   * Resolve after every queued judgment settles. Tests await this; the plugin
   * never blocks the conversation on it.
   * @returns resolution when the chain drains.
   */
  async settle(): Promise<void> {
    await this.pending
  }

  /** Stop accepting conversation; a judgment already in flight still finishes. */
  dispose(): void {
    this.stopped = true
  }

  private async judge(
    session: Session,
    spaceId: SpaceId,
    chunk: SemanticChunk,
    context: MoveUpDetectorContext,
  ): Promise<void> {
    // One containment boundary for the whole judgment: a detector failure, a
    // store write failure, and a rejected user question are all contained here
    // so none escapes the asynchronous chain and rejects a later link.
    try {
      const observations = await this.options.detector.observe(chunk, context)
      if (observations.some(observation => observation.result.decision === 'move-up')) {
        await this.promote(session, spaceId, chunk, 'move-up')
        return
      }
      if (observations.some(observation => observation.result.decision === 'ask')) {
        await this.defer(session, spaceId, chunk)
      }
    } catch (error: unknown) {
      this.options.logger.warn(`move-up-space: judgment failed: ${errorText(error)}`)
    }
  }

  /** Create or update the object a `move-up` judgment proposes, then log it. */
  private async promote(
    session: Session,
    spaceId: SpaceId,
    chunk: SemanticChunk,
    decision: MoveUpDecision,
  ): Promise<void> {
    const classification = classify(chunk.text)
    if (classification.decision === 'stay') return
    const { kind, status } = classification
    const title = titleOf(chunk.text)
    const existing = this.options.store.find(spaceId, kind, title)
    const at = Date.now()
    let objectId: string
    if (existing === undefined) {
      const created = await this.options.store.create(spaceId, {
        kind,
        title,
        body: chunk.text,
        status,
        origin: { sessionId: chunk.origin.sessionId, eventSeq: chunk.origin.eventSeq, at },
      })
      objectId = created.id
    } else {
      const updated = await this.options.store.updateStatus(spaceId, existing.id, status, at)
      objectId = updated?.id ?? existing.id
    }
    session.append('move-up/promoted', { objectId, kind, decision })
  }

  /** Defer an `ask` judgment to the user, promoting only on approval. */
  private async defer(session: Session, spaceId: SpaceId, chunk: SemanticChunk): Promise<void> {
    const ask = this.options.ask
    if (ask === undefined) {
      this.options.logger.warn(
        'move-up-space: an ask judgment was deferred but no user-questions provider is registered; no object was created',
      )
      return
    }
    const classification = classify(chunk.text)
    if (classification.decision === 'stay') return
    const approved = await ask({ title: titleOf(chunk.text), body: chunk.text, kind: classification.kind })
    if (approved) await this.promote(session, spaceId, chunk, 'ask')
  }
}
