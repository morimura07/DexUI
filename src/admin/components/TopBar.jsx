export default function TopBar({ tab, onLogout, onMenuToggle }) {
  const TITLES = {
    dashboard: '📊 Dashboard', orders: '📋 Orders', users: '👥 Users',
    wallets: '💳 Payment Wallets', routes: '🔄 Exchange Routes',
    analytics: '📈 Analytics', support: '💬 Support Tickets',
    reviews: '⭐ Reviews', logs: '📝 Audit Logs', settings: '⚙️ Settings',
  };

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-border bg-bg2">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button onClick={onMenuToggle}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-bg3 border border-border cursor-pointer text-sm">
          ☰
        </button>
        <span className="font-bold text-[13px]">{TITLES[tab]}</span>
      </div>
      <div className="flex items-center gap-2">
        <a href="/" className="hidden md:block text-[11px] text-muted hover:text-white transition-colors">
          ← Site
        </a>
        <button onClick={onLogout}
          className="px-2.5 py-1 text-[11px] text-red border border-red/20 rounded-lg hover:bg-red/10 transition-colors cursor-pointer bg-transparent">
          Logout
        </button>
      </div>
    </header>
  );
}