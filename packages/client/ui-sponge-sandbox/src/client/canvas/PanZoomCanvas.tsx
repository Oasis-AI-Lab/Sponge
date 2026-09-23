/**
 * PanZoomCanvas: the first `sponge.sandbox.main` experiment — a hand-rolled
 * DOM/SVG pan/zoom viewport proving the sandbox testbed works. MECHANISM ONLY:
 * it draws a few static boxes and connecting lines and supports pan (pointer
 * drag on the background), zoom (wheel, anchored at the cursor), and selection
 * (click a box); it carries NO slice, domain, or product semantics — those are
 * gated and land in later work. View-transform math lives in ./view.ts (pure)
 * so the equations are unit-tested; this component is the thin DOM/SVG binder.
 * No canvas/graph/component library — CSS tokens only.
 */
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { ViewTransform } from './view.ts'
import {
  CANVAS_BOXES, CANVAS_EDGES, boxCenter, initialView, panView, wheelZoomFactor, zoomAt,
} from './view.ts'
import type { PanZoomCanvasProps } from '../slots.ts'
import css from './PanZoomCanvas.module.css'

/** The gesture origin: the screen cursor and the transform captured at drag start. */
interface DragState {
  startX: number
  startY: number
  base: ViewTransform
}

/**
 * Render the pan/zoom viewport (see module doc).
 */
export function PanZoomCanvas({ t }: PanZoomCanvasProps) {
  const [view, setView] = useState<ViewTransform>(initialView)
  const [selected, setSelected] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const drag = useRef<DragState | null>(null)

  // Wheel zoom is anchored at the cursor and must be able to preventDefault, so
  // it attaches on the element with passive:false rather than React's
  // root-delegated passive listeners.
  useEffect(() => {
    const el = svgRef.current
    /* v8 ignore next 2 -- el is non-null post-mount; the ref guard is defensive, hot-mount only */
    if (el === null) return
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      setView(prev => zoomAt(prev, e.clientX - rect.left, e.clientY - rect.top, wheelZoomFactor(e.deltaY)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel) }
  }, [])

  const onPanStart = (e: React.PointerEvent<SVGRectElement>): void => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, base: view }
  }
  const onPanMove = (e: React.PointerEvent<SVGRectElement>): void => {
    const d = drag.current
    if (d === null) return
    if (e.clientX === d.startX && e.clientY === d.startY) return
    setView(panView(d.base, e.clientX - d.startX, e.clientY - d.startY))
  }
  const onPanEnd = (): void => { drag.current = null }

  const byName = new Map(CANVAS_BOXES.map(box => [box.name, box]))
  const visible = t('canvas.selected.aria', { name: selected ?? '' })

  return (
    <div className={css.panel}>
      <div className={css.status} aria-live="polite">
        {selected === null ? t('canvas.hint') : visible}
      </div>
      <svg
        ref={svgRef}
        className={css.viewport}
        role="application"
        aria-label={t('canvas.label')}
      >
        {/* The panning background sits outside the transformed group, so its
            user units equal the viewport pixels (screen space). */}
        <rect
          className={css.background}
          x={0}
          y={0}
          width="100%"
          height="100%"
          onPointerDown={onPanStart}
          onPointerMove={onPanMove}
          onPointerUp={onPanEnd}
        />
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {CANVAS_EDGES.map((edge) => {
            const from = byName.get(edge.from)
            const to = byName.get(edge.to)
            /* v8 ignore next -- shipped CANVAS_EDGES always name shipped CANVAS_BOXES; the guard only narrows the lookup */
            if (from === undefined || to === undefined) return null
            const a = boxCenter(from)
            const b = boxCenter(to)
            return (
              <line key={`${edge.from}-${edge.to}`} className={css.edge} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            )
          })}
          {CANVAS_BOXES.map(box => (
            <g
              key={box.name}
              onPointerDown={(e) => {
                e.stopPropagation()
                setSelected(box.name)
              }}
              aria-label={t('canvas.box.aria', { name: box.name })}
            >
              <rect
                className={clsx(css.box, selected === box.name && css.boxSelected)}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                rx={6}
                data-box={box.name}
              />
              <text className={css.label} x={box.x + box.width / 2} y={box.y + box.height / 2}>
                {box.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
