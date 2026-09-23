import { Context } from '@oasisailab/sponge-cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@oasisailab/sponge-client-runtime/client'
import { LocaleRuntime } from '@oasisailab/sponge-client-locale/client'
import { apply, inject } from '@oasisailab/sponge-client-ui-sponge-sandbox/client'
import type { SandboxMainOwnerProps } from '@oasisailab/sponge-client-ui-sponge-sandbox/client'
import { SandboxShell } from '../src/client/shell/SandboxShell.tsx'
import { PanZoomCanvas } from '../src/client/canvas/PanZoomCanvas.tsx'
import { SandboxEntryButton } from '../src/client/entry/SandboxEntryButton.tsx'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  // These specs assert the shipped Chinese copy. There is no jsdom `window`
  // in this lane, so browser-language detection never runs and the locale
  // comes from FALLBACK_LOCALE (en): state the asserted locale explicitly.
  locale.setLocale('zh')
  ctx.provide('locale', locale)
  return { ctx, slots: ctx.get('slots') as SlotRegistry, locale }
}

/** Declare the frame's sandbox seat plus the sidebar foot, mirroring ui-layout/ui-sidebar. */
function declareFrame(slots: SlotRegistry): () => void {
  return slots.register({
    name: 'root',
    children: {
      'sidebar.footer.action': { kind: 'list', scope: 'root' },
      'shell.sandbox': { kind: 'single', scope: 'root' },
    },
  } as never, () => null)
}

describe('ui-sponge-sandbox apply', () => {
  it('declares the services it drives', () => {
    expect(inject).toEqual(['slots', 'locale'])
  })

  it('registers the entry button, the shell, and the chain experiment once their seats are declared', async () => {
    const before = await bench()
    declareFrame(before.slots)
    await before.ctx.plugin({ inject: [...inject], apply }).await()

    const button = before.slots.entries('sidebar.footer.action')[0]!
    expect(button.component).toBe(SandboxEntryButton)
    expect(button.locale).toBe('sponge-sandbox')

    const shell = before.slots.entries('shell.sandbox')[0]!
    expect(shell.component).toBe(SandboxShell)
    expect(shell.locale).toBe('sponge-sandbox')
    // The shell entry declares the experiment chain for its own render seat.
    expect(before.slots.spec('sponge.sandbox.main')).toMatchObject({ kind: 'chain' })

    // The experiment enters the chain with a route selector.
    const canvas = before.slots.entries('sponge.sandbox.main').find(e => e.component === PanZoomCanvas)!
    const open: SandboxMainOwnerProps = { route: { name: 'open', experiment: 'pan-zoom' } }
    expect(canvas.select?.(open as never)).toEqual(open.route)
    expect(canvas.select?.({ route: { name: 'none' } } as never)).toBeNull()

    // Copy rides the standard locale seat: the entry declares the namespace
    // and apply registered both dictionaries.
    expect(before.locale.bind('sponge-sandbox')('entry.sandbox')).toBe('沙盒')
    before.locale.setLocale('en')
    expect(before.locale.bind('sponge-sandbox')('entry.sandbox')).toBe('Sandbox')

    // One shared route-store handle seats both the toggle and the surface, so
    // the button and the shell read the same root-scope instance.
    expect(button.store).toBe(shell.store)
  })

  it('registers into declarations that arrive after apply', async () => {
    const { ctx, slots } = await bench()
    await ctx.plugin({ inject: [...inject], apply }).await()
    expect(slots.entries('sidebar.footer.action')).toHaveLength(0)

    declareFrame(slots)

    await vi.waitFor(() => {
      expect(slots.entries('sidebar.footer.action')).toHaveLength(1)
      expect(slots.entries('shell.sandbox')).toHaveLength(1)
      expect(slots.entries('sponge.sandbox.main')).toHaveLength(1)
    })
  })

  it('leaves the seats empty and Portal untouched when the sandbox seat is not declared', async () => {
    // The negative acceptance: with no shell.sandbox declaration (the state
    // that follows dropping the cordis.patch.yml row — the whole plugin stops
    // loading), the sandbox fills nothing, the conversation and the Portal's
    // shell.page seat stay untouched, and nothing errors. Registering the
    // sidebar foot alone proves the surface has no seat to fill: the button
    // hangs on the sidebar list, but shell.sandbox stays empty.
    const { ctx, slots } = await bench()
    slots.register({
      name: 'root',
      children: {
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
        'shell.page': { kind: 'single', scope: 'root' },
      },
    } as never, () => null)
    await ctx.plugin({ inject: [...inject], apply }).await()
    expect(slots.entries('sidebar.footer.action').map(e => e.component)).toEqual([SandboxEntryButton])
    expect(slots.entries('shell.sandbox')).toHaveLength(0)
    expect(slots.entries('sponge.sandbox.main')).toHaveLength(0)
    // The seat is typable and free of cost: no occupant, no DOM, no page entry.
    expect(slots.entries('shell.page')).toHaveLength(0)
  })

  it('unregisters every entry on teardown', async () => {
    const b = await bench()
    declareFrame(b.slots)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries('sponge.sandbox.main')).toHaveLength(1)
    await fiber.dispose()
    expect(b.slots.entries('sidebar.footer.action')).toHaveLength(0)
    expect(b.slots.entries('shell.sandbox')).toHaveLength(0)
    expect(b.slots.entries('sponge.sandbox.main')).toHaveLength(0)
  })
})
