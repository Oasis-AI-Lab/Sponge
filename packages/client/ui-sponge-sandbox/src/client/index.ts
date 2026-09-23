/**
 * Sponge Sandbox plugin, browser half. Three registrations share one route
 * store handle (created here once): SandboxEntryButton fills one
 * `sidebar.footer.action` slot — the foot toggle that opens and closes the
 * Sandbox; SandboxShell fills the frame's `shell.sandbox` page seat and
 * declares the `sponge.sandbox.main` chain, which the experiment views enter
 * with route selectors (the shipped PanZoomCanvas claims the `pan-zoom`
 * experiment). The sandbox route store is this package's exclusive seat and is
 * deliberately independent of the Portal route store. Export discipline:
 * packages/client/AGENTS.md.
 *
 * @module @oasisailab/sponge-client-ui-sponge-sandbox
 */
import type { ClientContext } from '@oasisailab/sponge-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@oasisailab/sponge-client-locale/client'
import type { SandboxMainOwnerProps } from './slots.ts'
import { createSandboxRouteStore } from './stores.ts'
import { SandboxShell } from './shell/SandboxShell.tsx'
import { PanZoomCanvas } from './canvas/PanZoomCanvas.tsx'
import { SandboxEntryButton } from './entry/SandboxEntryButton.tsx'
import { en, zh, type SpongeSandboxKey } from './locales.ts'

export type {
  PanZoomCanvasProps, SandboxEntryButtonProps, SandboxMainOwnerProps, SandboxShellProps,
} from './slots.ts'
export type { SandboxExperiment, SandboxRoute, SandboxRouteActions, SandboxRouteState } from './stores.ts'
export { createSandboxRouteStore } from './stores.ts'
export type { SpongeSandboxKey } from './locales.ts'

declare module '@oasisailab/sponge-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Sandbox testbed surface and entry-button copy. */
    'sponge-sandbox': SpongeSandboxKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'sponge-sandbox'

/**
 * Required services (cordis fiber inject). The target slots are declared by
 * the ui-layout / ui-sidebar applies, whose activation order relative to this
 * one is NOT constrained: dsh.client.inject edges are informational
 * (loading/prefetch metadata, never apply sequencing) and neither owner
 * provides a waitable service. apply therefore depends on each slot
 * declaration through `slots.inject()` instead of assuming order.
 */
export const inject = ['slots', 'locale']

/**
 * Register the entry button, the page surface, and the experiment chain once
 * their slot declarations are on the ledger.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sponge-sandbox: dictionaries')

  // One handle shared by the foot entry and the page entry: the renderer
  // resolves a single root-scope instance, so the toggle and the surface read
  // the same route. The sandbox state is fully independent of the Portal —
  // nothing here references the portal route store.
  const sandboxStore = createSandboxRouteStore()

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'ui-sponge-sandbox', store: sandboxStore, locale: NS },
    SandboxEntryButton,
  ))

  ctx.slots.inject('shell.sandbox', () => ctx.slots.register(
    {
      name: 'shell.sandbox',
      children: { 'sponge.sandbox.main': { kind: 'chain', scope: 'root' } },
      store: sandboxStore,
      locale: NS,
    },
    SandboxShell,
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
