/**
 * Third CDP probe: dismiss the API-key onboarding modal, click Sandbox,
 * verify the sandbox page opens, and hunt for Portal plugin state.
 *
 * Usage: node cdp-probe3.mjs <ws-url> <screenshot-path>
 */
import { writeFileSync } from 'node:fs'

const wsUrl = process.argv[2]
const shotPath = process.argv[3]

const ws = new WebSocket(wsUrl)
let seq = 0
const pending = new Map()
const errors = []

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
  if (msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Runtime.exceptionThrown') {
    errors.push(JSON.stringify(msg).slice(0, 600))
  }
}

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
await call('Runtime.enable')

const evalJs = async (expression) => {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) return { exception: r.exceptionDetails.text }
  return r.result?.value
}

// Dismiss the onboarding modal.
const dismiss = await evalJs(`(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const skip = btns.find(b => (b.innerText||'').includes('稍后配置'))
  if (skip) { skip.click(); return { clicked: true } }
  return { clicked: false, buttons: btns.map(b => (b.innerText||'').slice(0,12)).slice(0,25) }
})()`)
console.log('DISMISS:', JSON.stringify(dismiss))
await new Promise((r) => setTimeout(r, 2000))

// Click the Sandbox entry.
const click = await evalJs(`(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const target = btns.find(b => /沙盒|sandbox/i.test((b.innerText||'') + ' ' + (b.getAttribute('aria-label')||'')))
  if (!target) return { clicked: false }
  target.click()
  return { clicked: true }
})()`)
console.log('CLICK_SANDBOX:', JSON.stringify(click))
await new Promise((r) => setTimeout(r, 3000))

const after = await evalJs(`(() => {
  const t = document.body ? document.body.innerText : ''
  const canvases = Array.from(document.querySelectorAll('canvas')).length
  const spongeNodes = Array.from(document.querySelectorAll('[class*="sponge"],[class*="Sponge"],[class*="portal"],[class*="Portal"]')).slice(0, 12).map(el => el.className)
  return {
    bodyHead: t.slice(0, 400),
    hasSandboxPage: /沙盒|sandbox/i.test(t),
    canvasCount: canvases,
    spongeNodes,
    modalGone: !t.includes('添加一个 API Key'),
  }
})()`)
console.log('AFTER:', JSON.stringify(after, null, 2))

const shot = await call('Page.captureScreenshot', { format: 'png' })
if (shot && shot.data) {
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'))
  console.log('screenshot saved:', shotPath)
}
console.log('ERRORS:', errors.length)
for (const e of errors.slice(0, 15)) console.log(e)
ws.close()
