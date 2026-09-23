/**
 * Pure pan/zoom viewport math for the sandbox mechanics experiment. A view is
 * the SVG world transform `{ x, y, scale }`: the world point `(wx, wy)` maps to
 * screen `(x + wx*scale, y + wy*scale)`. All geometry is world units; pan/zoom
 * manipulate the transform only. React-free so the equations are unit-tested
 * directly and the component stays a thin DOM/SVG binder.
 */

/** The viewport transform: world→screen translation plus a uniform scale. */
export interface ViewTransform {
  /** World-origin screen x offset. */
  x: number
  /** World-origin screen y offset. */
  y: number
  /** Uniform scale factor (1 = 1 world unit per px). */
  scale: number
}

/** Clamp limits the zoom gesture respects. */
export const MIN_SCALE = 0.2
/** Clamp limits the zoom gesture respects. */
export const MAX_SCALE = 5

/** A static box drawn in world coordinates; `name` keys the selectable identity. */
export interface CanvasBox {
  /** Stable box name, also its accessible label suffix. */
  name: string
  /** World x of the box's top-left corner. */
  x: number
  /** World y of the box's top-left corner. */
  y: number
  /** World width. */
  width: number
  /** World height. */
  height: number
}

/** A connecting line between two named boxes. */
export interface CanvasEdge {
  /** Source box name. */
  from: string
  /** Target box name. */
  to: string
}

/** A world point; used as the wheel cursor and box centers. */
export interface Point {
  x: number
  y: number
}

/** The shipped boxes — static shapes with no product or domain meaning. */
export const CANVAS_BOXES: readonly CanvasBox[] = [
  { name: 'a', x: 40, y: 40, width: 120, height: 80 },
  { name: 'b', x: 260, y: 40, width: 160, height: 96 },
  { name: 'c', x: 40, y: 220, width: 96, height: 104 },
]

/** Lines joining the named boxes above; resolved through the box map when drawn. */
export const CANVAS_EDGES: readonly CanvasEdge[] = [
  { from: 'a', to: 'b' },
  { from: 'a', to: 'c' },
]

/** The default transform the canvas starts at. */
export function initialView(): ViewTransform {
  return { x: 0, y: 0, scale: 1 }
}

/**
 * Pan the view by a screen delta.
 * @param view - the current transform.
 * @param dx - screen-space horizontal delta.
 * @param dy - screen-space vertical delta.
 * @returns the panned transform.
 */
export function panView(view: ViewTransform, dx: number, dy: number): ViewTransform {
  return { x: view.x + dx, y: view.y + dy, scale: view.scale }
}

/**
 * Convert a wheel delta to a multiplicative zoom step. A downward scroll
 * (deltaY > 0) zooms out; exponential keeps the motion linear in hand feel.
 * @param deltaY - the wheel deltaY.
 * @returns the per-event scale multiplier.
 */
export function wheelZoomFactor(deltaY: number): number {
  return Math.exp(-deltaY * 0.0015)
}

/**
 * Clamp a scale into [{@link MIN_SCALE}, {@link MAX_SCALE}].
 * @param scale - the raw scale.
 * @returns the bounded scale.
 */
export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/**
 * Zoom the view about a screen point, keeping the world point under the cursor
 * fixed. Screen `(cx, cy)` maps to world-derived `((cx - view.x) / scale, ...)`;
 * after scaling by `factor'` the translation is corrected so that world point
 * returns to `(cx, cy)`.
 * @param view - the current transform.
 * @param cx - cursor screen x.
 * @param cy - cursor screen y.
 * @param factor - the raw zoom multiplier (unclamped).
 * @returns the new transform.
 */
export function zoomAt(view: ViewTransform, cx: number, cy: number, factor: number): ViewTransform {
  const scale = clampScale(view.scale * factor)
  const applied = scale / view.scale
  return {
    x: cx - (cx - view.x) * applied,
    y: cy - (cy - view.y) * applied,
    scale,
  }
}

/** The box bounding-circle center the lines connect at (world units). */
export function boxCenter(box: CanvasBox): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
