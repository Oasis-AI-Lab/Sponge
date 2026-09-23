/**
 * Sandbox routing store: the experiment currently displayed in the
 * `shell.sandbox` page seat. `'none'` keeps the page seat empty — the
 * conversation surface stays visible; an open route fills the seat with the
 * sandbox surface showing the selected experiment. The store persists so a
 * plain page refresh keeps the last sandbox state.
 */
import { defineStore, type EngineStoreHandle } from '@oasisailab/sponge-client-runtime/client'

/** The one shipped experiment id; later experiments extend this union. */
export type SandboxExperiment = 'pan-zoom'

/** One sandbox route; 'none' renders nothing (the page seat stays empty). */
export type SandboxRoute =
  | { readonly name: 'none' }
  | { readonly name: 'open'; readonly experiment: SandboxExperiment }

/** The route store snapshot. */
export interface SandboxRouteState {
  /** Current route; 'none' keeps the conversation surface visible. */
  route: SandboxRoute
}

/** Navigation verbs over the route state, draft-mutator form (defineStore's ActionsDecl). */
export type SandboxRouteActions = {
  open: (draft: SandboxRouteState) => void
  select: (draft: SandboxRouteState, experiment: SandboxExperiment) => void
  close: (draft: SandboxRouteState) => void
}

/**
 * Create the exclusive Sandbox route store handle. The apply mounts one handle
 * on both the `sidebar.footer.action` entry and the `shell.sandbox` entry, so
 * the button and the surface share one root-scope instance.
 */
export function createSandboxRouteStore(): EngineStoreHandle<SandboxRouteState, SandboxRouteActions> {
  return defineStore({
    init: (): SandboxRouteState => ({ route: { name: 'none' } }),
    persist: 'sponge.sandbox.route.v1',
    actions: {
      open: (d) => { d.route = { name: 'open', experiment: 'pan-zoom' } },
      select: (d, experiment) => { d.route = { name: 'open', experiment } },
      close: (d) => { d.route = { name: 'none' } },
    },
  })
}
