/**
 * `sponge-portal` namespace dictionaries: the sidebar entry button, the
 * portal navigation, the container home page, and the session-history page.
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'entry.portal': '容器',
  'entry.portal.aria': '打开容器',
  'nav.container': '容器',
  'nav.history': '历史',
  'home.title': '容器',
  'home.subtitle': 'Sponge 的标准面——居民档案与结构浏览将在后续里程碑落地。',
  'history.title': '历史会话',
  'history.empty': '暂无会话',
  'history.open.aria': '恢复会话“{name}”',
} satisfies Record<string, string>

/** The sponge-portal namespace key union. */
export type SpongePortalKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'entry.portal': 'Container',
  'entry.portal.aria': 'Open the Container',
  'nav.container': 'Container',
  'nav.history': 'History',
  'home.title': 'Container',
  'home.subtitle': 'The Sponge standard surface — resident profiles and structure browsing land in later milestones.',
  'history.title': 'Session history',
  'history.empty': 'No sessions yet',
  'history.open.aria': 'Resume session "{name}"',
} satisfies Record<SpongePortalKey, string>
