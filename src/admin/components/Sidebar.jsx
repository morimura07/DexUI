const NAV = [
  { key: 'dashboard',  icon: '📊', label: 'Dashboard' },
  { key: 'orders',     icon: '📋', label: 'Orders' },
  { key: 'users',      icon: '👥', label: 'Users' },
  { key: 'wallets',    icon: '💳', label: 'Wallets' },
  { key: 'routes',     icon: '🔄', label: 'Exchange Routes' },
  { key: 'analytics',  icon: '📈', label: 'Analytics' },
  { key: 'support',    icon: '💬', label: 'Support Tickets' },
  { key: 'reviews',    icon: '⭐', label: 'Reviews' },
  { key: 'logs',       icon: '📝', label: 'Audit Logs' },
  { key: 'settings',   icon: '⚙️',  label: 'Settings' },
];

function NavList({ tab, onPick, badges = {} }) {
  return (
    <>
      <div className="text-[9px] text-muted font-semibold uppercase tracking-wider px-2 mb-2">Main</div>
      {NAV.slice(0, 5).map(n => (
        <NavBtn key={n.key} item={n} active={tab === n.key} badge={badges[n.key]} onClick={() => onPick(n.key)} />
      ))}
      <div className="text-[9px] text-muted font-semibold uppercase tracking-wider px-2 mt-4 mb-2">Tools</div>
      {NAV.slice(5).map(n => (
        <NavBtn key={n.key} item={n} active={tab === n.key} badge={badges[n.key]} onClick={() => onPick(n.key)} />
      ))}
    </>
  );
}

function Footer({ onLogout }) {
  return (
    <div className="px-2 py-3 border-t border-border shrink-0 space-y-0.5">
      <button onClick={() => window.location.href = '/'}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-muted hover:text-white hover:bg-bg3 transition-colors cursor-pointer bg-transparent border-none">
        ← Back to site
      </button>
      <button onClick={onLogout}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-red hover:bg-red/10 transition-colors cursor-pointer bg-transparent border-none">
        ⏻ Logout
      </button>
    </div>
  );
}

export default function Sidebar({ tab, setTab, onLogout, badges = {}, mobileOpen = false, onClose = () => {} }) {
  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-bg2 border-r border-border"
        style={{ height: '100vh', position: 'sticky', top: 0 }}>
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-yellow text-lg">⚡</span>
            <div>
              <div className="text-yellow font-extrabold text-[13px] leading-none">SwiftSwap</div>
              <div className="text-muted text-[10px]">Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <NavList tab={tab} badges={badges} onPick={setTab} />
        </nav>
        <Footer onLogout={onLogout} />
      </aside>

      {/* Mobile slide-in drawer — shows ALL sections */}
      <div className={`md:hidden fixed inset-0 z-[60] ${mobileOpen ? '' : 'pointer-events-none'}`}>
        {/* backdrop */}
        <div onClick={onClose}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
        {/* panel */}
        <aside className={`absolute left-0 top-0 bottom-0 w-64 max-w-[82%] bg-bg2 border-r border-border flex flex-col
            transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-4 py-4 border-b border-border shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow text-lg">⚡</span>
              <div>
                <div className="text-yellow font-extrabold text-[13px] leading-none">SwiftSwap</div>
                <div className="text-muted text-[10px]">Admin Panel</div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg3 border border-border text-muted hover:text-white cursor-pointer text-sm">
              ✕
            </button>
          </div>
          <nav className="flex-1 py-3 px-2 overflow-y-auto">
            <NavList tab={tab} badges={badges} onPick={(k) => { setTab(k); onClose(); }} />
          </nav>
          <Footer onLogout={onLogout} />
        </aside>
      </div>
    </>
  );
}

function NavBtn({ item, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11.5px] font-medium mb-0.5 cursor-pointer border-none transition-all text-left
        ${active
          ? 'bg-yellow/10 text-yellow border border-yellow/20'
          : 'text-muted hover:text-white hover:bg-bg3 bg-transparent border border-transparent'}`}>
      <span className="text-[14px] shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}