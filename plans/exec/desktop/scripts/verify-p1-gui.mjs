/**
 * P1 GUI verification: launch the prepared Desktop profile, then drive the
 * renderer over CDP — click the sidebar-foot Portal/Sandbox toggles and assert
 * the keyed `main` panel seat swaps between conversation, the Portal surface,
 * and the Sandbox SVG viewport. Screenshots land in artifacts/p1-*.png.
 *
 * The Electron window runs with the same DSH_HOME / user-data-dir the prepare
 * script prints; this script owns the whole lifecycle (spawn, poll, drive,
 * terminate).
 */
import { spawn } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const planRoot = resolve(here, '..')
const artifacts = join(planRoot, 'artifacts')
const repoRoot = resolve(planRoot, '..', '..', '..')
const desktopRoot = resolve(repoRoot, '..', 'dsh-desktop')
const desktopDir = join(desktopRoot, 'dsh-plugin-desktop')
const home = join(artifacts, 'gui-home')
const userData = join(artifacts, 'gui-userdata')
const port = 9333

const electron = join(desktopDir, 'node_modules', 'electron', 'dist', 'electron.exe')
const mainJs = join(desktopDir, 'lib', 'main.js')
if (process.platform !== 'win32') {
  throw new Error('verify-p1-gui: this check targets the Windows Desktop checkout')
}
if (!existsSync(electron) || !existsSync(mainJs)) {
  throw new Error(`verify-p1-gui: missing Electron (${electron}) or main.js (${mainJs})`)
}

// Deterministic first boot: a stale active-run.json would route the app into the
// recovery window, and the persisted route stores (sponge.portal.route.v1 /
// sponge.sandbox.route.v1) would reopen a panel before the first click. The
// renderer partition holds both, so start from a clean partition.
rmSync(join(userData, 'crash-evidence', 'active-run.json'), { force: true })
rmSync(join(userData, 'Partitions', 'dsh-desktop-renderer'), { recursive: true, force: true })

const child = spawn(electron, [mainJs, `--user-data-dir=${userData}`, `--remote-debugging-port=${port}`], {
  env: { ...process.env, DSH_HOME: home },
  stdio: 'ignore',
})

async function targetList() {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  return res.json()
}

async function waitForTarget(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const targets = await targetList()
      const page = targets.find(t => t.type === 'page')
      if (page?.webSocketDebuggerUrl !== undefined) return page
    } catch { /* renderer not up yet */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('verify-p1-gui: no CDP page target within ' + timeoutMs + 'ms')
}

const page = await waitForTarget()
const ws = new WebSocket(page.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
const exceptions = []

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
    return
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    exceptions.push(JSON.stringify(msg.params.exceptionDetails))
  }
}

await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
await call('Page.enable')
await call('Runtime.enable')

async function evaluate(expression) {
  const { result, exceptionDetails } = await call('Runtime.evaluate', { expression, returnByValue: true })
  if (exceptionDetails !== undefined) {
    throw new Error('evaluate failed: ' + JSON.stringify(exceptionDetails))
  }
  return result.value
}

async function waitFor(expression, what, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  let last
  while (Date.now() < deadline) {
    last = await evaluate(expression)
    if (last) return last
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error(`verify-p1-gui: timed out waiting for ${what}`)
}

async function shot(name) {
  const { data } = await call('Page.captureScreenshot', { format: 'png' })
  const path = join(artifacts, name)
  writeFileSync(path, Buffer.from(data, 'base64'))
  return path
}

const probe = `(() => {
  const byLabel = (re) => Array.from(document.querySelectorAll('button'))
    .find(b => re.test(b.getAttribute('aria-label') ?? ''))
  const visible = (el) => !!el && el.offsetParent !== null
  const portalBtn = byLabel(/容器|Container/)
  const sandboxBtn = byLabel(/沙盒|Sandbox/)
  const portalSurface = document.querySelector('[data-portal-surface]')
  const sandboxSurface = document.querySelector('[data-sandbox-surface]')
  return {
    hasPortalBtn: !!portalBtn,
    hasSandboxBtn: !!sandboxBtn,
    portalPressed: portalBtn?.getAttribute('aria-pressed') ?? null,
    sandboxPressed: sandboxBtn?.getAttribute('aria-pressed') ?? null,
    portalVisible: visible(portalSurface),
    sandboxVisible: visible(sandboxSurface),
    // PanZoomCanvas draws an SVG viewport with data-box nodes, not a <canvas>.
    sandboxBoxCount: document.querySelectorAll('[data-sandbox-surface] [data-box]').length,
  }
})()`

const click = (re) => evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => /${re.source}/.test(b.getAttribute('aria-label') ?? ''))
  if (!btn) return false
  btn.click()
  return true
})()`)

// Boot: the foot toggles must be present before any interaction.
const boot = await waitFor(`(${probe}).hasPortalBtn && (${probe}).hasSandboxBtn`, 'the sidebar-foot entry buttons', 60_000)
console.log('BOOT', JSON.stringify(boot ?? await evaluate(probe)))

const initial = await evaluate(probe)
console.log('INITIAL', JSON.stringify(initial))
if (initial.portalPressed !== 'false' || initial.sandboxPressed !== 'false') {
  throw new Error(`entry buttons must start closed, got portal=${initial.portalPressed} sandbox=${initial.sandboxPressed}`)
}
if (initial.portalVisible || initial.sandboxVisible) {
  throw new Error('a Sponge surface is visible before any click')
}

// Open the Portal: keyed main must elect the sponge.portal panel.
await click(/容器|Container/)
await waitFor(`(${probe}).portalVisible`, 'the Portal surface', 15_000)
const portal = await evaluate(probe)
console.log('PORTAL_OPEN', JSON.stringify(portal))
if (portal.portalPressed !== 'true') throw new Error(`Portal button did not flip to pressed: ${portal.portalPressed}`)
if (portal.sandboxVisible) throw new Error('Sandbox surface is visible while the Portal is open')
console.log('SHOT', await shot('p1-portal.png'))

// Open the Sandbox over the Portal: keyed main must swap panels.
await click(/沙盒|Sandbox/)
await waitFor(`(${probe}).sandboxVisible && (${probe}).sandboxBoxCount > 0`, 'the Sandbox SVG viewport', 15_000)
const sandbox = await evaluate(probe)
console.log('SANDBOX_OPEN', JSON.stringify(sandbox))
if (sandbox.sandboxPressed !== 'true') throw new Error(`Sandbox button did not flip to pressed: ${sandbox.sandboxPressed}`)
if (sandbox.portalVisible) throw new Error('Portal surface is visible while the Sandbox is open')
console.log('SHOT', await shot('p1-sandbox.png'))

// Close back to the conversation: the same toggle again routes to none.
await click(/沙盒|Sandbox/)
await waitFor(`!(${probe}).sandboxVisible`, 'the Sandbox to close', 15_000)
const closed = await evaluate(probe)
console.log('CLOSED', JSON.stringify(closed))
if (closed.sandboxPressed !== 'false') throw new Error(`Sandbox button did not flip back: ${closed.sandboxPressed}`)
if (closed.sandboxVisible || closed.portalVisible) throw new Error('a Sponge surface is still visible after closing')
console.log('SHOT', await shot('p1-conversation.png'))

if (exceptions.length > 0) {
  throw new Error('renderer threw exceptions: ' + exceptions.slice(0, 5).join('\n'))
}
console.log('P1 GUI PASS: conversation -> portal -> sandbox -> conversation, zero renderer exceptions')

ws.close()
child.kill()
