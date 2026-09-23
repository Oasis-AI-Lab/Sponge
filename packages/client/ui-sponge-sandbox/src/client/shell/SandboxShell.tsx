/**
 * SandboxShell: the full-surface development testbed filling the frame's
 * `shell.sandbox` seat. It owns the route store seat, renders nothing while the
 * route is `'none'` (the page layer collapses back to the conversation), and
 * otherwise draws the header with a clear dev-only badge plus the chain-routed
 * experiment area. Pure component: everything arrives through the framework
 * shares, the route store, and the locale seat.
 *
 * @module @oasisailab/sponge-client-ui-sponge-sandbox
 */
import { IconCloseOutline16 } from '@oasisailab/sponge-client-ui-primitives'
import type { SandboxShellProps } from '../slots.ts'
import css from './SandboxShell.module.css'

/**
 * Render the Sandbox testbed surface (see module doc).
 */
export function SandboxShell({ useStore, actions, renderSlotChain, t }: SandboxShellProps) {
  const route = useStore(s => s.route)

  if (route.name === 'none') return null

  return (
    <div className={css.shell} data-sandbox-surface>
      <header className={css.header}>
        <div className={css.heading}>
          <div className={css.badge}>{t('shell.badge')}</div>
          <h1 className={css.title}>{t('shell.title')}</h1>
          <p className={css.subtitle}>{t('shell.subtitle')}</p>
        </div>
        <button
          type="button"
          className={css.close}
          aria-label={t('shell.close.aria')}
          onClick={() => { actions.close() }}
        >
          <IconCloseOutline16 size={16} />
        </button>
      </header>
      <main className={css.main}>
        {renderSlotChain('sponge.sandbox.main', { route })}
      </main>
    </div>
  )
}
