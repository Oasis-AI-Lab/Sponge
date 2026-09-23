/**
 * Headless smoke: install the Sponge Portal + Sandbox upstream-identity
 * packages into a freshly prepared Desktop profile and boot the assembled
 * Web graph, then assert the renderer module table contains both plugins.
 *
 * The profile assembly, Loader graph, webserver, renderer authentication and
 * client-modules scan all run exactly as a real Desktop generation would —
 * only the Electron window is stubbed (desktopRuntime host service).
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const planRoot = resolve(here, '..')
const repoRoot = resolve(planRoot, '..', '..', '..')
const artifacts = join(planRoot, 'artifacts')

// Desktop checkout: sibling of the Sponge repo. Verified before use.
const desktopRoot = resolve(repoRoot, '..', 'dsh-desktop')
const desktopDir = join(desktopRoot, 'dsh-plugin-desktop')
if (!existsSync(join(desktopDir, 'package.json')) || !existsSync(join(desktopDir, 'lib', 'index.js'))) {
  throw new Error(`verify-sponge-profile-boot: dsh-plugin-desktop build is missing at ${desktopDir} (run its \`yarn run build\` first)`)
}
const desktopRequire = createRequire(join(desktopDir, 'package.json'))
const desktopLib = (subpath) => pathToFileURL(join(desktopDir, 'lib', subpath)).href

const { boot } = await import(pathToFileURL(desktopRequire.resolve('@deepseek-ai/dsh-app-boot')).href)
const { provideCmdline } = await import(pathToFileURL(desktopRequire.resolve('@deepseek-ai/dsh-cmdline')).href)
const { createLaunchEnvironmentSnapshot, DSH_LAUNCH_ENVIRONMENT_KEY } = await import(
  pathToFileURL(desktopRequire.resolve('@deepseek-ai/dsh-launch-environment')).href,
)
const { DESKTOP_SETTINGS_NAMESPACE } = await import(desktopLib('index.js'))
const { installDesktopPnpmRuntime } = await import(desktopLib('desktop-runtime-environment.js'))
const { installProfilePackageResolver } = await import(desktopLib('module-resolution.js'))
const { prepareDesktopProfile } = await import(desktopLib('profile.js'))
const { DesktopProfileService } = await import(desktopLib('profile-service.js'))

const BIN_NAME = 'dsh-plugin-desktop'
const SPONGE_PLUGINS = [
  { id: 'ui-sponge-portal', name: '@oasisailab/sponge-client-ui-sponge-portal' },
  { id: 'ui-sponge-sandbox', name: '@oasisailab/sponge-client-ui-sponge-sandbox' },
]

let ordinaryBrowserEnabled = false
const BROWSER_ACCESS = Object.freeze({
  get ordinaryBrowserEnabled() { return ordinaryBrowserEnabled },
  rendererHeader: Object.freeze({
    name: 'x-dsh-desktop-renderer',
    value: Buffer.alloc(32, 4).toString('base64url'),
  }),
  setOrdinaryBrowserEnabled(enabled) { ordinaryBrowserEnabled = enabled },
})
const LAN_HTTPS_SNAPSHOT = Object.freeze({
  state: 'inactive', actualPort: null, addresses: Object.freeze([]),
  caFingerprint: null, errorCode: null,
})
const LAN_HTTPS = Object.freeze({
  caCertificate: null,
  attach() {},
  snapshot() { return LAN_HTTPS_SNAPSHOT },
  async setEnabled() { return LAN_HTTPS_SNAPSHOT },
  async stop() { return LAN_HTTPS_SNAPSHOT },
})

const home = mkdtempSync(join(tmpdir(), 'sponge-desktop-profile-'))
let ctx
let releasePackageResolver
let pnpmRuntime
let mountedSpec
let nativeThemeSource = 'system'

try {
  writeFileSync(join(home, 'settings.yaml'), [
    'dsh-desktop:',
    '  mode: advanced',
    'agent-presets:',
    '  default: minimal',
    '',
  ].join('\n'))

  // First pass materializes the profile; the plugin packages and manifest
  // bundles are written after, then a second pass composes their layers.
  const prepared = prepareDesktopProfile('1', home, 'win32')
  const profileDir = prepared.profile.dir
  for (const plugin of SPONGE_PLUGINS) {
    const source = join(artifacts, plugin.id)
    if (!existsSync(join(source, 'package.json'))) {
      throw new Error(`verify-sponge-profile-boot: pack root ${source} is missing (run pack-plugins.mjs first)`)
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

  const prepared2 = prepareDesktopProfile('1', home, 'win32')
  const profileLayers = prepared2.profile.layers.map(layer => layer.packageName)
  for (const plugin of SPONGE_PLUGINS) {
    if (!profileLayers.includes(plugin.name)) {
      throw new Error(`verify-sponge-profile-boot: ${plugin.name} did not compose a profile layer`)
    }
  }

  const packageRoot = new URL('./', pathToFileURL(join(desktopDir, 'package.json')))
  const pnpmBinPath = fileURLToPath(new URL('node_modules/pnpm/bin/pnpm.mjs', packageRoot))
  const electronVersion = JSON.parse(
    readFileSync(new URL('node_modules/electron/package.json', packageRoot), 'utf8'),
  ).version
  pnpmRuntime = installDesktopPnpmRuntime({
    platform: process.platform,
    appExecutable: process.execPath,
    pnpmBinPath,
    electronVersion,
    stateDir: join(home, 'runtime-commands'),
    environment: process.env,
  })
  releasePackageResolver = installProfilePackageResolver(prepared2.bareModuleBaseUrl)
  const runtime = {
    platform: 'win32',
    windowsBuild: 22_631,
    locale: 'en',
    updates: {
      isPackaged: false,
      canDownload: true,
      currentVersion: '2.0.0',
      statePath: join(home, 'update-state.json'),
      request: async () => { throw new Error('profile smoke must not perform update requests') },
      confirmDownload: async () => false,
      showManualCheckResult: async () => {},
      downloadAndOpen: async () => {},
      notify: () => {},
    },
    schedule(spec) {
      mountedSpec = spec
      return async () => {}
    },
    async mountScheduled() {
      if (mountedSpec === undefined) throw new Error('desktop shell was not registered')
      runtime.setLocalePreference(mountedSpec.readLocalePreference())
      nativeThemeSource = mountedSpec.readThemeSource()
    },
    show() {},
    registerTrayItem() {
      return { refresh() {}, dispose() {} }
    },
    openTerminal() {},
    setLocalePreference(preference) { runtime.locale = preference ?? 'en' },
    setThemeSource(source) { nativeThemeSource = source },
    async requestRestart() {},
    prepareToQuit() {},
  }
  ctx = await boot(
    BIN_NAME,
    prepared2.rootConfig,
    prepared2.patches,
    async (host) => {
      host.loader.internal = undefined
      host.provide(DSH_LAUNCH_ENVIRONMENT_KEY, createLaunchEnvironmentSnapshot([]))
      host.provide('desktopBrowserAccess', BROWSER_ACCESS)
      host.provide('desktopLanHttps', LAN_HTTPS)
      host.provide('desktopRuntime', runtime)
      host.provide('desktopPnpmBootstrap', {
        activeProfileName: 'desktop',
        activeProfileDir: prepared2.profile.dir,
        homeDir: prepared2.homeDir,
        appExecutable: process.execPath,
        pnpmBinPath,
        electronVersion,
        nodeBinDir: pnpmRuntime.nodeBinDir,
        nodeShimPath: pnpmRuntime.nodeShimPath,
        clearEnvironmentPath: pnpmRuntime.clearEnvironmentPath,
        dshBootstrapPath: fileURLToPath(new URL('lib/desktop-cli.js', packageRoot)),
      })
      await host.plugin(DesktopProfileService, {
        current: { name: 'desktop', dir: prepared2.profile.dir },
        list: () => [{
          name: 'desktop',
          dir: prepared2.profile.dir,
          exists: true,
          bundles: prepared2.profile.layers.map(layer => layer.packageName),
          webCapable: true,
        }],
        persistSelection: () => {},
        requestRestart: () => {},
      })
      provideCmdline(host, {
        args: ['--host', '127.0.0.1', '--port', '0'],
        exit: () => {},
      })
    },
    prepared2.bareModuleBaseUrl,
  )
  await runtime.mountScheduled()

  if (ctx.get('desktopPnpm') === undefined) {
    throw new Error('assembled desktop profile is missing the desktop pnpm Host capability')
  }
  if (mountedSpec?.url === undefined) {
    throw new Error('desktop plugin did not produce a renderer URL')
  }
  const expectedUrl = mountedSpec.url
  const authenticationUrl = new URL(mountedSpec.authenticationUrl)

  // Renderer authentication exchange: 401 without the header, then mint a cookie.
  const unauthenticated = await fetch(expectedUrl, {
    headers: { [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value },
  })
  await unauthenticated.body?.cancel()
  if (unauthenticated.status !== 401) {
    throw new Error(`assembled Web root accepted a renderer without browser authentication: HTTP ${String(unauthenticated.status)}`)
  }
  const exchange = await fetch(authenticationUrl, {
    headers: { [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value },
    redirect: 'manual',
  })
  await exchange.body?.cancel()
  const setCookie = exchange.headers.get('set-cookie')
  const cookie = setCookie?.split(';', 1)[0]
  if (cookie === undefined || cookie.length === 0) {
    throw new Error('browser authentication exchange did not mint a cookie')
  }
  const response = await fetch(expectedUrl, {
    headers: {
      [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value,
      Cookie: cookie,
    },
  })
  const html = await response.text()
  if (response.status !== 200) {
    throw new Error(`assembled Web root returned HTTP ${String(response.status)}`)
  }
  const bootMatch = html.match(/(?:window\.__DSH_BOOT__|globalThis\["__DSH_BOOT__"\]) = (\{.*?\})<\/script>/u)
  if (bootMatch?.[1] === undefined) {
    throw new Error('assembled Web root is missing window.__DSH_BOOT__')
  }
  const graph = JSON.parse(bootMatch[1])
  const entries = new Map(graph.entries.map(entry => [entry.id, entry]))
  for (const plugin of SPONGE_PLUGINS) {
    const entry = entries.get(plugin.name)
    if (entry === undefined) {
      throw new Error(`renderer graph is missing ${plugin.name}; received ${[...entries.keys()].sort().join(', ')}`)
    }
    console.log(`renderer graph entry: ${plugin.name} -> ${JSON.stringify(entry)}`)
  }
  for (const id of ['dsh-plugin-desktop', '@deepseek-ai/dsh-client-ui-sidebar', '@deepseek-ai/dsh-client-ui-conversation']) {
    if (!entries.has(id)) throw new Error(`renderer graph is missing base entry ${id}`)
  }
  console.log(`SPONGE DESKTOP SMOKE PASS: both plugins loaded; renderer URL ${expectedUrl}`)
} finally {
  await ctx?.fiber.dispose()
  releasePackageResolver?.()
  pnpmRuntime?.dispose()
  rmSync(home, { recursive: true, force: true })
}
