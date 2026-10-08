/**
 * The V0 conversation-to-chunk boundary: one human `user/message` or one
 * `assistant/message` becomes at most one chunk, passed through verbatim.
 *
 * This module is the seam a later chunker replaces. It owns one judgment the
 * detector boundary must not make for it: which logged events are conversation
 * content at all.
 *
 * @module @oasisailab/sponge-experimental-move-up-detector/chunk
 */

import type { ContentBlock } from '@oasisailab/sponge-llm'
import type { SessionEvent, SessionId } from '@oasisailab/sponge-session'
import type { SemanticChunk, SemanticChunker } from './types.ts'

/** Join a message's text blocks; non-text blocks carry no conversation prose. */
function textOf(blocks: readonly ContentBlock[]): string {
  return blocks
    .flatMap(block => block.type === 'text' ? [block.text] : [])
    .join('\n')
    .trim()
}

/**
 * V0 chunker: pass-through, message-granular.
 *
 * A `user/message` event carries both human prompts and synthetic injected
 * context — file-change notices, AGENTS.md, skill content, goal continuation
 * rounds — and only `source.kind === 'user'` is conversation a person had. The
 * other sources are system plumbing, so they produce no chunk. Assistant text is
 * conversation too: a hypothesis first stated by the agent is as eligible as one
 * stated by the user.
 */
export const V0_SEMANTIC_CHUNKER: SemanticChunker = {
  chunk(sessionId: SessionId, event: SessionEvent): readonly SemanticChunk[] {
    switch (event.type) {
      case 'user/message': {
        if (event.data.source.kind !== 'user') return []
        const text = textOf(event.data.content)
        return text.length === 0
          ? []
          : [{ text, origin: { sessionId, eventSeq: event.seq, role: 'user' } }]
      }
      case 'assistant/message': {
        const text = textOf(event.data.message.content)
        return text.length === 0
          ? []
          : [{
            text,
            origin: { sessionId, eventSeq: event.seq, role: 'assistant', turn: event.data.turn },
          }]
      }
      // Every other event type, including types contributed by plugins this
      // package does not know, carries no conversation content.
      default:
        return []
    }
  },
}
