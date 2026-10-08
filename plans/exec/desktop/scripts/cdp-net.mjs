/**
 * Capture network requests during reload to see which client bundles load.
 *
 * Usage: node cdp-net.mjs <ws-url>
 */
const wsUrl = process.argv[2]

const ws = new WebSocket(wsUrl)
let seq = 0
const pending = new Map()
const requests = []

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
  if (msg.method === 'Network.requestWillBeSent') {
    const u = msg.params.request.url
    if (/sponge|portal|sandbox|\.js|\.mjs|\.css|43121|client/i.test(u)) {
      requests.push(u)
    }
  }
  if (msg.method === 'Network.loadingFailed') {
    requests.push('FAILED: ' + (msg.params.errorText ?? '') + ' ' + (msg.params.blockedReason ?? ''))
  }
}

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
await call('Network.enable')
await call('Page.enable')
await call('Page.reload', { ignoreCache: true })
await new Promise((r) => setTimeout(r, 12000))

const unique = [...new Set(requests)]
console.log('REQUESTS:', unique.length)
for (const u of unique.slice(0, 120)) console.log(u)
ws.close()
