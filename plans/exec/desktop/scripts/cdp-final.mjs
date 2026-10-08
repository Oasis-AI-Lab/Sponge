/**
 * Final probe: click the Container (portal) entry and the Sandbox entry,
 * check whether their page seats mount, and record toggle state.
 *
 * Usage: node cdp-final.mjs <ws-url> <screenshot-path>
 */
import { writeFileSync } from 'node:fs'

const wsUrl = process.argv[2]
const shotPath = process.argv[3]

const ws = new WebSocket(wsUrl)
let seq = 0
const pending = new Map()

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
  }
}
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
await call('Runtime.enable')

const evalJs = async (expression) => {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) return { exception: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text }
  return r.result?.value
}

const footer = await evalJs(`(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  return btns.map(b => ({ text: (b.innerText||'').trim(), aria: b.getAttribute('aria-label') || '', pressed: b.getAttribute('aria-pressed') })).filter(x => x.text || x.aria)
})()`)
console.log('FOOTER:', JSON.stringify(footer, null, 2))

// Click the Container (portal) entry.
const c1 = await evalJs(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find(x => (x.innerText||'').trim() === '容器' || (x.getAttribute('aria-label')||'') === '打开容器')
  if (!b) return { found: false }
  b.click()
  return { found: true, pressed: b.getAttribute('aria-pressed') }
})()`)
console.log('CLICK_CONTAINER:', JSON.stringify(c1))
await new Promise((r) => setTimeout(r, 2500))

const p1 = await evalJs(`(() => {
  const t = document.body.innerText || ''
  return {
    portalSubtitle: t.includes('居民档案与结构浏览将在后续里程碑落地'),
    portalHomeTitle: t.includes('Sponge 的标准面'),
    bodyTail: t.slice(-300),
  }
})()`)
console.log('AFTER_CONTAINER:', JSON.stringify(p1))

// Click Sandbox entry.
const c2 = await evalJs(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find(x => (x.innerText||'').trim() === '沙盒' || /sandbox/i.test(x.getAttribute('aria-label')||''))
  if (!b) return { found: false }
  b.click()
  return { found: true, pressed: b.getAttribute('aria-pressed') }
})()`)
console.log('CLICK_SANDBOX:', JSON.stringify(c2))
await new Promise((r) => setTimeout(r, 2500))

const p2 = await evalJs(`(() => {
  const t = document.body.innerText || ''
  return {
    canvasCount: document.querySelectorAll('canvas').length,
    bodyTail: t.slice(-300),
  }
})()`)
console.log('AFTER_SANDBOX:', JSON.stringify(p2))

const shot = await call('Page.captureScreenshot', { format: 'png' })
if (shot && shot.data) { writeFileSync(shotPath, Buffer.from(shot.data, 'base64')); console.log('shot saved') }
ws.close()
