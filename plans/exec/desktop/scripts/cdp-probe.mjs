/**
 * CDP probe for the Sponge Desktop renderer. Connects to the Electron page,
 * captures a screenshot, and searches the DOM for Sponge Portal/Sandbox
 * entry markers plus any console errors.
 *
 * Usage: node cdp-probe.mjs <ws-url> <screenshot-path>
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

const consoleEvents = []
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
    consoleEvents.push(JSON.stringify(msg))
  }
}

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

await call('Page.enable')
await call('Runtime.enable')

// Wait for any pending layout work, then evaluate probes.
await new Promise((r) => setTimeout(r, 2500))

const probe = await call('Runtime.evaluate', {
  expression: `(() => {
    const text = document.body ? document.body.innerText : ''
    const buttons = Array.from(document.querySelectorAll('button')).map(b => (b.innerText || b.getAttribute('title') || '').trim()).filter(Boolean)
    const footers = Array.from(document.querySelectorAll('[class*="footer"],[class*="sidebar"]')).slice(0, 5).map(el => el.className)
    return {
      title: document.title,
      hasPortalText: /portal|门户/i.test(text),
      hasSandboxText: /sandbox|沙盒|沙盘/i.test(text),
      portalButtons: buttons.filter(t => /portal|门户/i.test(t)),
      sandboxButtons: buttons.filter(t => /sandbox|沙盒|沙盘/i.test(t)),
      buttonCount: buttons.length,
      sampleButtons: buttons.slice(0, 30),
      footerClasses: footers,
      bodyTextLength: text.length,
      bodyTextHead: text.slice(0, 500),
    }
  })()`,
  returnByValue: true,
})
console.log('PROBE:', JSON.stringify(probe.result?.value ?? probe, null, 2))

const shot = await call('Page.captureScreenshot', { format: 'png' })
if (shot && shot.data) {
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'))
  console.log('screenshot saved:', shotPath)
}

console.log('CONSOLE_EVENTS:', consoleEvents.length)
for (const ev of consoleEvents.slice(0, 20)) console.log(ev.slice(0, 800))

ws.close()
