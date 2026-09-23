/**
 * Prepare a Desktop harness home with the Sponge Portal + Sandbox plugins
 * installed into its `desktop` profile (P1 path). This is the "install" half
 * of the one-command run: it writes settings, materializes the profile,
 * composes the plugin layers exactly as `verify-sponge-profile-boot.mjs`
 * verifies, and pre-stages the launcher markers that skip the Setup Wizard
 * and the crash-recovery flow, without booting or launching Electron.
 *
 * Usage: node prepare-desktop-profile.mjs <home-dir> [user-data-dir]
 */
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const planRoot = resolve(here, '..')
const repoRoot = resolve(planRoot, '..', '..', '..')
const artifacts = join(planRoot, 'artifacts')
const home = resolve(process.argv[2] ?? join(planRoot, 'artifacts', 'gui-home'))
const userData = resolve(process.argv[3] ?? join(planRoot, 'artifacts', 'gui-userdata'))

const desktopRoot = resolve(repoRoot, '..', 'dsh-desktop')
const desktopDir = join(desktopRoot, 'dsh-plugin-desktop')
if (!existsSync(join(desktopDir, 'lib', 'profile.js'))) {
  throw new Error(`prepare-desktop-profile: dsh-plugin-desktop build is missing at ${desktopDir}`)
}
const desktopRequire = createRequire(join(desktopDir, 'package.json'))
const { prepareDesktopProfile } = await import(pathToFileURL(join(desktopDir, 'lib', 'profile.js')).href)

const SPONGE_PLUGINS = [
  { id: 'ui-sponge-portal', name: '@oasisailab/sponge-client-ui-sponge-portal' },
  { id: 'ui-sponge-sandbox', name: '@oasisailab/sponge-client-ui-sponge-sandbox' },
]

rmSync(home, { recursive: true, force: true })
mkdirSync(home, { recursive: true })
writeFileSync(join(home, 'settings.yaml'), [
  'dsh-desktop:',
  '  mode: advanced',
  'agent-presets:',
  '  default: minimal',
  '',
].join('\n'))

const prepared = prepareDesktopProfile('1', home, process.platform)
const profileDir = prepared.profile.dir
for (const plugin of SPONGE_PLUGINS) {
  const source = join(artifacts, plugin.id)
  if (!existsSync(join(source, 'package.json'))) {
    throw new Error(`prepare-desktop-profile: pack root ${source} is missing (run pack-plugins.mjs first)`)
  }
  const target = join(profileDir, 'node_modules', plugin.name)
  mkdirSync(target, { recursive: true })
  cpSync(source, target, { recursive: true })
}
const manifestPath = join(profileDir, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const bundles = new Set(manifest.dsh.profile.bundles ?? [])
for (const plugin of SPONGE_PLUGINS) bundles.add(plugin.name)
manifest.dsh.profile.bundles = [...bundles]
writeFileSync(manifestPath, `${JSON.stringify(manifest, undefined, 2)}\n`)

const prepared2 = prepareDesktopProfile('1', home, process.platform)
const layers = prepared2.profile.layers.map(layer => layer.packageName)
for (const plugin of SPONGE_PLUGINS) {
  if (!layers.includes(plugin.name)) {
    throw new Error(`prepare-desktop-profile: ${plugin.name} did not compose a profile layer`)
  }
}

// Pre-stage launcher markers so the first launch skips the Setup Wizard and
// the crash-recovery window. The profile hash mirrors
// desktopSetupWizardProfileHash in dsh-plugin-desktop/setup-wizard-state.ts.
const finalProfileDir = prepared2.profile.dir
const profileHash = createHash('sha256').update(finalProfileDir).digest('hex')
const desktopVersion = JSON.parse(readFileSync(join(desktopDir, 'package.json'), 'utf8')).version
const upstream = JSON.parse(readFileSync(join(desktopRoot, 'upstream.json'), 'utf8'))
const packageName = basename(desktopDir)
const channel = Object.values(upstream.channels).find(candidate => candidate.package === packageName)
const dshVersion = channel?.runtimePackageVersion
if (typeof dshVersion !== 'string') {
  throw new Error(`prepare-desktop-profile: no upstream channel matches package ${packageName}`)
}
writeFileSync(join(userData, 'profile-selection', 'state.json'), JSON.stringify({
  version: 2,
  active: 'desktop',
}, undefined, 2))
const wizardStatePath = join(userData, 'profile-setup', profileHash, 'state.json')
mkdirSync(dirname(wizardStatePath), { recursive: true })
writeFileSync(wizardStatePath, JSON.stringify({
  version: 2,
  profileHash,
  outcome: 'skipped',
  desktopVersion,
  dshVersion,
  setupRevision: 1,
  recordedAt: new Date().toISOString(),
}, undefined, 2))
const activeRun = join(userData, 'crash-evidence', 'active-run.json')
if (existsSync(activeRun)) rmSync(activeRun, { force: true })

console.log(`prepared Sponge desktop profile at ${profileDir}`)
console.log(`user data: ${userData}`)
console.log(`launch: DSH_HOME=${JSON.stringify(home)} ${JSON.stringify(join(desktopDir, 'node_modules', 'electron', 'dist', 'electron.exe'))} ${JSON.stringify(join(desktopDir, 'lib', 'main.js'))} --user-data-dir=${JSON.stringify(userData)}`)
