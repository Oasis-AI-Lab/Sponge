/**
 * HistoryPage: the session-history page, second entry of the
 * `sponge.portal.main` chain. Reads real Host Sessions through the global
 * useSessions hook (the `--history` startup destination and the nav tab both
 * land here), lists the non-blank sessions by last update, and opens the
 * chosen session through the injected resume verb — closing the Portal is
 * the conversation surface's own reveal, driven by the same open.
 */
import type { HistoryPageProps } from '../contract/slots.ts'
import css from './HistoryPage.module.css'

/**
 * Render the session-history page (see module doc).
 */
export function HistoryPage({ useSessions, open, t }: HistoryPageProps) {
  const sessions = useSessions(s => s)
  const rows = sessions.ids
    .map(id => sessions.byId[id])
    .filter((session): session is NonNullable<typeof session> => session !== undefined && !session.blank)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  if (rows.length === 0) {
    return <p className={css.empty}>{t('history.empty')}</p>
  }

  return (
    <ul className={css.list}>
      {rows.map(session => (
        <li key={session.id}>
          <button
            type="button"
            className={css.row}
            aria-label={t('history.open.aria', { name: session.displayTitle })}
            onClick={() => { open(session.id) }}
          >
            <span className={css.title}>{session.displayTitle}</span>
            <span className={css.meta}>{session.id}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
