/**
 * Pack the Sponge Portal + Sandbox plugins as installable upstream-identity
 * packages for dsh-desktop (P1 path). The variant bundles live in each
 * package's `lib-upstream/` (built with DSH_BUILD_VARIANT=upstream); this
 * script stages a pack root per plugin with the upstream-facing manifest
 * (dsh.client inject rows, bundle patch, exports) and emits a .tgz that
 * `dsh plugin add <tgz>` can install into a Desktop profile.
 *
 * The pack roots and tarballs stay under plans/exec/desktop/artifacts so the
 * product packages/ tree and its gates are never touched.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const planRoot = resolve(here, '..')
const artifacts = join(planRoot, 'artifacts')
const repoRoot = resolve(planRoot, '..', '..', '..')

// execFileSync does not resolve .ps1 shims the way a shell does; route pnpm
// through corepack's .cmd shim when no plain pnpm executable exists. Sandbox
// shims often live under a path containing spaces (cmd.exe truncates the
// command at the first space), so any candidate with a space is skipped.
function findPnpm() {
  const candidates = [
    process.env.PNPM,
    join(repoRoot, 'node_modules', '.bin', 'pnpm.cmd'),
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (existsSync(candidate) && !candidate.includes(' ')) return { bin: candidate, args: [] }
  }
  const whereAll = (name) => {
    try {
      return execFileSync('where.exe', [name], { encoding: 'utf8' })
        .trim().split(/\r?\n/u).filter(Boolean)
    } catch {
      return []
    }
  }
  const corepack = whereAll('corepack.cmd').find(path => !path.includes(' '))
  if (corepack !== undefined) return { bin: corepack, args: ['pnpm'] }
  const pnpm = whereAll('pnpm.cmd').find(path => !path.includes(' '))
  if (pnpm !== undefined) return { bin: pnpm, args: [] }
  throw new Error('pack-plugins: cannot locate pnpm (set PNPM or run from the repo with corepack available)')
}

const PNPM = findPnpm()

const PLUGINS = [
  {
    id: 'ui-sponge-portal',
    name: '@oasisailab/sponge-client-ui-sponge-portal',
    rowId: 'ui-sponge-portal',
  },
  {
    id: 'ui-sponge-sandbox',
    name: '@oasisailab/sponge-client-ui-sponge-sandbox',
    rowId: 'ui-sponge-sandbox',
  },
]

// The client bundles require exactly these upstream module-table rows
// (verified against the built variant's require() set).
const UPSTREAM_INJECT = [
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-primitives',
]

function packOne(plugin) {
  const srcLib = join(repoRoot, 'packages', 'client', plugin.id, 'lib-upstream')
  if (!existsSync(srcLib)) {
    throw new Error(`${plugin.id}: lib-upstream missing — build the upstream variant first (pnpm exec tsdown --env.DSH_BUILD_FACE client --env.DSH_BUILD_VARIANT upstream)`)
  }
  const packRoot = join(artifacts, plugin.id)
  const libDir = join(packRoot, 'lib-upstream')
  rmSync(packRoot, { recursive: true, force: true })
  mkdirSync(libDir, { recursive: true })
  cpSync(srcLib, libDir, { recursive: true })

  writeFileSync(join(packRoot, 'cordis.patch.yml'), [
    '# Insert the Sponge bundle row into the Desktop profile composition.',
    '# The client-modules scan picks the installed package up by Loader entry,',
    '# reads its dsh.client declaration, and serves ./client into the graph.',
    '- insert:',
    `    - id: ${plugin.rowId}`,
    `      name: ${JSON.stringify(plugin.name)}`,
    '',
  ].join('\n'))

  writeFileSync(join(packRoot, 'package.json'), JSON.stringify({
    name: plugin.name,
    version: readPackageVersion(plugin.id),
    description: `Sponge ${plugin.id === 'ui-sponge-portal' ? 'Portal' : 'Sandbox'} plugin, upstream-identity variant for dsh-desktop`,
    type: 'module',
    main: 'lib-upstream/index.js',
    exports: {
      '.': './lib-upstream/index.js',
      './invariant': './lib-upstream/invariant.js',
      './client': './lib-upstream/client.js',
      './package.json': './package.json',
      './cordis.patch.yml': './cordis.patch.yml',
    },
    dsh: {
      client: {
        inject: [...UPSTREAM_INJECT],
        platform: 'web',
      },
      bundle: {
        patch: './cordis.patch.yml',
      },
    },
    files: ['cordis.patch.yml', 'lib-upstream/**'],
    peerDependencies: {
      '@deepseek-ai/dsh-client-store': '*',
      '@deepseek-ai/dsh-client-ui-primitives': '*',
      react: '18.3.1',
    },
    license: 'MIT',
  }, null, 2))

  // shell: true routes the command through cmd.exe, which splits arguments at
  // spaces; the pack destination contains spaces, so it is quoted explicitly.
  const tgz = execFileSync(PNPM.bin, [...PNPM.args, 'pack', '--pack-destination', JSON.stringify(artifacts)], {
    cwd: packRoot,
    encoding: 'utf8',
    // .cmd shims cannot spawn directly on Windows; let cmd.exe resolve them.
    shell: true,
  })
  const fileName = tgz.trim().split(/\r?\n/u).pop()
  if (typeof fileName !== 'string' || !fileName.endsWith('.tgz')) {
    throw new Error(`${plugin.id}: pnpm pack produced no tarball: ${tgz}`)
  }
  // pnpm prints the full destination path on the last line; fall back to a
  // bare name (pack destination unknown) only when the line is not a path.
  return fileName.includes('/') || fileName.includes('\\') ? fileName : join(artifacts, fileName)
}

function readPackageVersion(pluginId) {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, 'packages', 'client', pluginId, 'package.json'), 'utf8'),
  )
  if (typeof manifest.version !== 'string') throw new Error(`${pluginId}: no version`)
  return manifest.version
}

for (const plugin of PLUGINS) {
  const tgz = packOne(plugin)
  console.log(`packed ${plugin.name} -> ${tgz}`)
}
