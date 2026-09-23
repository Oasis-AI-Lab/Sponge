// @vitest-environment jsdom
/**
 * SandboxEntryButton interaction spec under the four-share props form: the
 * shared route store determines whether the button reads as "open the Sandbox"
 * (route 'none') or "close it back to the conversation" (any open route). The
 * rail state follows the `wide` owner share — wide shows a label, narrow shows
 * an icon with a tooltip title instead.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSandboxRouteStore } from '@oasisailab/sponge-client-ui-sponge-sandbox/client'
import { bindSnapshotSelector } from '@oasisailab/sponge-client-test-runtime'
import type { SandboxEntryButtonProps } from '../src/client/slots.ts'
import { SandboxEntryButton } from '../src/client/entry/SandboxEntryButton.tsx'
import { en } from '../src/client/locales.ts'

const t: SandboxEntryButtonProps['t'] = key => (en as Record<string, string>)[key] ?? key

// The entry button never reads the global hooks; they ride the standard props
// share, so stub them as never-called functions.
const neverHook = (() => { throw new Error('entry must not read global hooks') }) as never

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

function mountEntry({ wide, sandbox = false }: { wide: boolean; sandbox?: boolean }) {
  const instance = createSandboxRouteStore().create()
  // Drive the store to an open route when the test needs a "close" state.
  if (sandbox) instance.actions.open()
  render(
    <SandboxEntryButton
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

describe('SandboxEntryButton surface', () => {
  it('reads as "open the Sandbox" while the route is none, and opens on click', () => {
    const { instance } = mountEntry({ wide: true })
    const button = screen.getByRole('button', { name: 'Open the Sandbox' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(instance.getSnapshot().route).toEqual({ name: 'open', experiment: 'pan-zoom' })
    expect(screen.getByRole('button', { name: 'Open the Sandbox' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('reads as "close to conversation" once the Sandbox is open, and closes on click', () => {
    const { instance } = mountEntry({ wide: true, sandbox: true })
    const button = screen.getByRole('button', { name: 'Open the Sandbox' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(button)
    expect(instance.getSnapshot().route).toEqual({ name: 'none' })
  })

  it('shows the label in the wide rail and an icon-only tooltip button in the narrow rail', () => {
    mountEntry({ wide: true })
    expect(screen.getByText('Sandbox')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open the Sandbox' }).getAttribute('title')).toBeNull()
    cleanup()
    const { instance } = mountEntry({ wide: false })
    const button = screen.getByRole('button', { name: 'Open the Sandbox' })
    // Icon-only: no label text, the title carries the copy for a text-free rail.
    expect(button.textContent).toBe('')
    expect(button.getAttribute('title')).toBe('Sandbox')
    fireEvent.click(button)
    expect(instance.getSnapshot().route).toEqual({ name: 'open', experiment: 'pan-zoom' })
  })
})
