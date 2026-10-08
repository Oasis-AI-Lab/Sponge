/**
 * The plugin's contract is lifecycle and isolation: it observes a live
 * conversation, keeps its judgments bounded, replaces its detector from
 * configuration, gives every registration back on disposal, and writes nothing
 * to the conversation log. Each test below pins one of those.
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@oasisailab/sponge-cordis'
import { createAssistantMessage, createUserMessage } from '@oasisailab/sponge-llm'
import SessionStore, { SessionId } from '@oasisailab/sponge-session'
import type { Session } from '@oasisailab/sponge-session'
import MoveUpDetectorRuntime, { HUMAN_REVIEW_DETECTOR_ID, MoveUpDetectorId } from '../src/index.ts'
import type { Config, MoveUpDetector, MoveUpDetectorResult } from '../src/index.ts'
import { humanMessage, until } from './support.ts'

type PluginFiber = Awaited<ReturnType<Context['plugin']>>

interface Fixture {
  readonly ctx: Context
  readonly session: Session
  readonly runtime: MoveUpDetectorRuntime
  readonly fiber: PluginFiber
}

async function setup(config: Config = {}): Promise<Fixture> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  const fiber = await ctx.plugin(MoveUpDetectorRuntime, config)
  const session = ctx.sessions.create(SessionId('detector-live'))
  return { ctx, session, runtime: ctx.moveUpDetector, fiber }
}

/** A detector with no judgment worth reading, used to count dispatches. */
function countingDetector(counts: { calls: number }): MoveUpDetector {
  return {
    id: MoveUpDetectorId('counter'),
    detect(): MoveUpDetectorResult {
      counts.calls++
      return { decision: 'stay', reason: 'counted one dispatch' }
    },
  }
}

describe('move-up-detector plugin lifecycle', () => {
  it('observes human prompts and assistant messages without writing to the log', async () => {
    const { session, runtime } = await setup()
    const before = session.events.length
    session.append('user/message', humanMessage('NPC 的独立性可能影响玩家感知。'), { surfaceOp: 'append' })
    session.append('assistant/message', {
      turn: 1,
      step: 1,
      message: createAssistantMessage({
        content: [{ type: 'text', text: '这个判断可以拆成一个更明确的命题。' }],
        source: { provider: 'test', model: 'test' },
      }),
    }, { surfaceOp: 'append' })

    await until(() => runtime.recent().length === 2, 'two live observations')
    expect(runtime.recent().map(observation => observation.chunk.origin.role)).toEqual(['user', 'assistant'])
    expect(runtime.recent().map(observation => observation.chunk.origin.sessionId))
      .toEqual([session.id, session.id])
    // Shadow mode: the plugin appended nothing of its own.
    expect(session.events.length).toBe(before + 2)
  })

  it('ignores synthetic injected context and keeps observing after it', async () => {
    const { session, runtime } = await setup()
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'read AGENTS.md' }],
      source: { kind: 'plugin', plugin: 'agent-instructions' },
    }), { surfaceOp: 'append' })
    session.append('user/message', humanMessage('那我们就做一个 A/B 实验验证它。'), { surfaceOp: 'append' })

    await until(() => runtime.recent().length === 1, 'exactly one live observation')
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(runtime.recent().map(observation => observation.chunk.text))
      .toEqual(['那我们就做一个 A/B 实验验证它。'])
  })

  it('retains only the most recent observations within recentLimit', async () => {
    const { session, runtime } = await setup({ recentLimit: 2 })
    for (const text of ['第一条', '第二条', '第三条']) {
      session.append('user/message', humanMessage(text), { surfaceOp: 'append' })
    }

    await until(() => runtime.recent().length === 2, 'the bounded observation window')
    expect(runtime.recent().map(observation => observation.chunk.text)).toEqual(['第二条', '第三条'])
  })

  it('replaces the detector implementation from configuration alone', async () => {
    const { session, runtime } = await setup({ detectors: [HUMAN_REVIEW_DETECTOR_ID] })
    session.append('user/message', humanMessage('这个想法挺有意思。'), { surfaceOp: 'append' })

    await until(() => runtime.recent().length === 1, 'the configured detector judgment')
    expect(runtime.recent()[0]!.detector).toBe(HUMAN_REVIEW_DETECTOR_ID)
    expect(runtime.recent()[0]!.result.decision).toBe('ask')
  })

  it('owns each detector registration with the registering fiber', async () => {
    const probe: MoveUpDetector = {
      id: MoveUpDetectorId('probe'),
      detect: () => ({ decision: 'move-up', reason: 'probe implementation' }),
    }
    const { ctx, runtime } = await setup({ detectors: ['probe'] })
    const provider = await ctx.plugin({
      inject: ['moveUpDetector'],
      apply(providerCtx: Context): void {
        providerCtx.moveUpDetector.registerDetector(probe)
      },
    })
    expect(runtime.detectors()).toContain('probe')

    // Releasing twice is idempotent: the second call must not remove a later
    // registration that took the same id.
    const release = runtime.registerDetector({
      id: MoveUpDetectorId('second'),
      detect: () => ({ decision: 'stay', reason: 'second implementation' }),
    })
    release()
    release()
    expect(runtime.detectors()).not.toContain('second')

    await provider.dispose()
    expect(runtime.detectors()).not.toContain('probe')
    expect(runtime.detectors()).toContain('stub')
  })

  it('clears retained state and stops judging once the plugin is disposed', async () => {
    const counts = { calls: 0 }
    const { ctx, session, runtime, fiber } = await setup({ detectors: ['counter'] })
    runtime.registerDetector(countingDetector(counts))
    session.append('user/message', humanMessage('留下一条观察'), { surfaceOp: 'append' })
    await until(() => runtime.recent().length === 1, 'one observation before disposal')

    await fiber.dispose()
    expect(ctx.get('moveUpDetector')).toBeUndefined()
    expect(runtime.recent()).toEqual([])

    session.append('user/message', humanMessage('卸载后不应该再被观察'), { surfaceOp: 'append' })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(runtime.recent()).toEqual([])
    expect(counts.calls).toBe(1)
  })

  it('records nothing for a judgment still in flight at disposal', async () => {
    let started = false
    let release = (): void => {}
    const deferred: MoveUpDetector = {
      id: MoveUpDetectorId('deferred'),
      detect(): Promise<MoveUpDetectorResult> {
        started = true
        return new Promise((resolve) => {
          release = () => { resolve({ decision: 'stay', reason: 'released after disposal' }) }
        })
      },
    }
    const { session, runtime, fiber } = await setup({ detectors: ['deferred'] })
    runtime.registerDetector(deferred)
    session.append('user/message', humanMessage('开始一次判断'), { surfaceOp: 'append' })
    await until(() => started, 'the deferred detector to start')

    await fiber.dispose()
    release()
    await new Promise(resolve => setTimeout(resolve, 10))
    // The buffer is the same array it emptied at disposal, so a recorded late
    // judgment would reappear here.
    expect(runtime.recent()).toEqual([])
  })

  it('warns once for a configured detector with no implementation and keeps the others', async () => {
    const { session, runtime } = await setup({ detectors: ['absent', 'stub'] })
    session.append('user/message', humanMessage('第一条'), { surfaceOp: 'append' })
    session.append('user/message', humanMessage('第二条'), { surfaceOp: 'append' })

    await until(() => runtime.recent().length === 2, 'the remaining detector judgments')
    expect(runtime.recent().map(observation => observation.detector)).toEqual(['stub', 'stub'])
  })

  it('isolates a failing detector from the detectors configured beside it', async () => {
    let attempt = 0
    const failing: MoveUpDetector = {
      id: MoveUpDetectorId('failing'),
      detect(): MoveUpDetectorResult {
        attempt++
        // Both failure shapes must stay contained: a thrown Error and a value
        // that is not an Error at all.
        throw attempt === 1 ? new Error('detector exploded') : 'detector exploded without an Error'
      },
    }
    const { session, runtime } = await setup({ detectors: ['failing', 'stub'] })
    runtime.registerDetector(failing)
    session.append('user/message', humanMessage('第一次'), { surfaceOp: 'append' })
    session.append('user/message', humanMessage('第二次'), { surfaceOp: 'append' })

    await until(() => runtime.recent().length === 2, 'the survivor judgments')
    expect(attempt).toBe(2)
    expect(runtime.recent().every(observation => observation.detector === 'stub')).toBe(true)
  })

  it('rejects an empty or duplicate detector registration', async () => {
    const { runtime } = await setup()
    expect(() => runtime.registerDetector({
      id: MoveUpDetectorId(''),
      detect: () => ({ decision: 'stay', reason: 'never runs' }),
    })).toThrow(/detector id must not be empty/)
    expect(() => runtime.registerDetector({
      id: MoveUpDetectorId('stub'),
      detect: () => ({ decision: 'stay', reason: 'never runs' }),
    })).toThrow(/already registered/)
  })

  it('applies the documented defaults when constructed without a configuration object', () => {
    const ctx = new Context()
    const runtime = new MoveUpDetectorRuntime(ctx)
    expect(runtime.detectors()).toEqual(['stub', 'human-review'])
  })

  it.each<{ label: string; config: Config; failure: RegExp }>([
    { label: 'names no detector', config: { detectors: [] }, failure: /must name at least one detector/ },
    { label: 'names a blank id', config: { detectors: [' padded '] }, failure: /must be non-blank and trimmed/ },
    { label: 'repeats an id', config: { detectors: ['same', 'same'] }, failure: /must not repeat a detector id/ },
    // The loader schema admits any number at or above one; these two are the
    // values it accepts but no bound can use.
    { label: 'exceeds the safe integer range for the context window', config: { contextWindow: 2 ** 53 }, failure: /contextWindow must be a positive safe integer/ },
    { label: 'exceeds the safe integer range for the retention', config: { recentLimit: 2 ** 53 }, failure: /recentLimit must be a positive safe integer/ },
  ])('fails loading when configuration $label', async ({ config, failure }) => {
    const ctx = new Context()
    await expect(ctx.plugin(MoveUpDetectorRuntime, config)).rejects.toThrow(failure)
  })
})
