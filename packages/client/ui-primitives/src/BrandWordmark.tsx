// Sponge brand wordmark (geometric, not extracted): diamond mark + all-caps
// "SPONGE" letterforms in one svg. Ink rides currentColor; the name renders
// with the platform sans (the workspace font stack) so bounds stay legible
// without bundling a display font. includeMark=false drops the leading diamond
// for the name-only artwork.

import type { IconProps } from './icons/props.ts'

// Layout is hardcoded in viewBox units (x runs left to right at height 24).
const MARK_SIZE = 24
const GAP = 8
// Width of the "SPONGE" text at fontWeight 700 / fontSize 19 / ls 1.5; generous
// so the label reads clearly across platforms without a bundled font.
const TEXT_WIDTH = 84
const BASELINE = 18

/** Display options for the sponge brand wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading diamond mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render the full brand wordmark.
 * @param props.size - height in px (default 24; width follows the selected artwork).
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading diamond mark.
 * @returns the wordmark svg (aria-hidden decorative brand art).
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  const total = (includeMark ? MARK_SIZE + GAP + TEXT_WIDTH : TEXT_WIDTH)
  const textX = includeMark ? MARK_SIZE + GAP : 0
  return (
    <svg
      width={(size * total) / 24}
      height={size}
      className={className}
      viewBox={`0 0 ${total} 24`}
      fill="none"
      aria-hidden="true"
    >
      {includeMark
        ? <path d="M12 1 L23 12 L12 23 L1 12 Z" fill="currentColor" />
        : null}
      <text
        x={textX}
        y={BASELINE}
        fontFamily="Inter, 'Segoe UI', system-ui, sans-serif"
        fontSize="19"
        fontWeight="700"
        letterSpacing="1.5"
        fill="currentColor"
      >
        SPONGE
      </text>
    </svg>
  )
}
