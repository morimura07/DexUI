import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/lib/i18n'
import { LANGS, NAV_LINKS, USER_MENU_LINKS } from './nav-config'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export function MobileMenu({ open, onClose, onLogout }: MobileMenuProps) {
  const { user, isLoggedIn } = useAuth()
  const { lang, setLang, t } = useI18n()
  const location = useLocation()
  const active = (path: string) => location.pathname === path
  const navLabel = (to: string) => t(`nav.${to.slice(1)}`)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const initials =
    user?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'SS'

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm lg:hidden" />}

      <div
        className={`fixed right-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto border-l border-border bg-bg2 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex min-h-[60px] items-center justify-between border-b border-border px-5 py-4">
          <span className="font-semibold text-fg">SwiftSwap</span>
          <button
            onClick={onClose}
            aria-label={t('nav.menu')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg3 hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col border-b border-border py-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={`border-l-[3px] px-5 py-3.5 text-sm font-medium transition-all ${
                active(l.to)
                  ? 'border-brand bg-brand/10 font-semibold text-fg'
                  : 'border-transparent text-muted hover:bg-bg3 hover:text-fg'
              }`}
            >
              {navLabel(l.to)}
            </Link>
          ))}
        </div>

        <div className="border-b border-border p-5">
          {!isLoggedIn ? (
            <div className="flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={onClose}
                className="rounded-full border border-border py-2.5 text-center text-sm font-medium text-fg transition-colors hover:bg-fg/5"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="rounded-full bg-brand py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-h"
              >
                {t('auth.login.signup')}
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center gap-2.5 border-b border-border pb-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-fg">{user?.name || 'Account'}</div>
                  <div className="truncate text-[11px] text-subtle">{user?.email}</div>
                </div>
              </div>
              {USER_MENU_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`block py-2.5 text-sm transition-colors ${
                    active(item.to) ? 'font-medium text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  {navLabel(item.to)}
                </Link>
              ))}
              <button
                onClick={() => {
                  onClose()
                  onLogout()
                }}
                className="mt-1 w-full cursor-pointer border-none bg-transparent py-2.5 text-left text-sm text-muted transition-colors hover:text-red"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto p-5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-subtle">{t('nav.language')}</div>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  lang === l.code
                    ? 'border-brand bg-brand/10 font-medium text-fg'
                    : 'border-border text-muted hover:text-fg'
                }`}
              >
                {l.full}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
