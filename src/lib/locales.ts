/**
 * Single source of truth for languages and primary navigation.
 *
 * These were previously duplicated across `components/Navbar.jsx` and
 * `components/landing/nav-config.ts`. Consolidating here means the i18n switch
 * (react-i18next, locale as URL prefix) touches one file rather than two navbars.
 *
 * The switcher is still cosmetic — picking a language changes the label only.
 * It becomes real when i18n lands.
 */

export interface Lang {
  /** BCP-47 code, also the future URL prefix (/en, /zh, …) */
  code: 'en' | 'zh' | 'ja' | 'ru'
  /** Short label for the collapsed switcher */
  label: string
  /** Endonym — the language's name in itself */
  full: string
}

// No flag emoji: they render as bare letter-pairs on Windows and read as noise.
// The short label (ENG / 中文 / 日本語 / РУС) is a clearer, cross-platform cue.
export const LANGS: Lang[] = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'zh', label: '中文', full: '简体中文' },
  { code: 'ja', label: '日本語', full: '日本語' },
  { code: 'ru', label: 'РУ', full: 'Русский' },
]

export const DEFAULT_LANG = LANGS[0]

export interface NavLink {
  to: string
  label: string
}

export const NAV_LINKS: NavLink[] = [
  { to: '/overview', label: 'Overview' },
  { to: '/news', label: 'News' },
  { to: '/rules', label: 'Rules' },
  { to: '/kyc', label: 'KYC/AML' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/about', label: 'About Us' },
]

export const USER_MENU_LINKS: NavLink[] = [
  { to: '/profile', label: 'Profile' },
  { to: '/orders', label: 'Exchange orders' },
  { to: '/affiliate', label: 'Affiliate program' },
]
