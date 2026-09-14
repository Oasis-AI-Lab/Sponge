import { describe, expect, it, vi } from 'vitest'
import { createPortalRouteStore, parseStartupDestination } from '@oasisailab/sponge-client-ui-sponge-portal/client'

describe('createPortalRouteStore', () => {
  it('starts closed and navigates through the three routes', () => {
    const { store, actions } = createPortalRouteStore().create()
    expect(store.getSnapshot().route).toEqual({ name: 'none' })

    actions.openHome()
    expect(store.getSnapshot().route).toEqual({ name: 'home' })

    actions.openHistory()
    expect(store.getSnapshot().route).toEqual({ name: 'history' })

    actions.close()
    expect(store.getSnapshot().route).toEqual({ name: 'none' })
  })

  it('persists route changes under the portal key', () => {
    const backing = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => { backing.set(k, v) },
      removeItem: (k: string) => { backing.delete(k) },
    })
    const handle = createPortalRouteStore()
    handle.create().actions.openHistory()
    expect(JSON.parse(backing.get('sponge.portal.route.v1')!)).toEqual({ route: { name: 'history' } })
    vi.unstubAllGlobals()
  })
})

describe('parseStartupDestination', () => {
  it('decodes each launch flag and honors resume precedence', () => {
    expect(parseStartupDestination('?portal')).toEqual({ kind: 'portal' })
    expect(parseStartupDestination('?history')).toEqual({ kind: 'history' })
    expect(parseStartupDestination('?resume=abc')).toEqual({ kind: 'resume', sessionId: 'abc' })
    expect(parseStartupDestination('?history&resume=abc')).toEqual({ kind: 'resume', sessionId: 'abc' })
    expect(parseStartupDestination('')).toEqual({ kind: 'none' })
  })

  it('ignores an empty resume value', () => {
    expect(parseStartupDestination('?resume=')).toEqual({ kind: 'none' })
    expect(parseStartupDestination('?history&resume=')).toEqual({ kind: 'history' })
  })
})
