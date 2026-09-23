// @vitest-environment jsdom
/**
 * SandboxShell interaction spec under the four-share props form: a real route
 * store instance (createSandboxRouteStore().create() — the test-sanctioned
 * engine path) and a recording renderSlotChain stub. The surface owns two
 * user-visible contracts: it renders nothing while the route is 'none' (the
 * page seat collapses back to the conversation) and, once open, it draws the
 * dev badge, title, subtitle, close control, and the chain-routed experiment
 * area.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { bindSnapshotSelector } from '@oasisailab/sponge-client-test-runtime'
import { createSandboxRouteStore } from '@oasisailab/sponge-client-ui-sponge-sandbox/client'
import type { SandboxMainOwnerProps, SandboxShellProps } from '@oasisailab/sponge-client-ui-sponge-sandbox/client'
import { SandboxShell } from '../src/client/shell/SandboxShell.tsx'
import { en } from '../src/client/locales.ts'

// English-dictionary translate stub: the surface renders the same copy the
// assertions below query by accessible name.
const t: SandboxShellProps['t'] = key => (en as Record<string, string>)[key] ?? key

// The shell never reads the global hooks itself, but they ride the standard
// props share; stub them as never-called functions.
const neverHook = (() => { throw new Error('shell must not read global hooks') }) as never

beforeEach(() => {
  // The route store persists; clear the jsdom backing so tests start at 'none'.
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

function mountShell(open = false) {
  const instance = createSandboxRouteStore().create()
  if (open) {
    act(() => { instance.actions.open() })
  }
  const chainCalls: SandboxMainOwnerProps[] = []
  const view = render(
    <SandboxShell
      useStore={bindSnapshotSelector(instance)}
      actions={instance.actions}
      renderSlotChain={((_key: string, owner: SandboxMainOwnerProps) => {
        chainCalls.push(owner)
        return <div data-testid="experiment-area" data-route={owner.route.name} />
      }) as SandboxShellProps['renderSlotChain']}
      // A chain-only child declaration still requires the renderSlot seat on
      // the props form (type-erased to `object` for all-chain shares).
      renderSlot={(() => null) as never}
      t={t}
      useSessions={neverHook}
      useWorkspaces={neverHook}
    />,
  )
  return { instance, chainCalls, ...view }
}

describe('SandboxShell surface', () => {
  it('renders nothing while the route is none', () => {
    const { container } = mountShell(false)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText('Development sandbox')).toBeNull()
    expect(screen.queryByTestId('experiment-area')).toBeNull()
  })

  it('draws the dev badge, title, subtitle, and the chain-routed experiment area once open', () => {
    mountShell(true)
    expect(screen.getByText('Development sandbox')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Sandbox' })).toBeTruthy()
    expect(screen.getByText('UI testbed — the next Editor canvas surface is validated here.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close the Sandbox' })).toBeTruthy()
    expect(screen.getByTestId('experiment-area').getAttribute('data-route')).toBe('open')
  })

  it('hands the chain the current route as its owner currency', () => {
    const b = mountShell(true)
    expect(b.chainCalls).toContainEqual({ route: { name: 'open', experiment: 'pan-zoom' } })
  })

  it('closes back to the conversation when the close control is clicked', () => {
    const b = mountShell(true)
    expect(screen.getByTestId('experiment-area')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close the Sandbox' }))
    expect(b.container.firstChild).toBeNull()
  })

  it('reveals the conversation surface when the route closes through the store', () => {
    const b = mountShell(true)
    act(() => { b.instance.actions.close() })
    expect(b.container.firstChild).toBeNull()
  })
})
