/**
 * PortalShell: the full-surface Sponge Portal page filling the frame's
 * `shell.page` seat. It owns the route store seat, renders nothing while the
 * route is `'none'` (the page layer collapses), and otherwise draws the
 * container nav plus the chain-routed main area. The startup destination
 * (decoded once by the apply from the launch URL) applies on mount; later
 * navigation rides the persisted route store. Pure component: everything
 * arrives through the framework shares, the route store, and the inject face.
 */
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { PortalShellProps } from '../contract/slots.ts'
import css from './PortalShell.module.css'

/**
 * Render the Portal page surface (see module doc).
 */
export function PortalShell({
  useStore,
  actions,
  renderSlotChain,
  startupDestination,
  open,
  t,
}: PortalShellProps) {
  const route = useStore(s => s.route)

  // One-shot startup navigation. The store persists later navigation; the
  // destination only reflects the launch URL, and re-applying it on a
  // StrictMode remount is idempotent (a resume just re-opens the session).
  const applied = useRef(false)
  useEffect(() => {
    if (applied.current) return
    applied.current = true
    switch (startupDestination.kind) {
      case 'portal': actions.openHome(); break
      case 'history': actions.openHistory(); break
      case 'resume': open(startupDestination.sessionId); break
      case 'none': break
    }
  }, [])

  if (route.name === 'none') return null

  return (
    <div className={css.shell} data-portal-surface>
      <nav className={css.nav} aria-label={t('entry.portal')}>
        <button
          type="button"
          className={clsx(css.navItem, route.name === 'home' && css.navItemActive)}
          onClick={() => { actions.openHome() }}
        >
          {t('nav.container')}
        </button>
        <button
          type="button"
          className={clsx(css.navItem, route.name === 'history' && css.navItemActive)}
          onClick={() => { actions.openHistory() }}
        >
          {t('nav.history')}
        </button>
      </nav>
      <main className={css.main}>
        {renderSlotChain('sponge.portal.main', { route })}
      </main>
    </div>
  )
}
