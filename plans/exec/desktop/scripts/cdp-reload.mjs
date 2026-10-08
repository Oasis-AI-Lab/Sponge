/**
 * Reload the renderer with console capture enabled from the start, to catch
 * any module-load errors from Sponge plugins.
 *
 * Usage: node cdp-reload.mjs <ws-url> <screenshot-path>
 */
import { writeFileSync } from 'node:fs'

const wsUrl = process.argv[2]
const shotPath = process.argv[3]

const ws = new WebSocket(wsUrl)
let seq = 0
const pending = new Map()
const events = []

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
    events.push(msg)
  }
}

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
await call('Runtime.enable')
await call('Log.enable')

await call('Page.reload', { ignoreCache: true })
console.log('reloading...')

// Collect events during load + settle.
await new Promise((r) => setTimeout(r, 12000))

const evalJs = async (expression) => {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return r.result?.value
}

const state = await evalJs(`(() => {
  const t = document.body ? document.body.innerText : ''
  const btns = Array.from(document.querySelectorAll('button')).map(b => (b.innerText||b.getAttribute('aria-label')||'').trim()).filter(Boolean)
  return { title: document.title, btns: btns.slice(0, 30), hasSandbox: /沙盒/.test(t) }
})()`)
console.log('STATE:', JSON.stringify(state))

console.log('EVENTS:', events.length)
for (const e of events) {
  if (e.method === 'Runtime.exceptionThrown') {
    console.log('EXCEPTION:', JSON.stringify(e.params.exceptionDetails?.exception?.description ?? e.params.exceptionDetails).slice(0, 1200))
  } else {
    const a = e.params.args || []
    console.log(`CONSOLE[${e.params.type}]:`, a.map(x => x.value ?? x.description ?? '').join(' ').slice(0, 600))
  }
}

const shot = await call('Page.captureScreenshot', { format: 'png' })
if (shot && shot.data) {
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'))
  console.log('screenshot saved:', shotPath)
}
ws.close()
