/**
 * ui-sponge-portal contracts. Two registrations live in this package:
 *
 * - PortalShell fills the frame's `shell.page` page seat (declared by
 *   ui-layout) — the full-surface Portal page with the container nav and the
 *   chain-routed main area. It declares the `sponge.portal.main` chain and
 *   seats the shared route store.
 * - PortalEntryButton fills one `sidebar.footer.action` slot (declared by
 *   ui-sidebar) — the toggle that opens the Portal and closes it back to the
 *   conversation surface. It seats the SAME route-store handle, so the two
 *   entries share one root-scope instance.
 *
 * Both own no data of their own: the container home and history pages read
 * real Host Sessions through the global useSessions hook; the route store is
 * the only mutable state and it is this package's exclusive seat.
 */
import type { PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@oasisailab/sponge-client-ui-slots'
// Type-only: pull the owner SlotMap merges into programs that resolve the
// runtime shares below.
import type {} from '@oasisailab/sponge-client-ui-layout/client'
import type {} from '@oasisailab/sponge-client-ui-sidebar/client'
import type { SessionId } from '@oasisailab/sponge-client-runtime/client'
import type { createPortalRouteStore, PortalRoute, StartupDestination } from '../stores.ts'

declare module '@oasisailab/sponge-client-ui-slots' {
  interface SlotMap {
    /**
     * The Portal main-page chain: each named Portal page registers here and
     * claims the route it serves through its pure selector. Declared by this
     * package's `shell.page` entry; the PortalShell renders the chain with
     * the current route as the owner currency, so a page change re-elects
     * the matching entry. Later milestones add the resident-profile and
     * structure pages as further entries with zero owner changes.
     */
    'sponge.portal.main': { kind: 'chain'; scope: 'root'; owner: PortalMainOwnerProps }
  }
}

/** Chain currency the PortalShell hands the main pages: the current route. */
export interface PortalMainOwnerProps {
  /** The route the chain elects a page for; `'none'` never reaches the chain (the shell renders nothing). */
  readonly route: PortalRoute
}

/** PortalShell injected share: the startup destination plus the resume verb. */
export interface PortalShellInjected {
  /** Startup navigation decoded once from the web launch URL. */
  readonly startupDestination: StartupDestination
  /** Open a real Session (the `--resume` destination). */
  open: (sessionId: SessionId) => void
}

/** Full PortalShell props: page-seat runtime share + main chain + shared route store + inject + locale. */
export type PortalShellProps =
  PropsRuntime<'shell.page'>
  & PropsRenderSlots<'sponge.portal.main'>
  & PropsStore<ReturnType<typeof createPortalRouteStore>>
  & PortalShellInjected
  & PropsLocale<'sponge-portal'>

/** History page injected share: the resume verb over a listed session. */
export interface HistoryPageInjected {
  /** Open a real Session from the history list. */
  open: (sessionId: SessionId) => void
}

/** Full history page props: chain runtime share + elected route + inject + locale. */
export type HistoryPageProps =
  PropsRuntime<'sponge.portal.main'>
  & { readonly route: PortalRoute }
  & HistoryPageInjected
  & PropsLocale<'sponge-portal'>

/** Full container home props: chain runtime share + elected route + locale. */
export type ContainerHomeProps =
  PropsRuntime<'sponge.portal.main'>
  & { readonly route: PortalRoute }
  & PropsLocale<'sponge-portal'>

/** Full entry-button props: footer-action runtime share + shared route store + locale. */
export type PortalEntryButtonProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsStore<ReturnType<typeof createPortalRouteStore>>
  & PropsLocale<'sponge-portal'>
