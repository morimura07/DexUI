import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, Globe, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/lib/i18n'
import ThemeToggle from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { MobileMenu } from './mobile-menu'
import { LANGS, NAV_LINKS, USER_MENU_LINKS } from './nav-config'

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, isLoggedIn, logout } = useAuth()
  const { lang, setLang, t } = useI18n()
  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[0]
  const navLabel = (to: string) => t(`nav.${to.slice(1)}`)
  const navigate = useNavigate()
  const location = useLocation()
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      if (y < lastScrollY || y < 10) setIsVisible(true)
      else if (y > lastScrollY && y > 100) setIsVisible(false)
      setLastScrollY(y)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (langRef.current && !langRef.current.contains(target)) setLangOpen(false)
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  const active = (path: string) => location.pathname === path
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials =
    user?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'SS'

  return (
    <>
      <nav
        className={`fixed left-1/2 z-50 w-full max-w-7xl -translate-x-1/2 px-6 transition-all duration-700 ease-in-out ${
          isVisible ? 'top-8 opacity-100' : '-top-24 opacity-0'
        }`}
      >
        <div className="flex w-full items-center gap-6 rounded-full border border-fg/10 bg-bg/50 px-6 py-3 shadow-lg backdrop-blur-[120px]">
          <Link to="/overview" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-fg">
            <Logo className="h-6" />
            SwiftSwap
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-border p-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                    active(l.to) ? 'bg-brand text-white' : 'text-muted hover:text-fg'
                  }`}
                >
                  {navLabel(l.to)}
                </Link>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ThemeToggle />

            <div className="relative hidden md:block" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-transparent px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-fg"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{currentLang.label}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 z-50 min-w-[190px] overflow-hidden rounded-xl border border-border bg-bg2 shadow-xl">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code)
                        setLangOpen(false)
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-[12.5px] transition-colors hover:bg-bg3 ${
                        lang === l.code ? 'text-fg' : 'text-muted'
                      }`}
                    >
                      <span>{l.full}</span>
                      {lang === l.code && <Check className="h-3.5 w-3.5 text-brand-fg" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:text-fg"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/exchange"
                  className="rounded-full bg-brand px-[18px] py-[10px] font-medium text-white transition-colors hover:bg-brand-h"
                >
                  {t('nav.exchange')}
                </Link>
              </div>
            ) : (
              <div className="relative hidden md:block" ref={userRef}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand text-xs font-medium text-white transition-transform hover:scale-105"
                >
                  {initials}
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-12 z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-bg2 shadow-xl">
                    <div className="truncate border-b border-border px-4 py-3 text-[11.5px] text-subtle">
                      {user?.email}
                    </div>
                    {USER_MENU_LINKS.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setUserOpen(false)}
                        className={`block px-4 py-2.5 text-[12.5px] transition-colors hover:bg-bg3 ${
                          active(item.to) ? 'font-medium text-fg' : 'text-muted'
                        }`}
                      >
                        {navLabel(item.to)}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full cursor-pointer border-none bg-transparent px-4 py-2.5 text-left text-[12.5px] text-muted transition-colors hover:bg-bg3 hover:text-red"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hides at lg, not md: the desktop links only appear at lg, so an md
                cutoff would strand every link between 768–1023px. */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label={t('nav.openMenu')}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-fg transition-colors hover:bg-fg/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
    </>
  )
}
