import { describe, expect, it, vi } from 'vitest'
import { createSandboxRouteStore } from '@oasisailab/sponge-client-ui-sponge-sandbox/client'

describe('createSandboxRouteStore', () => {
  it('starts closed and navigates between none and the pan-zoom experiment', () => {
    const { store, actions } = createSandboxRouteStore().create()
    expect(store.getSnapshot().route).toEqual({ name: 'none' })

    actions.open()
    expect(store.getSnapshot().route).toEqual({ name: 'open', experiment: 'pan-zoom' })

    // select re-targets the experiment id (the shipped union has one id, but
    // the verb is the seam later experiments use).
    actions.select('pan-zoom')
    expect(store.getSnapshot().route).toEqual({ name: 'open', experiment: 'pan-zoom' })

    actions.close()
    expect(store.getSnapshot().route).toEqual({ name: 'none' })
  })

  it('persists route changes under the sandbox key', () => {
    const backing = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => { backing.set(k, v) },
      removeItem: (k: string) => { backing.delete(k) },
    })
    const handle = createSandboxRouteStore()
    handle.create().actions.open()
    expect(JSON.parse(backing.get('sponge.sandbox.route.v1')!)).toEqual({ route: { name: 'open', experiment: 'pan-zoom' } })
    vi.unstubAllGlobals()
  })
})
