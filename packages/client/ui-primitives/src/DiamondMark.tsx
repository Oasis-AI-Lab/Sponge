// Sponge diamond mark: the rotated-square container glyph that replaces the
// DeepSeek whale (figma none; geometric, not extracted). Native 24x24, ink
// rides currentColor. Square, so height tracks the size prop 1:1; hero usage
// scales up via the size prop like the fish did.

import type { IconProps } from './icons/props.ts'

/**
 * Render the sponge diamond mark.
 * @param props.size - width and height in px (default 24).
 * @param props.className - extra class for layout placement.
 * @returns the mark svg (aria-hidden; pair with the wordmark for accessibility).
 */
export function DiamondMark({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 1 L23 12 L12 23 L1 12 Z" fill="currentColor" />
    </svg>
  )
}
