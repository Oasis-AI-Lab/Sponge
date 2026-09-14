/**
 * ContainerHome: the container home page, first entry of the
 * `sponge.portal.main` chain. M1 carries the blank page scaffold only — the
 * top summary, recent changes, navigation, and context sidebar land in later
 * milestones (portal-exec PLAN §3.2).
 */
import type { ContainerHomeProps } from '../contract/slots.ts'
import css from './ContainerHome.module.css'

/**
 * Render the container home page (see module doc).
 */
export function ContainerHome({ t }: ContainerHomeProps) {
  return (
    <div className={css.home}>
      <h1 className={css.title}>{t('home.title')}</h1>
      <p className={css.subtitle}>{t('home.subtitle')}</p>
    </div>
  )
}
