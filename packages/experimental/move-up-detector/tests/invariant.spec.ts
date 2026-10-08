/**
 * The invariant companion exists to catch drift the runtime cannot see: a
 * detector unregistered while its observations are still retained, and a result
 * outside the decision domain that a casting detector can return through a
 * `never` assertion. This suite owns its service topology explicitly, so the
 * Vitest-wide invariant host stays out of the way.
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@oasisailab/sponge-cordis'
import InvariantRegistry, { InvariantError } from '@oasisailab/sponge-invariants'
import SessionStore, { SessionId } from '@oasisailab/sponge-session'
import type { Session, SessionEvent } from '@oasisailab/sponge-session'
import MoveUpDetectorRuntime, { MoveUpDetectorId } from '../src/index.ts'
import type { Config, MoveUpDetector, SemanticChunk } from '../src/index.ts'
import * as DetectorInvariant from '../src/invariant.ts'
import { humanMessage, until } from './support.ts'

/** Any dispatched conversation event re-runs the retained-relation check. */
function dispatchEvent(): SessionEvent {
  return { type: 'turn/start', seq: 0, time: 0, data: { turn: 1 } } as SessionEvent
}

function chunk(text: string): SemanticChunk {
  return { text, origin: { sessionId: SessionId('invariant-chunk'), eventSeq: 0, role: 'user' } }
}

async function setup(config: Config = {}) {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(MoveUpDetectorRuntime, config)
  await ctx.plugin(InvariantRegistry, { enabled: true })
  await ctx.plugin(DetectorInvariant)
  const session = ctx.sessions.create(SessionId('invariant-session'))
  return { ctx, session, runtime: ctx.moveUpDetector }
}

describe('move-up-detector retained-observation invariants', () => {
  it('accepts a valid retained relation and ignores unrelated dispatches', async () => {
    const { ctx, session, runtime } = await setup()
    session.append('user/message', humanMessage('留下一条观察'), { surfaceOp: 'append' })
    await until(() => runtime.recent().length === 1, 'the live observation')

    expect(() => {
      ctx.emit('tools/change')
      ctx.emit('session/event', {} as Session, dispatchEvent())
    }).not.toThrow()
  })

  it('rejects a retained observation outside the decision domain', async () => {
    const invented: MoveUpDetector = {
      id: MoveUpDetectorId('invented'),
      detect: () => ({ decision: 'maybe', reason: 'invented outcome' }) as never,
    }
    const { ctx, runtime } = await setup({ detectors: ['invented'] })
    runtime.registerDetector(invented)
    await runtime.observe(chunk('那我们就做一个 A/B 实验验证它。'))

    expect(() => ctx.emit('session/event', {} as Session, dispatchEvent()))
      .toThrow(/unknown decision "maybe"/)
    expect(() => ctx.emit('session/event', {} as Session, dispatchEvent())).toThrow(InvariantError)
  })

  it('rejects a retained observation with an empty chunk text', async () => {
    const { ctx, runtime } = await setup()
    await runtime.observe(chunk('   '))

    expect(() => ctx.emit('session/event', {} as Session, dispatchEvent()))
      .toThrow(/empty chunk text/)
  })

  it('rejects a retained observation with an empty reason', async () => {
    const blank: MoveUpDetector = {
      id: MoveUpDetectorId('blank'),
      detect: () => ({ decision: 'stay', reason: '  ' }),
    }
    const { ctx, runtime } = await setup({ detectors: ['blank'] })
    runtime.registerDetector(blank)
    await runtime.observe(chunk('这个想法挺有意思。'))

    expect(() => ctx.emit('session/event', {} as Session, dispatchEvent()))
      .toThrow(/empty reason/)
  })

  it('rejects a retained observation naming a detector that was unregistered', async () => {
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
    await runtime.observe(chunk('NPC 的独立性可能影响玩家感知。'))
    await provider.dispose()

    expect(() => ctx.emit('session/event', {} as Session, dispatchEvent()))
      .toThrow(/unregistered detector "probe"/)
  })
})
