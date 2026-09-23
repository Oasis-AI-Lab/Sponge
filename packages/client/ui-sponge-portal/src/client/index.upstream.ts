/**
 * Sponge Portal plugin, upstream-identity variant entry. Built ONLY when
 * DSH_BUILD_VARIANT=upstream (tsdown switches this package's client entry to
 * this file); the product build keeps src/client/index.ts. It registers the
 * SAME components, store, and inject faces as the product entry, but into the
 * Desktop shell's seats: the upstream layout declares no `shell.page`, and its
 * keyed `main` slot selects one panel at a time through ctx.layout.selectPanel
 * — the conversation by default, or a registered panel key.
 *
 * Two additions over the product entry, nothing else:
 * - the PortalShell registration carries `key: 'sponge.portal'` — the panel id
 *   selectPanel validates against the live main-slot registry;
 * - a resident `shell.overlay` bridge mirrors the route store into the panel
 *   selection. A keyed panel mounts only once selected, so it cannot drive its
 *   own selection; the bridge sits on the always-mounted overlay layer,
 *   subscribes the framework-resolved store instance through its `useStore`
 *   seat, and calls selectPanel on every route change (null when the route is
 *   'none', returning to the conversation).
 *
 * Keep this file's registrations in sync with src/client/index.ts.
 */
import type { ClientContext } from '@oasisailab/sponge-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@oasisailab/sponge-client-locale/client'
// Type-only: pulls the layout plugin's Context merge (ctx.layout).
import type {} from '@oasisailab/sponge-client-ui-layout/client'
import { useEffect } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@oasisailab/sponge-client-ui-slots'
import type {
  HistoryPageInjected, PortalMainOwnerProps, PortalShellInjected,
} from './contract/slots.ts'
import type { SessionId } from '@oasisailab/sponge-client-runtime/client'
import { createPortalRouteStore, parseStartupDestination } from './stores.ts'
import { PortalShell } from './shell/PortalShell.tsx'
import { ContainerHome } from './home/ContainerHome.tsx'
import { HistoryPage } from './history/HistoryPage.tsx'
import { PortalEntryButton } from './entry/PortalEntryButton.tsx'
import { en, zh } from './locales.ts'

declare module '@oasisailab/sponge-client-ui-slots' {
  interface SlotMap {
    /**
     * Upstream-identity variant seat: the Desktop shell's keyed `main` panel
     * slot (declared by the upstream layout, not by this repo). Product builds
     * never register here — only the DSH_BUILD_VARIANT=upstream entry does —
     * so the declaration is inert in the product program.
     */
    'main': { kind: 'keyed'; scope: 'root' }
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'sponge-portal'

/**
 * Required services (cordis fiber inject). The product entry needs `slots`,
 * `sessions`, and `locale`; this variant additionally reads `ctx.layout` at
 * apply time to capture the panel-selection face, so `layout` is declared here
 * (undeclared property access throws "cannot get property ... without inject").
 */
export const inject = ['slots', 'sessions', 'locale', 'layout']

/**
 * Register the entry button, the Desktop main panel, the panel bridge, and the
 * chain pages once their slot declarations are on the ledger.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sponge-portal: dictionaries')

  // One handle shared by the foot entry, the panel, and the bridge: the
  // renderer resolves a single root-scope instance, so all three read the
  // same route.
  const portalStore = createPortalRouteStore()
  const startupDestination = parseStartupDestination(
    typeof window === 'undefined' ? '' : window.location.search,
  )
  const open = (sessionId: SessionId): void => { ctx.sessions.open(sessionId) }

  // The Desktop shell's panel-selection face. The repo's ILayout has no
  // selectPanel; this variant runs under the upstream layout, whose
  // LayoutController.selectPanel validates the key against the live main-slot
  // registry (null always selects the conversation).
  const layout = ctx.layout as unknown as { selectPanel(panelId: string | null): void }

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'sponge-portal', store: portalStore, locale: NS },
    PortalEntryButton,
  ))

  ctx.slots.inject('main', () => ctx.slots.register(
    {
      name: 'main',
      key: 'sponge.portal',
      children: { 'sponge.portal.main': { kind: 'chain', scope: 'root' } },
      store: portalStore,
      inject: (): PortalShellInjected => ({ startupDestination, open }),
      locale: NS,
    },
    PortalShell,
  ))

  // Route -> panel bridge (see the module doc). Registered after the main
  // entry so selectPanel never races the registry; the effect re-runs on
  // every route reference change, so re-opening a panel whose store stayed
  // open re-selects it.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    {
      name: 'shell.overlay',
      id: 'sponge-portal-bridge',
      store: portalStore,
      locale: NS,
    },
    function PortalPanelBridge({ useStore }: PortalPanelBridgeProps) {
      const route = useStore(s => s.route)
      useEffect(() => {
        layout.selectPanel(route.name === 'none' ? null : 'sponge.portal')
      }, [route])
      return null
    },
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

/** The bridge's composed props: overlay runtime share + shared route store + locale. */
type PortalPanelBridgeProps =
  PropsRuntime<'shell.overlay'>
  & PropsStore<ReturnType<typeof createPortalRouteStore>>
  & PropsLocale<'sponge-portal'>
