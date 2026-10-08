/**
 * The V0 chunker decides which logged events are conversation content at all,
 * so its exclusions are behavior, not implementation detail: synthetic injected
 * context and every non-message event must produce no chunk.
 */

import { describe, expect, it } from 'vitest'
import { createAssistantMessage, createUserMessage } from '@oasisailab/sponge-llm'
import { SessionId } from '@oasisailab/sponge-session'
import type { SessionEvent } from '@oasisailab/sponge-session'
import { V0_SEMANTIC_CHUNKER } from '../src/chunk.ts'

const SESSION = SessionId('chunker-session')

function userEvent(source: { kind: 'user' } | { kind: 'plugin'; plugin: string }, text: string): SessionEvent {
  return {
    type: 'user/message',
    seq: 1,
    time: 1,
    data: createUserMessage({ content: [{ type: 'text', text }], source }),
  } as SessionEvent
}

function assistantEvent(blocks: readonly { type: string; text?: string }[], turn = 2): SessionEvent {
  return {
    type: 'assistant/message',
    seq: 2,
    time: 2,
    data: {
      turn,
      step: 1,
      message: createAssistantMessage({
        content: blocks as never,
        source: { provider: 'test', model: 'test' },
      }),
    },
  } as SessionEvent
}

describe('V0 semantic chunker', () => {
  it('passes one human prompt through with its conversation origin', () => {
    expect(V0_SEMANTIC_CHUNKER.chunk(SESSION, userEvent({ kind: 'user' }, 'NPC 的独立性可能影响玩家感知。')))
      .toEqual([{
        text: 'NPC 的独立性可能影响玩家感知。',
        origin: { sessionId: SESSION, eventSeq: 1, role: 'user' },
      }])
  })

  it('passes assistant text through with its turn', () => {
    expect(V0_SEMANTIC_CHUNKER.chunk(SESSION, assistantEvent([{ type: 'text', text: '这个判断可以拆成命题。' }], 3)))
      .toEqual([{
        text: '这个判断可以拆成命题。',
        origin: { sessionId: SESSION, eventSeq: 2, role: 'assistant', turn: 3 },
      }])
  })

  it('joins several text blocks and ignores non-text blocks', () => {
    const chunks = V0_SEMANTIC_CHUNKER.chunk(SESSION, assistantEvent([
      { type: 'reasoning' },
      { type: 'text', text: '第一句' },
      { type: 'tool-call' },
      { type: 'text', text: '第二句' },
    ]))
    expect(chunks.map(chunk => chunk.text)).toEqual(['第一句\n第二句'])
  })

  it('produces no chunk for synthetic injected context', () => {
    expect(V0_SEMANTIC_CHUNKER.chunk(SESSION, userEvent({ kind: 'plugin', plugin: 'agent-instructions' }, 'read AGENTS.md')))
      .toEqual([])
  })

  it('produces no chunk for empty text', () => {
    expect(V0_SEMANTIC_CHUNKER.chunk(SESSION, userEvent({ kind: 'user' }, '   '))).toEqual([])
    expect(V0_SEMANTIC_CHUNKER.chunk(SESSION, assistantEvent([{ type: 'reasoning' }]))).toEqual([])
  })

  it('produces no chunk for a non-message event', () => {
    expect(V0_SEMANTIC_CHUNKER.chunk(SESSION, {
      type: 'turn/start',
      seq: 0,
      time: 0,
      data: { turn: 1 },
    } as SessionEvent)).toEqual([])
  })
})
