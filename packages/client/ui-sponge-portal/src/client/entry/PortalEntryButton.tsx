/**
 * PortalEntryButton: the sidebar-foot toggle that opens the Portal and closes
 * it back to the conversation surface. It seats the SAME route-store handle
 * as the PortalShell entry, so both read one route instance; the rail state
 * follows the `wide` owner share like the other foot actions.
 */
import { IconBrowseOutline16 } from '@oasisailab/sponge-client-ui-primitives'
import type { PortalEntryButtonProps } from '../contract/slots.ts'
import css from './PortalEntryButton.module.css'

/**
 * Render the Portal toggle (see module doc).
 */
export function PortalEntryButton({ useStore, actions, wide, t }: PortalEntryButtonProps) {
  const route = useStore(s => s.route)
  const open = route.name === 'none'
  return (
    <button
      type="button"
      className={css.entry}
      aria-label={t('entry.portal.aria')}
      aria-pressed={!open}
      title={wide ? undefined : t('entry.portal')}
      onClick={() => { if (open) actions.openHome(); else actions.close() }}
    >
      <IconBrowseOutline16 size={wide ? 14 : 18} />
      {wide && <span className={css.label}>{t('entry.portal')}</span>}
    </button>
  )
}
