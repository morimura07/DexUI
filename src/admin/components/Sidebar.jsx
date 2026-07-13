import {
  LayoutDashboard, ClipboardList, Users, Wallet, Repeat, BarChart3, Landmark,
  LifeBuoy, Star, ScrollText, Settings, ArrowLeft, LogOut, X,
} from 'lucide-react';
import { motion, nudge } from '../../lib/motion';
import { Logo } from '../../components/Logo';
import { useT } from '../../lib/i18n';

const NAV = [
  { key: 'dashboard', Icon: LayoutDashboard, group: 'main' },
  { key: 'orders', Icon: ClipboardList, group: 'main' },
  { key: 'users', Icon: Users, group: 'main' },
  { key: 'wallets', Icon: Wallet, group: 'main' },
  { key: 'treasury', Icon: Landmark, group: 'main' },
  { key: 'routes', Icon: Repeat, group: 'main' },
  { key: 'analytics', Icon: BarChart3, group: 'tools' },
  { key: 'support', Icon: LifeBuoy, group: 'tools' },
  { key: 'reviews', Icon: Star, group: 'tools' },
  { key: 'logs', Icon: ScrollText, group: 'tools' },
  { key: 'settings', Icon: Settings, group: 'tools' },
];

function NavBtn({ item, active, onClick, badge }) {
  const t = useT();
  const { Icon } = item;
  return (
    <motion.button
      {...nudge}
      onClick={onClick}
      className={`group mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active ? 'bg-brand/10 font-medium text-brand-fg' : 'text-muted hover:bg-bg3 hover:text-fg'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-fg' : 'text-subtle group-hover:text-fg'}`} />
      <span className="flex-1 truncate">{t(`admin.nav.${item.key}`)}</span>
      {badge > 0 && (
        <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </motion.button>
  );
}

function NavList({ tab, onPick, badges = {} }) {
  const t = useT();
  const groups = ['main', 'tools'];
  return (
    <>
      {groups.map((g) => (
        <div key={g} className="mb-4 last:mb-0">
          <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">{t(`admin.groups.${g}`)}</div>
          {NAV.filter((n) => n.group === g).map((n) => (
            <NavBtn key={n.key} item={n} active={tab === n.key} badge={badges[n.key]} onClick={() => onPick(n.key)} />
          ))}
        </div>
      ))}
    </>
  );
}

function Brand() {
  const t = useT();
  return (
    <div className="flex items-center gap-2.5">
      <Logo className="h-6" />
      <div>
        <div className="text-sm font-semibold leading-none text-fg">SwiftSwap</div>
        <div className="mt-1 text-[10px] text-subtle">{t('admin.brand.subtitle')}</div>
      </div>
    </div>
  );
}

function FooterNav({ onLogout }) {
  const t = useT();
  return (
    <div className="shrink-0 space-y-0.5 border-t border-border px-2 py-3">
      <button
        onClick={() => (window.location.href = '/')}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" /> {t('admin.sidebar.backToSite')}
      </button>
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-red/10 hover:text-red"
      >
        <LogOut className="h-4 w-4 shrink-0" /> {t('admin.common.logout')}
      </button>
    </div>
  );
}

export default function Sidebar({ tab, setTab, onLogout, badges = {}, mobileOpen = false, onClose = () => {} }) {
  const t = useT();
  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-bg2 md:flex">
        <div className="shrink-0 border-b border-border px-4 py-4"><Brand /></div>
        <nav className="flex-1 overflow-y-auto px-2 py-4"><NavList tab={tab} badges={badges} onPick={setTab} /></nav>
        <FooterNav onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[60] md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div onClick={onClose} className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside className={`absolute bottom-0 left-0 top-0 flex w-64 max-w-[82%] flex-col border-r border-border bg-bg2 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
            <Brand />
            <button onClick={onClose} aria-label={t('admin.common.close')} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg3 hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4"><NavList tab={tab} badges={badges} onPick={(k) => { setTab(k); onClose(); }} /></nav>
          <FooterNav onLogout={onLogout} />
        </aside>
      </div>
    </>
  );
}