import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LANGS = [
  { code: 'en', flag: '🇺🇸', label: 'ENG', full: 'English' },
  { code: 'uk', flag: '🇺🇦', label: 'УКР', full: 'Українська' },
  { code: 'ru', flag: '🇷🇺', label: 'РУС', full: 'Русский' },
];

const NAV_LINKS = [
  { to: '/overview', label: 'Overview' },
  { to: '/news',     label: 'News' },
  { to: '/rules',    label: 'Rules' },
  { to: '/kyc',      label: 'KYC/AML' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/about',    label: 'About Us' },
];

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang]         = useState(LANGS[0]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const langRef   = useRef();
  const userRef   = useRef();

  useEffect(() => {
    const close = e => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menuOpen]);

  const active = path => location.pathname === path;
  const handleLogout = async () => { await logout(); navigate('/'); };
  const initials = user?.name?.substring(0,2).toUpperCase() || user?.email?.substring(0,2).toUpperCase() || 'SS';

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8 h-14">

        {/* Logo */}
        <Link to="/overview" className="flex items-center gap-2 text-yellow font-extrabold text-base tracking-tight shrink-0">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" fill="#F0B90B" fillOpacity=".15"/>
            <path d="M7 13h12M13 7l6 6-6 6" stroke="#F0B90B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          SwiftSwap
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-colors ${active(l.to) ? 'text-white bg-bg3' : 'text-muted hover:text-white hover:bg-bg3'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Language — desktop only */}
          <div className="relative hidden md:block" ref={langRef}>
            <button onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-muted text-xs px-2.5 py-1.5 rounded-lg hover:bg-bg3 hover:text-white transition-colors border-none bg-transparent cursor-pointer">
              <span>{lang.flag}</span><span>{lang.label}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            {langOpen && (
              <div className="absolute top-10 right-0 bg-bg2 border border-border rounded-lg min-w-[160px] shadow-xl overflow-hidden z-50">
                {LANGS.map(l => (
                  <div key={l.code} onClick={() => { setLang(l); setLangOpen(false); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 cursor-pointer text-[12.5px] transition-colors hover:bg-bg3 ${lang.code===l.code ? 'text-yellow' : 'text-white'}`}>
                    {l.flag} {l.full} {lang.code===l.code && '✓'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auth buttons — desktop */}
          {!isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login"    className="text-[12.5px] font-semibold px-4 py-1.5 rounded-lg border border-border text-white hover:border-yellow hover:text-yellow transition-colors">Log In</Link>
              <Link to="/register" className="text-[12.5px] font-bold px-4 py-1.5 rounded-lg bg-yellow text-black hover:bg-yellow-d transition-colors">Sign Up</Link>
            </div>
          ) : (
            <div className="relative hidden md:block" ref={userRef}>
              <div onClick={() => setUserOpen(!userOpen)}
                className="w-8 h-8 rounded-full bg-yellow text-black text-xs font-bold flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                {initials}
              </div>
              {userOpen && (
                <div className="absolute top-11 right-0 bg-bg2 border border-border rounded-xl min-w-[210px] shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border text-[11.5px] text-muted">{user?.email}</div>
                  {[
                    { to:'/profile',   icon:'👤', label:'Profile' },
                    { to:'/orders',    icon:'📋', label:'Exchange orders' },
                    { to:'/affiliate', icon:'💼', label:'Affiliate program' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setUserOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] transition-colors ${active(item.to) ? 'bg-yellow text-black font-semibold' : 'text-white hover:bg-bg3'}`}>
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <div onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-muted hover:text-red hover:bg-bg3 cursor-pointer transition-colors">
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9 bg-transparent border-none cursor-pointer rounded-lg hover:bg-bg3 transition-colors p-1">
            <span className={`bar bg-white ${menuOpen ? 'bar-open-1' : ''}`} />
            <span className={`bar bg-white ${menuOpen ? 'bar-open-2' : ''}`} />
            <span className={`bar bg-white ${menuOpen ? 'bar-open-3' : ''}`} />
          </button>
        </div>
      </nav>

      {/* ── OVERLAY ── */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* ── MOBILE DRAWER ── */}
      <div className={`fixed top-0 right-0 h-dvh w-72 max-w-[85vw] bg-bg2 border-l border-border z-50 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border min-h-[52px]">
          <Link to="/overview" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-yellow font-extrabold text-sm">
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="12" fill="#F0B90B" fillOpacity=".15"/>
              <path d="M7 13h12M13 7l6 6-6 6" stroke="#F0B90B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            SwiftSwap
          </Link>
          <button onClick={() => setMenuOpen(false)}
            className="text-muted text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg3 hover:text-white transition-colors border-none bg-transparent cursor-pointer">
            ✕
          </button>
        </div>

        {/* Nav links */}
        <div className="flex flex-col border-b border-border py-2">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={`px-5 py-3.5 text-sm font-medium border-l-[3px] transition-all ${active(l.to)
                ? 'text-yellow border-yellow bg-yellow/10 font-bold'
                : 'text-muted border-transparent hover:text-white hover:bg-bg3'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="p-4 border-b border-border">
          {!isLoggedIn ? (
            <div className="flex flex-col gap-2.5">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold py-2.5 rounded-lg border border-border text-white text-center hover:border-yellow hover:text-yellow transition-colors">
                Log In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="text-sm font-bold py-2.5 rounded-lg bg-yellow text-black text-center hover:bg-yellow-d transition-colors">
                Sign Up
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2.5 pb-3.5 mb-2.5 border-b border-border">
                <div className="w-9 h-9 rounded-full bg-yellow text-black text-sm font-bold flex items-center justify-center shrink-0">{initials}</div>
                <div>
                  <div className="text-[12.5px] font-semibold text-white">{user?.name || 'Account'}</div>
                  <div className="text-[11px] text-muted">{user?.email}</div>
                </div>
              </div>
              {[
                { to:'/profile',   icon:'👤', label:'Profile' },
                { to:'/orders',    icon:'📋', label:'Exchange Orders' },
                { to:'/affiliate', icon:'💼', label:'Affiliate Program' },
              ].map(item => (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 py-2.5 text-sm transition-colors ${active(item.to) ? 'text-yellow font-semibold' : 'text-muted hover:text-yellow'}`}>
                  {item.icon} {item.label}
                </Link>
              ))}
              <button onClick={handleLogout}
                className="flex items-center gap-2 py-2.5 text-sm text-muted hover:text-red transition-colors w-full border-none bg-transparent cursor-pointer mt-1">
                🚪 Logout
              </button>
            </div>
          )}
        </div>

        {/* Language */}
        <div className="p-4 mt-auto">
          <div className="text-[11px] text-muted font-semibold mb-2 tracking-wider">LANGUAGE</div>
          <div className="flex gap-2">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors font-sans ${lang.code===l.code
                  ? 'bg-yellow/10 border-yellow text-yellow font-bold'
                  : 'bg-bg3 border-border text-muted hover:text-white'}`}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}