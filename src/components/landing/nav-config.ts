/**
 * Re-export shim. The single source of truth is `@/lib/locales`.
 * Kept so existing imports in the landing tree keep resolving.
 */
export { LANGS, NAV_LINKS, USER_MENU_LINKS, DEFAULT_LANG } from '@/lib/locales'
export type { Lang, NavLink } from '@/lib/locales'
