/**
 * Second CDP probe: click the Sandbox entry button, screenshot the result,
 * and hunt for the Portal plugin's presence in DOM/module state.
 *
 * Usage: node cdp-probe2.mjs <ws-url> <screenshot-path>
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

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

await call('Runtime.enable')

const evalJs = async (expression) => {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return r.result?.value
}

// 1. Deep hunt for portal/sandbox markers.
const deep = await evalJs(`(() => {
  const all = Array.from(document.querySelectorAll('button,[role="button"],[data-*],a'))
  const portalLike = all.filter(el => /portal|sponge/i.test((el.getAttribute('class')||'') + ' ' + (el.getAttribute('aria-label')||'') + ' ' + (el.innerText||'')))
  const sandboxLike = all.filter(el => /sandbox|沙盒/i.test((el.getAttribute('class')||'') + ' ' + (el.getAttribute('aria-label')||'') + ' ' + (el.innerText||'')))
  return {
    portalLike: portalLike.map(el => ({ cls: el.className, aria: el.getAttribute('aria-label'), text: (el.innerText||'').slice(0,20) })),
    sandboxLike: sandboxLike.map(el => ({ cls: el.className, aria: el.getAttribute('aria-label'), text: (el.innerText||'').slice(0,20) })),
    spongeClassNodes: Array.from(document.querySelectorAll('[class*="sponge"],[class*="Sponge"],[class*="portal"],[class*="Portal"]')).map(el => el.className).slice(0, 10),
  }
})()`)
console.log('DEEP:', JSON.stringify(deep, null, 2))

// 2. Click the sandbox button.
const click = await evalJs(`(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const target = btns.find(b => /sandbox|沙盒/i.test((b.innerText||'') + (b.getAttribute('aria-label')||'')))
  if (!target) return { clicked: false }
  target.click()
  return { clicked: true, text: target.innerText }
})()`)
console.log('CLICK:', JSON.stringify(click))

await new Promise((r) => setTimeout(r, 3000))

const after = await evalJs(`(() => ({
  bodyTextHead: (document.body.innerText||'').slice(0, 300),
  hasSandboxText: /sandbox|沙盒/i.test(document.body.innerText||''),
  buttonCount: document.querySelectorAll('button').length,
}))()`)
console.log('AFTER:', JSON.stringify(after))

const shot = await call('Page.captureScreenshot', { format: 'png' })
if (shot && shot.data) {
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'))
  console.log('screenshot saved:', shotPath)
}
ws.close()
