/**
 * ui-sponge-sandbox contracts. Three registrations live in this package:
 *
 * - SandboxShell fills the frame's `shell.sandbox` page seat (declared by
 *   ui-layout) — the full-surface development testbed with a badge marking it
 *   as a dev-only surface. It declares the `sponge.sandbox.main` chain and
 *   seats the shared route store.
 * - SandboxEntryButton fills one `sidebar.footer.action` slot (declared by
 *   ui-sidebar) — the toggle that opens the Sandbox and closes it back to the
 *   conversation surface. It seats the SAME route-store handle, so the two
 *   entries share one root-scope instance.
 * - PanZoomCanvas enters the `sponge.sandbox.main` chain as the first
 *   experiment — a hand-rolled pan/zoom viewport. Future experiments register
 *   as further chain entries with zero shell edits.
 *
 * The sandbox state is fully independent of the Portal: the route store is
 * this package's exclusive seat and nothing here references the portal route
 * store, so toggling one surface never affects the other.
 */
import type { PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@oasisailab/sponge-client-ui-slots'
// Type-only: pull the owner SlotMap merges into programs that resolve the
// runtime shares below.
import type {} from '@oasisailab/sponge-client-ui-layout/client'
import type {} from '@oasisailab/sponge-client-ui-sidebar/client'
import type { SandboxRoute } from './stores.ts'
import type { createSandboxRouteStore } from './stores.ts'

declare module '@oasisailab/sponge-client-ui-slots' {
  interface SlotMap {
    /**
     * The sandbox experiment chain: each experiment registers here and claims
     * the experiment id it serves through its pure selector. Declared by this
     * package's `shell.sandbox` entry; the SandboxShell renders the chain with
     * the selected experiment as the owner currency. Later experiments add
     * further entries with zero owner changes.
     */
    'sponge.sandbox.main': { kind: 'chain'; scope: 'root'; owner: SandboxMainOwnerProps }
  }
}

/** Chain currency the SandboxShell hands the experiments: the current route. */
export interface SandboxMainOwnerProps {
  /** The route the chain elects an experiment view for; 'none' never reaches the chain (the shell renders nothing). */
  readonly route: SandboxRoute
}

/** Full SandboxShell props: page-seat runtime share + experiment chain + shared route store + locale. */
export type SandboxShellProps =
  PropsRuntime<'shell.sandbox'>
  & PropsRenderSlots<'sponge.sandbox.main'>
  & PropsStore<ReturnType<typeof createSandboxRouteStore>>
  & PropsLocale<'sponge-sandbox'>

/** Full entry-button props: footer-action runtime share + shared route store + locale. */
export type SandboxEntryButtonProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsStore<ReturnType<typeof createSandboxRouteStore>>
  & PropsLocale<'sponge-sandbox'>

/** Full pan/zoom canvas props: chain runtime share + elected route + locale. */
export type PanZoomCanvasProps =
  PropsRuntime<'sponge.sandbox.main'>
  & { readonly route: SandboxRoute }
  & PropsLocale<'sponge-sandbox'>
