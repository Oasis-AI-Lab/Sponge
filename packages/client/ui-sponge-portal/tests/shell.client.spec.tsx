// @vitest-environment jsdom
/**
 * PortalShell interaction spec under the four-share props form: a real route
 * store instance (createPortalRouteStore().create() — the test-sanctioned
 * engine path), a recording renderSlotChain stub, and the startup destination
 * fed through the inject share. The surface owns two user-visible contracts:
 * it renders nothing while the route is 'none' (the page seat collapses) and
 * it applies the launch destination exactly once on mount, with later
 * navigation riding the persisted store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import type { SessionId } from '@oasisailab/sponge-client-runtime/client'
import { bindSnapshotSelector } from '@oasisailab/sponge-client-test-runtime'
import type { PortalMainOwnerProps, PortalShellProps, StartupDestination } from '@oasisailab/sponge-client-ui-sponge-portal/client'
import { createPortalRouteStore } from '@oasisailab/sponge-client-ui-sponge-portal/client'
import { PortalShell } from '../src/client/shell/PortalShell.tsx'
import { en } from '../src/client/locales.ts'

// English-dictionary translate stub: the surface renders the same copy the
// assertions below query by accessible name.
const t: PortalShellProps['t'] = key => (en as Record<string, string>)[key] ?? key

// The shell never reads the global hooks itself, but they ride the standard
// props share; stub them as never-called functions.
const neverHook = (() => { throw new Error('shell must not read global hooks') }) as never

/** Brand a raw id the way the URL parser does (the shell receives branded ids). */
const sid = (id: string) => id as SessionId

beforeEach(() => {
  // The route store persists; clear the jsdom backing so tests start at 'none'.
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

function mountShell(destination: StartupDestination, { strict = false }: { strict?: boolean } = {}) {
  const instance = createPortalRouteStore().create()
  const open = vi.fn()
  const chainCalls: PortalMainOwnerProps[] = []
  const element = (
    <PortalShell
      useStore={bindSnapshotSelector(instance)}
      actions={instance.actions}
      renderSlotChain={((_key: string, owner: PortalMainOwnerProps) => {
        chainCalls.push(owner)
        return <div data-testid="main-area" data-route={owner.route.name} />
      }) as PortalShellProps['renderSlotChain']}
      // A chain-only child declaration still requires the renderSlot seat on
      // the props form (type-erased to `object` for all-chain shares).
      renderSlot={(() => null) as never}
      startupDestination={destination}
      open={open}
      t={t}
      useSessions={neverHook}
      useWorkspaces={neverHook}
    />
  )
  const view = render(strict ? <StrictMode>{element}</StrictMode> : element)
  return { instance, open, chainCalls, ...view }
}

describe('PortalShell surface', () => {
  it('renders nothing while the route is none', () => {
    const { container } = mountShell({ kind: 'none' })
    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('applies the portal destination to the home page on mount', () => {
    const b = mountShell({ kind: 'portal' })
    expect(screen.getByRole('navigation', { name: 'Container' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Container' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'History' })).toBeTruthy()
    // The chain elected the home page with the current route as its currency.
    expect(screen.getByTestId('main-area').getAttribute('data-route')).toBe('home')
    expect(b.chainCalls.at(-1)).toEqual({ route: { name: 'home' } })
  })

  it('applies the history destination and navigates between pages through the nav', () => {
    const b = mountShell({ kind: 'history' })
    expect(screen.getByTestId('main-area').getAttribute('data-route')).toBe('history')

    fireEvent.click(screen.getByRole('button', { name: 'Container' }))
    expect(screen.getByTestId('main-area').getAttribute('data-route')).toBe('home')
    expect(b.chainCalls.at(-1)).toEqual({ route: { name: 'home' } })

    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByTestId('main-area').getAttribute('data-route')).toBe('history')
    expect(b.chainCalls.at(-1)).toEqual({ route: { name: 'history' } })
  })

  it('resume opens the session directly without filling the page seat', () => {
    const b = mountShell({ kind: 'resume', sessionId: sid('s-1') })
    expect(b.open).toHaveBeenCalledWith(sid('s-1'))
    // The route stays 'none': the surface never renders and the chain never runs.
    expect(b.container.firstChild).toBeNull()
    expect(b.chainCalls).toHaveLength(0)
  })

  it('applies the startup destination once under StrictMode remount', () => {
    const b = mountShell({ kind: 'resume', sessionId: sid('s-2') }, { strict: true })
    // StrictMode simulates unmount/remount; the one-shot guard must hold.
    expect(b.open).toHaveBeenCalledTimes(1)
    expect(b.open).toHaveBeenCalledWith(sid('s-2'))
  })

  it('reveals the conversation surface when the route closes', () => {
    const b = mountShell({ kind: 'portal' })
    expect(screen.getByTestId('main-area')).toBeTruthy()
    act(() => { b.instance.actions.close() })
    expect(b.container.firstChild).toBeNull()
    expect(b.chainCalls).toHaveLength(1)
  })
})
