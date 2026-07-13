import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { dictionaries, type LangCode, SUPPORTED } from './translations'

/**
 * Lightweight i18n: a localStorage-backed language context in the same shape as
 * `theme.tsx`. No external dependency, no URL-prefix routing. `t('a.b.c')` walks
 * the active dictionary, falls back to English, then to the key itself, so a
 * missing translation degrades to readable English rather than blank UI.
 *
 * Coverage is the core UI (nav, auth, landing). Legal prose (Rules, KYC/AML)
 * stays English on purpose — machine-translated compliance text carries real
 * liability. The zh/ja/ru tables are drafts pending native review.
 */

const STORAGE_KEY = 'ss_lang'

function initialLang(): LangCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (SUPPORTED as readonly string[]).includes(stored)) return stored as LangCode
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
    if ((SUPPORTED as readonly string[]).includes(nav)) return nav as LangCode
  } catch {
    // storage disabled / SSR — fall through to English
  }
  return 'en'
}

/** Walk a dotted path (`auth.login.title`) into a nested dictionary object. */
function resolve(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => {
    if (o && typeof o === 'object') return (o as Record<string, unknown>)[k]
    return undefined
  }, dict)
}

type Vars = Record<string, string | number>

interface I18nValue {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>(initialLang)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore — language still applies for this session
    }
  }, [lang])

  const t = useCallback(
    (key: string, vars?: Vars): string => {
      const hit = resolve(dictionaries[lang], key)
      const raw = typeof hit === 'string' ? hit : resolve(dictionaries.en, key)
      if (typeof raw !== 'string') return key
      if (!vars) return raw
      // Drop tokens whose value is missing rather than printing a literal
      // "{token}" — a stray brace in the UI reads as a bug to end users.
      return raw.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : ''))
    },
    [lang],
  )

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <LangProvider>')
  return ctx
}

/** Convenience hook for components that only need the translate function. */
export function useT(): (key: string, vars?: Vars) => string {
  return useI18n().t
}
