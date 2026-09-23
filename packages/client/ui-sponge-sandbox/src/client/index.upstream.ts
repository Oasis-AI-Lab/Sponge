/**
 * Sponge Sandbox plugin, upstream-identity variant entry. Built ONLY when
 * DSH_BUILD_VARIANT=upstream (tsdown switches this package's client entry to
 * this file); the product build keeps src/client/index.ts. It registers the
 * SAME components, store, and inject faces as the product entry, but into the
 * Desktop shell's seats: the upstream layout declares no `shell.sandbox`, and
 * its keyed `main` slot selects one panel at a time through
 * ctx.layout.selectPanel — the conversation by default, or a registered panel
 * key.
 *
 * Two additions over the product entry, nothing else:
 * - the SandboxShell registration carries `key: 'sponge.sandbox'` — the panel
 *   id selectPanel validates against the live main-slot registry;
 * - a resident `shell.overlay` bridge mirrors the route store into the panel
 *   selection. A keyed panel mounts only once selected, so it cannot drive its
 *   own selection; the bridge sits on the always-mounted overlay layer,
 *   subscribes the framework-resolved store instance through its `useStore`
 *   seat, and calls selectPanel on every route change (null when the route is
 *   'none', returning to the conversation).
 *
 * The sandbox route store stays this package's exclusive seat: the bridge and
 * the panel share it, and nothing here references the Portal route store.
 * Keep this file's registrations in sync with src/client/index.ts.
 */
import type { ClientContext } from '@oasisailab/sponge-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@oasisailab/sponge-client-locale/client'
// Type-only: pulls the layout plugin's Context merge (ctx.layout).
import type {} from '@oasisailab/sponge-client-ui-layout/client'
import { useEffect } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@oasisailab/sponge-client-ui-slots'
import type { SandboxMainOwnerProps } from './slots.ts'
import { createSandboxRouteStore } from './stores.ts'
import { SandboxShell } from './shell/SandboxShell.tsx'
import { PanZoomCanvas } from './canvas/PanZoomCanvas.tsx'
import { SandboxEntryButton } from './entry/SandboxEntryButton.tsx'
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
const NS = 'sponge-sandbox'

/**
 * Required services (cordis fiber inject). The product entry needs `slots` and
 * `locale`; this variant additionally reads `ctx.layout` at apply time to
 * capture the panel-selection face, so `layout` is declared here (undeclared
 * property access throws "cannot get property ... without inject").
 */
export const inject = ['slots', 'locale', 'layout']

/**
 * Register the entry button, the Desktop main panel, the panel bridge, and the
 * experiment chain once their slot declarations are on the ledger.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sponge-sandbox: dictionaries')

  // One handle shared by the foot entry, the panel, and the bridge: the
  // renderer resolves a single root-scope instance, so all three read the
  // same route.
  const sandboxStore = createSandboxRouteStore()

  // The Desktop shell's panel-selection face (see the Portal variant entry for
  // why the repo's ILayout is cast away here).
  const layout = ctx.layout as unknown as { selectPanel(panelId: string | null): void }

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'ui-sponge-sandbox', store: sandboxStore, locale: NS },
    SandboxEntryButton,
  ))

  ctx.slots.inject('main', () => ctx.slots.register(
    {
      name: 'main',
      key: 'sponge.sandbox',
      children: { 'sponge.sandbox.main': { kind: 'chain', scope: 'root' } },
      store: sandboxStore,
      locale: NS,
    },
    SandboxShell,
  ))

  // Route -> panel bridge (see the module doc). Registered after the main
  // entry so selectPanel never races the registry; the effect re-runs on
  // every route reference change, so re-opening a panel whose store stayed
  // open re-selects it.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    {
      name: 'shell.overlay',
      id: 'sponge-sandbox-bridge',
      store: sandboxStore,
      locale: NS,
    },
    function SandboxPanelBridge({ useStore }: SandboxPanelBridgeProps) {
      const route = useStore(s => s.route)
      useEffect(() => {
        layout.selectPanel(route.name === 'none' ? null : 'sponge.sandbox')
      }, [route])
      return null
    },
  ))

  // The experiment enters the chain with a route selector; later experiments
  // register as further chain entries with zero shell edits.
  ctx.slots.inject('sponge.sandbox.main', () => ctx.slots.register(
    {
      name: 'sponge.sandbox.main',
      select: (owner: SandboxMainOwnerProps) =>
        owner.route.name === 'open' && owner.route.experiment === 'pan-zoom' ? owner.route : null,
      locale: NS,
    },
    PanZoomCanvas,
  ))
}

/** The bridge's composed props: overlay runtime share + shared route store + locale. */
type SandboxPanelBridgeProps =
  PropsRuntime<'shell.overlay'>
  & PropsStore<ReturnType<typeof createSandboxRouteStore>>
  & PropsLocale<'sponge-sandbox'>
