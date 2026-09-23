# @oasisailab/sponge-client-ui-sponge-sandbox

English | [中文](README.zh.md)

Sponge development testbed plugin: it fills the frame's `shell.sandbox` page seat with a clearly badged, dev-only surface and a sidebar-foot entry button that toggles it. The seat exists to prove a mechanism pointer; it carries NO product semantics of its own — the canvas mechanics here are trialed before they land in the Editor. The sandbox route store is this package's exclusive seat and is deliberately independent of the Portal route store, so toggling one surface never affects the other.

`SandboxShell` fills `shell.sandbox` and renders nothing while the route is `'none'` (the page layer collapses back to the conversation), otherwise a header with a development badge plus the chain-routed experiment area. It declares the `sponge.sandbox.main` chain, which experiment views enter with route selectors. `SandboxEntryButton` fills one `sidebar.footer.action` slot and seats the SAME route-store handle, so the toggle and the surface share one root-scope instance. There is no interaction with `shell.page`, whose occupant stays the Portal surface.

The shipped experiment is a hand-rolled DOM/SVG pan/zoom viewport (no canvas, graph, or component library — CSS tokens only): static boxes and connecting lines, plus pan by drag, zoom by wheel anchored at the cursor, and box selection by click. The view-transform math lives in a pure module (`zoomAt`, `panView`, `wheelZoomFactor`, `clampScale`) so the equations are unit-tested; the component is a thin DOM/SVG binder. This is mechanism only, with no slice, domain, or product semantics.

Removing the package's `dsh.client` row from `cordis.patch.yml` drops the entry button and the entry-button surface with zero cost: the `shell.sandbox` seat remains empty, renders no DOM, and leaves the conversation surface and Portal untouched.

The `/client` exports are the plugin body (`apply`/`inject`) plus the contract types only; SandboxShell, SandboxEntryButton, the canvas binder, and the route store remain package-internal behind the slot registrations. The node half ships an empty `apply`.

## Model Experience

None; the sandbox surface renders local UI state only and nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Mechanism only, no semantics** — the boxes and lines carry no slice, domain, or editor meaning; those are gated and land in later work.
- **One shipped experiment** — the `pan-zoom` viewport is registered as the sole chain entry; later experiments add further entries with zero shell edits.
- **Independent persistence key** — the route store persists under its own `sponge.sandbox.route.v1` namespace, separate from the Portal's.