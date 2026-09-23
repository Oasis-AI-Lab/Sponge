// @vitest-environment jsdom
/**
 * PanZoomCanvas interaction spec under the posed component form: the pan
 * (pointer drag on the background), zoom (native wheel listener anchored at the
 * cursor), and selection (click a box) mechanisms. jsdom has no layout engine,
 * so the SVG box geometry comes from getBoundingClientRect zeros and pointer
 * capture is stubbed onto the captured element; the assertions read the status
 * line and the world transform on the inner group. The math itself is unit
 * tested in view.client.spec.ts — this spec covers the DOM/SVG binder.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { PanZoomCanvasProps } from '../src/client/slots.ts'
import { PanZoomCanvas } from '../src/client/canvas/PanZoomCanvas.tsx'
import { en } from '../src/client/locales.ts'

const t: PanZoomCanvasProps['t'] = (key, params) => {
  const text = (en as Record<string, string>)[key] ?? key
  // The real locale `t` interpolates `{param}` slots; mirror it so the status
  // and box labels render fully substituted ids. The params record is
  // untyped (unknown values), so the interpolation stringifies explicitly.
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
}

// The canvas contract excludes the store share (useStore/actions), but the
// global hooks ride the runtime share and must be present; the component
// never reads them, so they are never-called stubs.
const neverHook = (() => { throw new Error('canvas must not read global hooks') }) as never

afterEach(() => {
  cleanup()
})

function mountCanvas() {
  const view = render(
    <PanZoomCanvas
      t={t}
      route={{ name: 'open', experiment: 'pan-zoom' }}
      useSessions={neverHook}
      useWorkspaces={neverHook}
    />,
  )
  const svg = view.container.querySelector('svg')!
  // The background pan rect is the first child of the svg; the world group is
  // the second. jsdom's SVG elements expose pointer capture only as undefined
  // methods, so assign them (vi.spyOn would throw on a missing property).
  const bg = svg.children[0]! as Element & {
    setPointerCapture: () => void
    releasePointerCapture: () => void
    hasPointerCapture: () => boolean
  }
  Object.assign(bg, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    hasPointerCapture: () => true,
  })
  const group = svg.querySelector('g')!
  return { ...view, svg, bg, group }
}

/** Pan by a screen delta from the given origin. */
function drag(bg: Element, from: [number, number], to: [number, number]) {
  fireEvent.pointerDown(bg, { clientX: from[0], clientY: from[1] })
  fireEvent.pointerMove(bg, { clientX: to[0], clientY: to[1] })
  fireEvent.pointerUp(bg, { clientX: to[0], clientY: to[1] })
}

/** The box group holding the text `name`. */
const boxGroup = (name: string) => screen.getByText(name).closest('g') as SVGGElement

describe('PanZoomCanvas mechanics', () => {
  it('renders the pan/zoom viewport with an initial pan hint', () => {
    mountCanvas()
    expect(screen.getByRole('application', { name: 'Pan/zoom viewport' })).toBeTruthy()
    expect(screen.getByText('Drag to pan · scroll to zoom · click to select')).toBeTruthy()
  })

  it('pans the world group by the drag delta without scrolling', () => {
    const { bg, group } = mountCanvas()
    drag(bg, [10, 10], [30, 25])
    const transform = group.getAttribute('transform')!
    expect(transform).toContain('translate(20 15)')
    expect(transform).toContain('scale(1)')
  })

  it('ignores pointer moves without an active drag', () => {
    const { bg, group } = mountCanvas()
    // Hovering over the canvas with no button down must not pan the viewport:
    // onPanMove sees an empty drag state and returns without a render.
    fireEvent.pointerMove(bg, { clientX: 40, clientY: 40 })
    expect(group.getAttribute('transform')).toContain('translate(0 0)')
  })

  it('does not re-pan when a drag has no movement', () => {
    const { bg, group } = mountCanvas()
    // A pointer down followed by a move to the same spot is a no-op: the
    // no-movement guard short-circuits before touching the transform.
    drag(bg, [10, 10], [10, 10])
    expect(group.getAttribute('transform')).toContain('translate(0 0)')
  })

  it('zooms about the cursor via the wheel, anchoring the world point under it', () => {
    const { svg, group } = mountCanvas()
    fireEvent.wheel(svg, { deltaY: 100 })
    const transform = group.getAttribute('transform')!
    // A downward scroll zooms out; the new scale is clamped within the band.
    expect(transform).not.toContain('scale(1)')
    const scale = Number(transform.match(/scale\(([\d.]+)\)/)![1])
    expect(scale).toBeLessThan(1)
  })

  it('animates the hint into a selection announcement when a box is clicked', () => {
    const { bg, group } = mountCanvas()
    const a = boxGroup('a')
    fireEvent.pointerDown(a)
    expect(screen.getByText('Selected box a')).toBeTruthy()
    // The selected box carries the selected class on top of its base class.
    expect(a.querySelector('rect')!.classList.length).toBe(2)
    expect(boxGroup('b').querySelector('rect')!.classList.length).toBe(1)
    // Selection must not also pan the viewport.
    expect(group.getAttribute('transform')).toContain('scale(1)')
    // Panning the background still works after a selection.
    drag(bg, [40, 40], [44, 40])
    expect(group.getAttribute('transform')).toContain('translate(4 0)')
  })

  it('selects a different box and clears the selection status only by a new hint-state change', () => {
    const { bg } = mountCanvas()
    const a = boxGroup('a')
    const c = boxGroup('c')
    fireEvent.pointerDown(a)
    expect(screen.getByText('Selected box a')).toBeTruthy()
    fireEvent.pointerDown(c)
    expect(boxGroup('a').querySelector('rect')!.classList.length).toBe(1)
    expect(c.querySelector('rect')!.classList.length).toBe(2)
    expect(screen.getByText('Selected box c')).toBeTruthy()
    // A bare background drag does not clear the selection (status only flips
    // on a box click), so the machinery stays quiet.
    drag(bg, [50, 50], [50, 60])
    expect(screen.getByText('Selected box c')).toBeTruthy()
  })
})
