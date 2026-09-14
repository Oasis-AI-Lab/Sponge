/**
 * Sponge Portal plugin, browser half. Three registrations share one route
 * store handle (created here once): PortalEntryButton fills one
 * `sidebar.footer.action` slot — the foot toggle that opens and closes the
 * Portal; PortalShell fills the frame's `shell.page` page seat and declares
 * the `sponge.portal.main` chain, which ContainerHome and HistoryPage enter
 * with route selectors. The apply also decodes the web launch URL once and
 * hands the startup destination to the surface through its inject face.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext } from '@oasisailab/sponge-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@oasisailab/sponge-client-locale/client'
import type {
  HistoryPageInjected, PortalMainOwnerProps, PortalShellInjected,
} from './contract/slots.ts'
import type { SessionId } from '@oasisailab/sponge-client-runtime/client'
import { createPortalRouteStore, parseStartupDestination } from './stores.ts'
import { PortalShell } from './shell/PortalShell.tsx'
import { ContainerHome } from './home/ContainerHome.tsx'
import { HistoryPage } from './history/HistoryPage.tsx'
import { PortalEntryButton } from './entry/PortalEntryButton.tsx'
import { en, zh, type SpongePortalKey } from './locales.ts'

export type {
  ContainerHomeProps, HistoryPageInjected, HistoryPageProps, PortalEntryButtonProps,
  PortalMainOwnerProps, PortalShellInjected, PortalShellProps,
} from './contract/slots.ts'
export type { PortalRoute, PortalRouteActions, PortalRouteState, StartupDestination } from './stores.ts'
export { createPortalRouteStore, parseStartupDestination } from './stores.ts'
export type { SpongePortalKey } from './locales.ts'

declare module '@oasisailab/sponge-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Portal surface and entry-button copy. */
    'sponge-portal': SpongePortalKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'sponge-portal'

/**
 * Required services (cordis fiber inject). The target slots are declared by
 * the ui-layout / ui-sidebar applies, whose activation order relative to this
 * one is NOT constrained: dsh.client.inject edges are informational
 * (loading/prefetch metadata, never apply sequencing) and neither owner
 * provides a waitable service. apply therefore depends on each slot
 * declaration through `slots.inject()` instead of assuming order.
 */
export const inject = ['slots', 'sessions', 'locale']

/**
 * Register the entry button, the page surface, and the chain pages once their
 * slot declarations are on the ledger.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sponge-portal: dictionaries')

  // One handle shared by the foot entry and the page entry: the renderer
  // resolves a single root-scope instance, so the toggle and the surface
  // read the same route. The startup destination is decoded once here, from
  // the launch URL the CLI composed (?portal / &history / &resume=<id>).
  const portalStore = createPortalRouteStore()
  const startupDestination = parseStartupDestination(
    typeof window === 'undefined' ? '' : window.location.search,
  )
  const open = (sessionId: SessionId): void => { ctx.sessions.open(sessionId) }

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'sponge-portal', store: portalStore, locale: NS },
    PortalEntryButton,
  ))

  ctx.slots.inject('shell.page', () => ctx.slots.register(
    {
      name: 'shell.page',
      children: { 'sponge.portal.main': { kind: 'chain', scope: 'root' } },
      store: portalStore,
      inject: (): PortalShellInjected => ({ startupDestination, open }),
      locale: NS,
    },
    PortalShell,
  ))

  // The two named pages enter the same chain with route selectors; the chain
  // elects one per route, so page content composes without touching the shell.
  ctx.slots.inject('sponge.portal.main', () => ctx.slots.register(
    {
      name: 'sponge.portal.main',
      select: (owner: PortalMainOwnerProps) => owner.route.name === 'home' ? owner.route : null,
      locale: NS,
    },
    ContainerHome,
  ))
  ctx.slots.inject('sponge.portal.main', () => ctx.slots.register(
    {
      name: 'sponge.portal.main',
      select: (owner: PortalMainOwnerProps) => owner.route.name === 'history' ? owner.route : null,
      inject: (): HistoryPageInjected => ({ open }),
      locale: NS,
    },
    HistoryPage,
  ))
}
