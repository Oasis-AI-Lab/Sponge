// Proves the plugin is a real opt-in composition and not a hand-built context:
// a cordis.yml naming the package is booted through the real Loader, its config
// drives which detector runs, and unloading restores the pre-load state.
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@oasisailab/sponge-cordis'
import Loader from '@oasisailab/sponge-cordis-plugin-loader'
import Include from '@oasisailab/sponge-cordis-plugin-include'
import SessionStore, { SessionId } from '@oasisailab/sponge-session'
import MoveUpDetectorRuntime from '../src/index.ts'
import { humanMessage, until } from './support.ts'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

/**
 * Boot a cordis.yml carrying the given detector config block.
 * @param configLines - YAML lines nested under the plugin's `config:` key.
 * @returns the booted context.
 */
async function boot(configLines: readonly string[]): Promise<Context> {
  root = await mkdtemp(join(tmpdir(), 'dsh-move-up-detector-'))
  const configPath = join(root, 'cordis.yml')
  await writeFile(configPath, [
    "- name: '@oasisailab/sponge-session'",
    "- name: '@oasisailab/sponge-experimental-move-up-detector'",
    ...configLines.length > 0 ? ['  config:', ...configLines] : [],
    '',
  ].join('\n'))

  const ctx = new Context()
  context = ctx
  ctx.baseUrl = pathToFileURL(root).href + '/'
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  const modules = new Map<string, unknown>([
    ['@oasisailab/sponge-session', SessionStore],
    ['@oasisailab/sponge-experimental-move-up-detector', MoveUpDetectorRuntime],
  ])
  ctx.loader.internal = {
    version: 'v2',
    async import(specifier: string) {
      if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
      return modules.get(specifier)
    },
  } as unknown as NonNullable<typeof ctx.loader.internal>
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
  await ctx.loader.await()
  return ctx
}

describe('move-up-detector real Loader composition through cordis.yml', () => {
  it('observes a live conversation with the default configuration', async () => {
    const ctx = await boot([])
    const session = ctx.sessions.create(SessionId('loader-default'))
    session.append('user/message', humanMessage('NPC 的独立性可能影响玩家感知。'), { surfaceOp: 'append' })

    await until(() => ctx.moveUpDetector.recent().length === 1, 'the loaded plugin observation')
    expect(ctx.moveUpDetector.recent()[0]!.detector).toBe('stub')
    expect(ctx.moveUpDetector.recent()[0]!.result.decision).toBe('stay')
  }, 30_000)

  it('selects the detector implementation from the config block', async () => {
    const ctx = await boot(['    detectors: ["human-review"]'])
    const session = ctx.sessions.create(SessionId('loader-human-review'))
    session.append('user/message', humanMessage('那我们就做一个 A/B 实验验证它。'), { surfaceOp: 'append' })

    await until(() => ctx.moveUpDetector.recent().length === 1, 'the configured detector judgment')
    expect(ctx.moveUpDetector.recent()[0]!.detector).toBe('human-review')
    expect(ctx.moveUpDetector.recent()[0]!.result.decision).toBe('ask')
  }, 30_000)

  it('fails loading when the config block names no detector', async () => {
    // The detector list is self-contained, so misconfiguration fails at load
    // rather than at the first judgment.
    await expect(boot(['    detectors: []'])).rejects.toThrow(/must name at least one detector/)
  }, 30_000)

  it('restores the pre-load state when the composition unloads', async () => {
    const ctx = await boot([])
    expect(ctx.get('moveUpDetector')).toBeDefined()

    await ctx.fiber.dispose()
    context = undefined
    expect(ctx.get('moveUpDetector')).toBeUndefined()
  }, 30_000)
})
