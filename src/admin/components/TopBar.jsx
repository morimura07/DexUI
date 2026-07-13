import { Menu } from 'lucide-react';
import { useT, useI18n } from '../../lib/i18n';
import { LANGS } from '../../lib/locales';

const TABS = ['dashboard', 'orders', 'users', 'wallets', 'routes', 'analytics', 'support', 'reviews', 'logs', 'settings'];

export default function TopBar({ tab, onLogout, onMenuToggle }) {
  const t = useT();
  const { lang, setLang } = useI18n();
  const known = TABS.includes(tab);
  const title = known ? t(`admin.topbar.meta.${tab}.title`) : t('admin.topbar.fallbackTitle');
  const subtitle = known ? t(`admin.topbar.meta.${tab}.subtitle`) : '';
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg3 hover:text-fg md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="text-base font-medium leading-tight text-fg">{title}</div>
          {subtitle && <div className="hidden text-xs text-subtle sm:block">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Language switcher — segmented row of the supported languages */}
        <div role="group" aria-label={t('admin.topbar.language')} className="hidden items-center gap-0.5 rounded-lg border border-border bg-bg2 p-0.5 sm:flex">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                lang === l.code ? 'bg-bg3 font-medium text-fg' : 'text-muted hover:text-fg'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <a href="/" className="hidden text-sm text-muted transition-colors hover:text-fg md:block">← {t('admin.topbar.site')}</a>
        <button
          onClick={onLogout}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-red/40 hover:text-red"
        >
          {t('admin.common.logout')}
        </button>
      </div>
    </header>
  );
}
