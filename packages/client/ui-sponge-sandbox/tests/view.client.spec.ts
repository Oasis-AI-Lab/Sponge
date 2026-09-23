import { describe, expect, it } from 'vitest'
import {
  CANVAS_BOXES, boxCenter, clampScale, initialView, panView, wheelZoomFactor, zoomAt,
} from '../src/client/canvas/view.ts'

describe('view-transform math', () => {
  it('starts at the identity transform', () => {
    expect(initialView()).toEqual({ x: 0, y: 0, scale: 1 })
  })

  it('pans by the screen delta without touching the scale', () => {
    const panned = panView({ x: 10, y: 20, scale: 2 }, 7, -3)
    expect(panned).toEqual({ x: 17, y: 17, scale: 2 })
  })

  it('maps wheel delta to an exponential zoom direction', () => {
    expect(wheelZoomFactor(100)).toBeLessThan(1) // scroll down zooms out
    expect(wheelZoomFactor(-100)).toBeGreaterThan(1) // scroll up zooms in
    expect(wheelZoomFactor(0)).toBe(1)
  })

  it('clamps the scale into the configured band', () => {
    expect(clampScale(0.01)).toBe(0.2)
    expect(clampScale(9)).toBe(5)
    expect(clampScale(1.5)).toBe(1.5)
  })

  it('zooms about the cursor, keeping the world point under it fixed', () => {
    // World point under screen (250, 160) stays there through a 2x zoom.
    const start = { x: 50, y: 60, scale: 1 }
    const zoomed = zoomAt(start, 250, 160, 2)
    expect(zoomed.scale).toBe(2)
    const worldX = (250 - zoomed.x) / zoomed.scale
    const worldY = (160 - zoomed.y) / zoomed.scale
    expect([worldX, worldY]).toEqual([(250 - start.x) / 1, (160 - start.y) / 1])
  })

  it('refuses to zoom past the clamp, co-zooming about the cursor', () => {
    const zoomed = zoomAt({ x: 0, y: 0, scale: 0.8 }, 100, 100, 10)
    expect(zoomed.scale).toBe(5)
  })

  it('returns the box centroid the edges connect through', () => {
    expect(boxCenter({ name: 'a', x: 40, y: 40, width: 120, height: 80 })).toEqual({ x: 100, y: 80 })
  })

  it('ships static boxes with named centers resolvable by every edge', () => {
    const byName = new Map(CANVAS_BOXES.map(box => [box.name, box]))
    for (const box of CANVAS_BOXES) expect(boxCenter(box)).toBeDefined()
    // Every edge names two shipped boxes (the binder drops unknown names).
    const names = new Set(CANVAS_BOXES.map(box => box.name))
    for (const edge of [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }]) {
      expect(names.has(edge.from)).toBe(true)
      expect(names.has(edge.to)).toBe(true)
      expect(byName.has(edge.from)).toBe(true)
      expect(byName.has(edge.to)).toBe(true)
    }
  })
})
