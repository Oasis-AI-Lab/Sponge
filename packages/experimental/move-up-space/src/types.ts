/**
 * Type-only vocabulary of the Move Up MVP: the promoted object, its origin, and
 * the promotion input. No runtime code lives here.
 *
 * @module @oasisailab/sponge-experimental-move-up-space/types
 */

import type { SessionId } from '@oasisailab/sponge-session'
import type { MoveUpDecision } from '@oasisailab/sponge-experimental-move-up-detector'
import type { SpaceId, SpaceObjectId } from './brand.ts'

/**
 * Conversation position one promoted object came from. It is the object's
 * provenance: what was said, and where in the log, so a later reader can explain
 * why the object exists.
 */
export interface SpaceObjectOrigin {
  /** Session whose log the object was promoted from. */
  readonly sessionId: SessionId
  /** Log sequence number of the conversation event the object came from. */
  readonly eventSeq: number
  /** Epoch milliseconds when the promotion settled. */
  readonly at: number
}

/**
 * One object promoted out of a conversation into a Space.
 *
 * `kind` and `status` are open strings on purpose: the MVP instantiates
 * `hypothesis` and `decision` and writes no closed enum, because a closed kind
 * set would be a premature taxonomy. `status` is the object's only state field;
 * the MVP records `open`/`supported`/`refuted`/`dropped` for hypotheses and
 * `proposed`/`accepted`/`superseded` for decisions, but never validates them.
 */
export interface SpaceObject {
  /** Stable object identity. */
  readonly id: SpaceObjectId
  /** The Space this object belongs to (workspace-root namespace). */
  readonly spaceId: SpaceId
  /** Object kind: `hypothesis`, `decision`, or a future open value. */
  readonly kind: string
  /** Short phrase that can be referenced on its own. */
  readonly title: string
  /** The original semantic unit, verbatim. */
  readonly body: string
  /** Current state; the only mutable field. */
  readonly status: string
  /** Where the object was promoted from. */
  readonly origin: SpaceObjectOrigin
  /** Epoch milliseconds of the last write. */
  readonly updatedAt: number
}

/** The fields a promotion supplies when it creates a new object. */
export interface SpaceObjectInput {
  /** Object kind. */
  readonly kind: string
  /** Short referenceable phrase. */
  readonly title: string
  /** The original semantic unit, verbatim. */
  readonly body: string
  /** Initial state. */
  readonly status: string
  /** Provenance. */
  readonly origin: SpaceObjectOrigin
}

declare module '@oasisailab/sponge-session/types' {
  interface SessionEventMap {
    /**
     * One conversation chunk was promoted into a Space object by this plugin,
     * without a model request. Log-only: `deriveMessages()` ignores it, and it
     * carries no object content — the object store is authoritative for the
     * object's fields. It records that a promotion happened, the promoted
     * object's id and kind, and the detector decision that caused it, which is
     * the session log's answer to "why did that sentence become an object".
     */
    'move-up/promoted': { objectId: string; kind: string; decision: MoveUpDecision }
  }
}
