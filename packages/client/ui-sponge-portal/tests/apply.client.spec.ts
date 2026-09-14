import { Context } from '@oasisailab/sponge-cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@oasisailab/sponge-client-runtime/client'
import { LocaleRuntime } from '@oasisailab/sponge-client-locale/client'
import { apply, inject } from '@oasisailab/sponge-client-ui-sponge-portal/client'
import type { HistoryPageInjected, PortalShellInjected } from '@oasisailab/sponge-client-ui-sponge-portal/client'
import { PortalShell } from '../src/client/shell/PortalShell.tsx'
import { ContainerHome } from '../src/client/home/ContainerHome.tsx'
import { HistoryPage } from '../src/client/history/HistoryPage.tsx'
import { PortalEntryButton } from '../src/client/entry/PortalEntryButton.tsx'

async function bench(search: string | null = null) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  if (search !== null) {
    // The apply decodes the launch URL once; a stubbed window stands in for
    // the browser location the web runtime composes from the CLI flags.
    vi.stubGlobal('window', { location: { search } })
  }
  const open = vi.fn()
  ctx.provide('sessions', { open } as never)
  const locale = new LocaleRuntime(ctx)
  // These specs assert the shipped Chinese copy. There is no jsdom `window`
  // in this lane, so browser-language detection never runs and the locale
  // comes from FALLBACK_LOCALE (en): state the asserted locale explicitly.
  locale.setLocale('zh')
  ctx.provide('locale', locale)
  return { ctx, slots: ctx.get('slots') as SlotRegistry, locale, open }
}

/** Declare the frame's two Portal seats from a single root registration. */
function declareFrame(slots: SlotRegistry): () => void {
  return slots.register({
    name: 'root',
    children: {
      'sidebar.footer.action': { kind: 'list', scope: 'root' },
      'shell.page': { kind: 'single', scope: 'root' },
    },
  } as never, () => null)
}

describe('ui-sponge-portal apply', () => {
  it('declares the services it drives', () => {
    expect(inject).toEqual(['slots', 'sessions', 'locale'])
  })

  it('registers the entry button, the shell, and the chain pages once their seats are declared', async () => {
    const before = await bench()
    declareFrame(before.slots)
    await before.ctx.plugin({ inject: [...inject], apply }).await()

    const button = before.slots.entries('sidebar.footer.action')[0]!
    expect(button.component).toBe(PortalEntryButton)
    expect(button.locale).toBe('sponge-portal')

    const shell = before.slots.entries('shell.page')[0]!
    expect(shell.component).toBe(PortalShell)
    expect(shell.locale).toBe('sponge-portal')
    // The shell entry declares the main-page chain for its own render seat.
    expect(before.slots.spec('sponge.portal.main')).toMatchObject({ kind: 'chain' })

    // Both pages enter the same chain with route selectors.
    const home = before.slots.entries('sponge.portal.main').find(e => e.component === ContainerHome)!
    const history = before.slots.entries('sponge.portal.main').find(e => e.component === HistoryPage)!
    // entries() returns the type-erased ledger rows — the chain selectors are
    // opaque to the inspection surface, so the owner argument is passed as
    // `never` and only the return (M) is asserted.
    expect(home.select?.({ route: { name: 'home' } } as never)).toEqual({ name: 'home' })
    expect(home.select?.({ route: { name: 'history' } } as never)).toBeNull()
    expect(home.select?.({ route: { name: 'none' } } as never)).toBeNull()
    expect(history.select?.({ route: { name: 'history' } } as never)).toEqual({ name: 'history' })
    expect(history.select?.({ route: { name: 'home' } } as never)).toBeNull()

    // Copy rides the standard locale seat: the entry declares the namespace
    // and apply registered both dictionaries.
    expect(before.locale.bind('sponge-portal')('entry.portal')).toBe('容器')
    before.locale.setLocale('en')
    expect(before.locale.bind('sponge-portal')('entry.portal')).toBe('Container')

    // One shared route-store handle seats both the toggle and the surface, so
    // the button and the shell read the same root-scope instance.
    expect(button.store).toBe(shell.store)

    const after = await bench()
    await after.ctx.plugin({ inject: [...inject], apply }).await()
    declareFrame(after.slots)
    await Promise.resolve()
    expect(after.slots.entries('shell.page')[0]!.component).toBe(PortalShell)
    vi.unstubAllGlobals()
  })

  it('hands the shell and history pages their inject faces', async () => {
    const b = await bench()
    declareFrame(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()

    const shell = b.slots.entries('shell.page')[0]!
    const shellInjected = shell.inject?.() as unknown as PortalShellInjected
    expect(shellInjected.startupDestination).toEqual({ kind: 'none' })
    shellInjected.open('s1' as never)
    expect(b.open).toHaveBeenCalledWith('s1')

    const history = b.slots.entries('sponge.portal.main').find(e => e.component === HistoryPage)!
    const historyInjected = history.inject?.() as unknown as HistoryPageInjected
    // Both faces carry the same resume verb (the apply's single open closure).
    expect(historyInjected.open).toBe(shellInjected.open)
    historyInjected.open('s2' as never)
    expect(b.open).toHaveBeenLastCalledWith('s2')
  })

  it('decodes the startup destination once from the launch URL', async () => {
    const b = await bench('?history')
    declareFrame(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const shellInjected = b.slots.entries('shell.page')[0]!.inject?.() as unknown as PortalShellInjected
    expect(shellInjected.startupDestination).toEqual({ kind: 'history' })
    vi.unstubAllGlobals()
  })

  it('registers into declarations that arrive after apply', async () => {
    const { ctx, slots } = await bench()
    await ctx.plugin({ inject: [...inject], apply }).await()
    expect(slots.entries('sidebar.footer.action')).toHaveLength(0)

    declareFrame(slots)

    await vi.waitFor(() => {
      expect(slots.entries('sidebar.footer.action')).toHaveLength(1)
      expect(slots.entries('shell.page')).toHaveLength(1)
      expect(slots.entries('sponge.portal.main')).toHaveLength(2)
    })
  })

  it('unregisters every entry on teardown', async () => {
    const b = await bench()
    declareFrame(b.slots)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries('sponge.portal.main')).toHaveLength(2)
    await fiber.dispose()
    expect(b.slots.entries('sidebar.footer.action')).toHaveLength(0)
    expect(b.slots.entries('shell.page')).toHaveLength(0)
    expect(b.slots.entries('sponge.portal.main')).toHaveLength(0)
  })
})
