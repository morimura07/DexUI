import { en, type Dictionary, type PartialDictionary } from './en'
import { zh } from './zh'
import { ja } from './ja'
import { ru } from './ru'
import { contactsPack } from './pages/contacts'
import { aboutPack } from './pages/about'
import { exchangePack } from './pages/exchange'
import { userPack } from './pages/userpages'
import { legalPack } from './pages/legal'
import { adminCorePack } from './pages/admin-core'
import { adminBPack } from './pages/admin-b'
import { adminCPack } from './pages/admin-c'

export type { Dictionary }
export type LangCode = 'en' | 'zh' | 'ja' | 'ru'

export const SUPPORTED = ['en', 'zh', 'ja', 'ru'] as const

/** A translation pack contributes one or more top-level namespaces, in all four
 *  languages, merged onto the base tables below. Page fragments live in ./pages
 *  so each can be authored independently without touching the core files. */
export interface Pack {
  en: Record<string, unknown>
  zh: Record<string, unknown>
  ja: Record<string, unknown>
  ru: Record<string, unknown>
}

const bases: Record<LangCode, Record<string, unknown>> = { en, zh, ja, ru }
const packs: Pack[] = [
  contactsPack,
  aboutPack,
  exchangePack,
  userPack,
  legalPack,
  adminCorePack,
  adminBPack,
  adminCPack,
]

function build(lang: LangCode): PartialDictionary {
  const d: Record<string, unknown> = { ...bases[lang] }
  for (const p of packs) Object.assign(d, p[lang])
  return d as PartialDictionary
}

/**
 * English is the complete, authoritative table. The zh/ja/ru drafts are typed as
 * partial mirrors: the runtime resolver falls back to English per missing key, so
 * an incomplete draft degrades gracefully instead of failing to compile.
 */
export const dictionaries: Record<LangCode, PartialDictionary> = {
  en: build('en'),
  zh: build('zh'),
  ja: build('ja'),
  ru: build('ru'),
}
