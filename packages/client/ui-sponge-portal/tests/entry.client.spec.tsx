// @vitest-environment jsdom
/**
 * PortalEntryButton interaction spec under the four-share props form: the
 * shared route store determines whether the button reads as "open the Portal"
 * (route 'none') or "close it back to the conversation" (any other route).
 * The rail state follows the `wide` owner share — wide shows a label, narrow
 * shows an icon with a tooltip title instead.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createPortalRouteStore } from '@oasisailab/sponge-client-ui-sponge-portal/client'
import { bindSnapshotSelector } from '@oasisailab/sponge-client-test-runtime'
import type { PortalEntryButtonProps } from '../src/client/contract/slots.ts'
import { PortalEntryButton } from '../src/client/entry/PortalEntryButton.tsx'
import { en } from '../src/client/locales.ts'

const t: PortalEntryButtonProps['t'] = key => (en as Record<string, string>)[key] ?? key

// The entry button never reads the global hooks; they ride the standard props
// share, so stub them as never-called functions.
const neverHook = (() => { throw new Error('entry must not read global hooks') }) as never

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

function mountEntry({ wide, portal = false }: { wide: boolean; portal?: boolean }) {
  const instance = createPortalRouteStore().create()
  // Drive the store to the home route when the test needs a "close" state.
  if (portal) instance.actions.openHome()
  render(
    <PortalEntryButton
      useStore={bindSnapshotSelector(instance)}
      actions={instance.actions}
      wide={wide}
      t={t}
      useSessions={neverHook}
      useWorkspaces={neverHook}
    />,
  )
  return { instance }
}

describe('PortalEntryButton surface', () => {
  it('reads as "open the Container" while the route is none, and opens on click', () => {
    const { instance } = mountEntry({ wide: true })
    const button = screen.getByRole('button', { name: 'Open the Container' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(instance.getSnapshot().route.name).toBe('home')
    expect(screen.getByRole('button', { name: 'Open the Container' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('reads as "close to conversation" once the Portal is open, and closes on click', () => {
    const { instance } = mountEntry({ wide: true, portal: true })
    const button = screen.getByRole('button', { name: 'Open the Container' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(button)
    expect(instance.getSnapshot().route.name).toBe('none')
  })

  it('shows the label in the wide rail and an icon-only tooltip button in the narrow rail', () => {
    mountEntry({ wide: true })
    expect(screen.getByText('Container')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open the Container' }).getAttribute('title')).toBeNull()
    cleanup()
    const { instance } = mountEntry({ wide: false })
    const button = screen.getByRole('button', { name: 'Open the Container' })
    // Icon-only: no label text, the title carries the copy for a text-free rail.
    expect(button.textContent).toBe('')
    expect(button.getAttribute('title')).toBe('Container')
    fireEvent.click(button)
    expect(instance.getSnapshot().route.name).toBe('home')
  })
})
