import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api/client';
import { adminCall } from './api';
import { useAuth } from '../context/AuthContext';
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

// ── Admin Login ──
function AdminLogin({ onLogin }) {
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { setError('Fill in all fields'); return; }
    setLoad(true); setError('');
    const res = await apiCall('POST', 'user/auth/sign-in', { email, password: pass });
    setLoad(false);
    if (res.success && res.data?.user?.role === 'admin') {
      localStorage.setItem('ss_token', res.data.token);
      onLogin(res.data.user);
    } else if (res.success) {
      setError('Access denied — admin account required');
    } else {
      setError(res.error?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0E11' }}>
      <div className="bg-bg2 border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-[22px] mb-1">⚡</div>
          <div className="text-yellow font-extrabold text-[16px]">SwiftSwap</div>
          <div className="text-muted text-[11px] mt-0.5">Admin Panel</div>
        </div>
        <div className="space-y-2.5">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Admin email" onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
          {error && <div className="text-red text-[11px] text-center">{error}</div>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-2.5 bg-yellow text-black font-bold text-[12px] rounded-lg hover:bg-yellow-d transition-colors cursor-pointer disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <button onClick={() => window.location.href = '/login'}
            className="w-full text-center text-muted text-[11px] hover:text-white transition-colors cursor-pointer bg-transparent border-none mt-1">
            ← Back to main login
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGES = { dashboard: Dashboard, orders: Orders, users: Users, wallets: Wallets, routes: Routes, analytics: Analytics, support: Support, reviews: Reviews, logs: Logs, settings: Settings };

// ── Mobile bottom nav (quick access) — the 5th button opens the full menu drawer ──
const MOBILE_NAV = [
  { key: 'dashboard', icon: '📊', label: 'Home' },
  { key: 'orders',    icon: '📋', label: 'Orders' },
  { key: 'users',     icon: '👥', label: 'Users' },
  { key: 'wallets',   icon: '💳', label: 'Wallets' },
];

export default function AdminApp() {
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#0B0E11' }}>
      {/* Sidebar — fixed on desktop, slide-in drawer on mobile */}
      <Sidebar tab={tab} setTab={switchTab} onLogout={logout} badges={{ orders: awaiting }}
        mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed top bar */}
        <TopBar tab={tab} onLogout={logout} onMenuToggle={() => setMenuOpen(true)} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
          <PageComponent />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg2 border-t border-border flex z-50">
        {MOBILE_NAV.map(n => (
          <button key={n.key} onClick={() => switchTab(n.key)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 cursor-pointer border-none transition-colors
              ${tab === n.key ? 'text-yellow bg-yellow/5' : 'text-muted bg-transparent hover:text-white'}`}>
            <span className="text-[16px]">{n.icon}</span>
            <span className="text-[9px] font-medium">{n.label}</span>
          </button>
        ))}
        {/* Menu — opens the full drawer with every section */}
        <button onClick={() => setMenuOpen(true)}
          className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 cursor-pointer border-none transition-colors
            ${!MOBILE_NAV.some(n => n.key === tab) ? 'text-yellow bg-yellow/5' : 'text-muted bg-transparent hover:text-white'}`}>
          <span className="text-[16px]">☰</span>
          <span className="text-[9px] font-medium">Menu</span>
        </button>
      </nav>
    </div>
  );
}