import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users as UsersIcon, Wallet, Menu } from 'lucide-react';
import { adminCall } from './api';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard  from './pages/Dashboard';
import Orders     from './pages/Orders';
import Users      from './pages/Users';
import Wallets    from './pages/Wallets';
import Routes     from './pages/Routes';
import Analytics  from './pages/Analytics';
import Support    from './pages/Support';
import Reviews    from './pages/Reviews';
import Logs       from './pages/Logs';
import Settings   from './pages/Settings';
import Treasury   from './pages/Treasury';

const PAGES = { dashboard: Dashboard, orders: Orders, users: Users, wallets: Wallets, routes: Routes, analytics: Analytics, support: Support, reviews: Reviews, logs: Logs, settings: Settings, treasury: Treasury };

// ── Mobile bottom nav (quick access) — the 5th button opens the full menu drawer ──
const MOBILE_NAV = [
  { key: 'dashboard', Icon: LayoutDashboard },
  { key: 'orders',    Icon: ClipboardList   },
  { key: 'users',     Icon: UsersIcon       },
  { key: 'wallets',   Icon: Wallet          },
];

export default function AdminApp() {
  const t          = useT();
  const navigate   = useNavigate();
  const { logout: authLogout } = useAuth();
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('ss_token') || localStorage.getItem('ss_admin_token');
    if (!token) return null;
    return { email: 'Admin' };
  });
  const [tab, setTab] = useState(() => localStorage.getItem('ss_admin_tab') || 'dashboard');
  const [awaiting, setAwaiting] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the review-queue badge fresh
  useEffect(() => {
    if (!admin) return;
    let alive = true;
    const fetchCount = () => adminCall('GET', 'admin/stats').then(r => {
      if (alive && r.success) setAwaiting(r.data?.stats?.awaiting_release || 0);
    });
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [admin, tab]);

  const switchTab = (t) => { setTab(t); localStorage.setItem('ss_admin_tab', t); setMenuOpen(false); };

  const logout = () => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_admin_token');
    authLogout();
    navigate('/login', { replace: true });
  };

  // Not logged in — redirect to main login page instead of showing admin login
  if (!admin) {
    navigate('/login', { replace: true });
    return null;
  }

  const PageComponent = PAGES[tab] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar — fixed on desktop, slide-in drawer on mobile */}
      <Sidebar tab={tab} setTab={switchTab} onLogout={logout} badges={{ orders: awaiting }}
        mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed top bar */}
        <TopBar tab={tab} onLogout={logout} onMenuToggle={() => setMenuOpen(true)} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <PageComponent />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-bg2 md:hidden">
        {MOBILE_NAV.map(({ key, Icon }) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors
              ${tab === key ? 'text-brand-fg' : 'text-muted hover:text-fg'}`}>
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-medium">{t(`admin.mobileNav.${key}`)}</span>
          </button>
        ))}
        <button onClick={() => setMenuOpen(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors
            ${!MOBILE_NAV.some(n => n.key === tab) ? 'text-brand-fg' : 'text-muted hover:text-fg'}`}>
          <Menu className="h-5 w-5" />
          <span className="text-[9px] font-medium">{t('admin.mobileNav.menu')}</span>
        </button>
      </nav>
    </div>
  );
}