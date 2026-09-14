/**
 * Portal routing store: the route currently displayed in the `shell.page`
 * page seat, plus the launch-intent parser for the web startup URL.
 * `'none'` keeps the page seat empty — the conversation surface stays
 * visible below it; any named route fills the seat with the Portal surface.
 * The store persists so a plain page refresh (no startup parameters) keeps
 * the last route.
 */
import { defineStore, type EngineStoreHandle } from '@oasisailab/sponge-client-runtime/client'
import type { SessionId } from '@oasisailab/sponge-client-runtime/client'

/** One Portal route; 'none' renders nothing (the page seat stays empty). */
export type PortalRoute =
  | { readonly name: 'none' }
  | { readonly name: 'home' }
  | { readonly name: 'history' }

/** The route store snapshot. */
export interface PortalRouteState {
  /** Current route; 'none' keeps the conversation surface visible. */
  route: PortalRoute
}

/** Navigation verbs over the route state, draft-mutator form (defineStore's ActionsDecl). */
export type PortalRouteActions = {
  openHome: (draft: PortalRouteState) => void
  openHistory: (draft: PortalRouteState) => void
  close: (draft: PortalRouteState) => void
}

/**
 * Create the exclusive Portal route store handle. The apply mounts one handle
 * on both the `sidebar.footer.action` entry and the `shell.page` entry, so
 * the button and the surface share one root-scope instance.
 */
export function createPortalRouteStore(): EngineStoreHandle<PortalRouteState, PortalRouteActions> {
  return defineStore({
    init: (): PortalRouteState => ({ route: { name: 'none' } }),
    persist: 'sponge.portal.route.v1',
    actions: {
      openHome: (d) => { d.route = { name: 'home' } },
      openHistory: (d) => { d.route = { name: 'history' } },
      close: (d) => { d.route = { name: 'none' } },
    },
  })
}

/**
 * A startup navigation decoded from the web launch URL. The CLI composes the
 * query string (`?portal`, `&history`, `&resume=<id>`); the apply parses it
 * once and hands the destination to the surface through the inject face.
 */
export type StartupDestination =
  | { readonly kind: 'none' }
  | { readonly kind: 'portal' }
  | { readonly kind: 'history' }
  | { readonly kind: 'resume'; readonly sessionId: SessionId }

/**
 * Decode the startup destination from a location search string. `resume`
 * wins (it targets a concrete session), then `history` (the more specific
 * portal page), then `portal` (the home page). The resume id crosses the
 * URL boundary, so it is branded at this parse point.
 * @param search - the raw `location.search` string (`''` when absent).
 * @returns the resolved destination.
 */
export function parseStartupDestination(search: string): StartupDestination {
  const params = new URLSearchParams(search)
  const resume = params.get('resume')
  if (resume !== null && resume !== '') return { kind: 'resume', sessionId: resume as SessionId }
  if (params.has('history')) return { kind: 'history' }
  if (params.has('portal')) return { kind: 'portal' }
  return { kind: 'none' }
}
