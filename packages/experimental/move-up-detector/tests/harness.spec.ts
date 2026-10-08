/**
 * The experimental harness is the plugin's development entry: it feeds a fixed
 * corpus to whatever detector configuration is loaded and reports each judgment.
 * These tests pin that the harness judges through the production path, resolves
 * implementations from configuration, and renders what a developer must see.
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@oasisailab/sponge-cordis'
import { SessionId } from '@oasisailab/sponge-session'
import MoveUpDetectorRuntime, {
  MOVE_UP_CORPUS,
  MoveUpDetectorId,
  formatHarnessReport,
  runDetectorHarness,
} from '../src/index.ts'
import type {
  Config,
  MoveUpDetector,
  MoveUpDetectorContext,
  MoveUpDetectorResult,
  SemanticChunk,
} from '../src/index.ts'

/** Reads the Space context, so the harness's context plumbing is observable. */
const spaceAwareDetector: MoveUpDetector = {
  id: MoveUpDetectorId('space-aware'),
  detect(chunk: SemanticChunk, context: MoveUpDetectorContext): MoveUpDetectorResult {
    const existing = context.spaceObjects[0]
    return {
      decision: 'move-up',
      reason: `judged ${chunk.text.length} characters`,
      confidence: 0.5,
      ...existing === undefined ? {} : { existingObject: existing },
    }
  },
}

async function runtimeWith(config: Config = {}): Promise<{ ctx: Context; runtime: MoveUpDetectorRuntime }> {
  const ctx = new Context()
  await ctx.plugin(MoveUpDetectorRuntime, config)
  return { ctx, runtime: ctx.moveUpDetector }
}

describe('move-up-detector harness', () => {
  it('judges every corpus entry through the default stub configuration', async () => {
    const { runtime } = await runtimeWith()
    const reports = await runDetectorHarness(runtime)

    expect(reports.map(report => report.label)).toEqual(MOVE_UP_CORPUS.map(entry => entry.label))
    expect(reports[0]!.chunk.text).toBe(MOVE_UP_CORPUS[0]!.text)
    expect(reports.flatMap(report => report.observations.map(observation => observation.detector)))
      .toEqual(MOVE_UP_CORPUS.map(() => 'stub'))
    expect(reports.flatMap(report => report.observations.map(observation => observation.result.decision)))
      .toEqual(MOVE_UP_CORPUS.map(() => 'stay'))
    // An implementation that reports neither a confidence nor an update target
    // still renders one readable line per judgment.
    const rendered = formatHarnessReport(reports)
    expect(rendered).toContain('stub')
    expect(rendered).not.toContain('confidence')
    expect(rendered).not.toContain('->')
  })

  it('runs every configured detector in configured order', async () => {
    const { runtime } = await runtimeWith({ detectors: ['stub', 'human-review'] })
    const reports = await runDetectorHarness(runtime, MOVE_UP_CORPUS.slice(0, 2))

    expect(reports).toHaveLength(2)
    expect(reports[0]!.observations.map(observation => `${observation.detector}:${observation.result.decision}`))
      .toEqual(['stub:stay', 'human-review:ask'])
  })

  it('feeds each entry its Space context and renders update targets and confidence', async () => {
    const { runtime } = await runtimeWith({ detectors: ['space-aware'] })
    runtime.registerDetector(spaceAwareDetector)
    const reports = await runDetectorHarness(runtime)

    const update = reports.find(report => report.label === 'existing-experiment')!
    expect(update.observations[0]!.result.existingObject).toBe('Experiment E17')

    const rendered = formatHarnessReport(reports)
    expect(rendered).toContain('space-aware')
    expect(rendered).toContain('-> Experiment E17')
    expect(rendered).toContain('(confidence 0.5)')
    expect(rendered).toContain('6 entries')
    // The entry with no existing object renders no update target.
    expect(formatHarnessReport([reports[0]!])).not.toContain('->')
  })

  it('reports that no detector ran when the configured id has no implementation', async () => {
    const { runtime } = await runtimeWith({ detectors: ['absent'] })
    const reports = await runDetectorHarness(runtime, [{ label: 'solo', text: '随便说点什么' }])

    expect(reports).toHaveLength(1)
    expect(reports[0]!.observations).toEqual([])
    expect(formatHarnessReport(reports)).toContain('no detector ran')
  })

  it('judges a chunk fed directly, with no conversation context', async () => {
    const { runtime, ctx } = await runtimeWith()
    const chunk: SemanticChunk = {
      text: '那就测试 NPC independence。',
      origin: { sessionId: SessionId('manual-feed'), eventSeq: 0, role: 'user' },
    }

    const observations = await runtime.observe(chunk)
    expect(observations).toHaveLength(1)
    expect(runtime.recent()).toEqual(observations)
    // The service is reachable from the context that loaded the plugin.
    expect(ctx.moveUpDetector.detectors()).toContain('stub')
  })
})
