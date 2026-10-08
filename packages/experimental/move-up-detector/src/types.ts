/**
 * Type-only vocabulary for the experimental Move Up detector: the candidate
 * chunk it consumes, the replaceable judgment boundary, the observation it
 * produces, and the deployment configuration. No runtime code lives here.
 *
 * @module @oasisailab/sponge-experimental-move-up-detector/types
 */

import type { SessionEvent, SessionId } from '@oasisailab/sponge-session'
import type { MoveUpDetectorId } from './brand.ts'

/**
 * The three candidate judgments a detector may reach. `stay` keeps the chunk as
 * conversation content, `move-up` proposes an independent Space object, and
 * `ask` defers a low-confidence candidate to the user.
 */
export type MoveUpDecision = 'stay' | 'move-up' | 'ask'

/** Conversation position one candidate chunk was derived from. */
export interface SemanticChunkOrigin {
  /** Session whose log the chunk came from. */
  readonly sessionId: SessionId
  /** Log sequence number of the conversation event the chunk was derived from. */
  readonly eventSeq: number
  /** Conversation role the chunk text came from. */
  readonly role: 'user' | 'assistant'
  /** Turn the source event belonged to, when the event carried one. */
  readonly turn?: number
}

/**
 * One candidate semantic unit awaiting judgment. It is deliberately just text
 * plus its conversation origin: `move-up-detector` does not claim a chunking
 * scheme, and a detector cannot tell a chunk apart from raw conversation text
 * without this wrapper.
 */
export interface SemanticChunk {
  /** Chunk text, derived from the source event without rewriting. */
  readonly text: string
  /** Where in the conversation the text came from. */
  readonly origin: SemanticChunkOrigin
}

/**
 * Read-only context for one judgment: what was recently said, and what already
 * exists in the Space. It carries no projection of Space object internals,
 * because no Space runtime exists yet.
 */
export interface MoveUpDetectorContext {
  /** Recent conversation events, oldest first, ending at the event the judged chunk came from. */
  readonly recentEvents: readonly SessionEvent[]
  /**
   * Identifiers of Space objects that already exist, for update-versus-create
   * resolution. The runtime passes none, because Sponge has no Space runtime to
   * read; a detector must treat an empty list as "existence unknown", not as
   * proof that nothing exists.
   */
  readonly spaceObjects: readonly string[]
}

/**
 * One detector's judgment of one chunk. Every field exists for observation of
 * detector behavior; none of them is a settled Space object model.
 */
export interface MoveUpDetectorResult {
  /** Which of the three candidate judgments the detector reached. */
  readonly decision: MoveUpDecision
  /** Short account of why the detector reached `decision`. */
  readonly reason: string
  /** Self-reported confidence, when the implementation estimates one. */
  readonly confidence?: number
  /**
   * Identifier of an existing Space object this chunk should update rather than
   * create. Absent means the judgment either creates nothing or creates a new
   * object; the plugin never acts on either.
   */
  readonly existingObject?: string
}

/**
 * One replaceable Move Up judgment implementation. A detector reads a chunk and
 * its context and returns a judgment; it never touches the conversation log or
 * any Space object.
 */
export interface MoveUpDetector {
  /** Registry key, recorded on every observation this detector produces. */
  readonly id: MoveUpDetectorId
  /**
   * Judge one candidate chunk.
   * @param chunk - the candidate unit under judgment.
   * @param context - recent conversation and current Space context.
   * @returns this detector's judgment, directly or as a promise.
   */
  detect(chunk: SemanticChunk, context: MoveUpDetectorContext): MoveUpDetectorResult | Promise<MoveUpDetectorResult>
}

/** One recorded judgment, retained in memory so a developer can inspect it. */
export interface MoveUpObservation {
  /** The judged chunk, exactly as it entered the judgment. */
  readonly chunk: SemanticChunk
  /** Detector that produced {@link result}. */
  readonly detector: MoveUpDetectorId
  /** What the detector judged. */
  readonly result: MoveUpDetectorResult
  /** Epoch milliseconds when the judgment settled. */
  readonly time: number
}

/**
 * Replaceable conversation-to-chunk boundary. The V0 implementation passes one
 * conversation message through as at most one chunk; a later chunker can split,
 * merge, or drop content without changing the detector boundary or the plugin.
 */
export interface SemanticChunker {
  /**
   * Produce the candidate chunks one conversation event exposes.
   * @param sessionId - session the event belongs to.
   * @param event - the appended conversation event, in log order.
   * @returns candidate chunks; empty when the event carries no conversation content.
   */
  chunk(sessionId: SessionId, event: SessionEvent): readonly SemanticChunk[]
}

/** Deployment configuration for the Move Up detector plugin. */
export interface Config {
  /** Registered detector ids to run per chunk, in order. */
  readonly detectors?: string[]
  /** Maximum recent conversation events supplied as judgment context. */
  readonly contextWindow?: number
  /** Maximum observations retained in memory for inspection. */
  readonly recentLimit?: number
}
