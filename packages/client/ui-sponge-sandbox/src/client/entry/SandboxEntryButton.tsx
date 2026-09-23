/**
 * SandboxEntryButton: the sidebar-foot toggle that opens the Sandbox and closes
 * it back to the conversation surface. It seats the SAME route-store handle as
 * the SandboxShell entry, so both read one route instance; the rail state
 * follows the `wide` owner share like the other foot actions. The fullscreen
 * frame glyph mirrors the pan/zoom viewport the surface hosts.
 *
 * @module @oasisailab/sponge-client-ui-sponge-sandbox
 */
import { IconFullscreenOutline16 } from '@oasisailab/sponge-client-ui-primitives'
import type { SandboxEntryButtonProps } from '../slots.ts'
import css from './SandboxEntryButton.module.css'

/**
 * Render the Sandbox toggle (see module doc).
 */
export function SandboxEntryButton({ useStore, actions, wide, t }: SandboxEntryButtonProps) {
  const route = useStore(s => s.route)
  const open = route.name === 'none'
  return (
    <button
      type="button"
      className={css.entry}
      aria-label={t('entry.sandbox.aria')}
      aria-pressed={!open}
      title={wide ? undefined : t('entry.sandbox')}
      onClick={() => { if (open) actions.open(); else actions.close() }}
    >
      <IconFullscreenOutline16 size={wide ? 14 : 18} />
      {wide && <span className={css.label}>{t('entry.sandbox')}</span>}
    </button>
  )
}
