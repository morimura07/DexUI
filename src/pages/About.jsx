import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { fetchBeeSwapRoutes } from '../api/client';
import AboutHero from '../components/AboutHero';
import Reviews from '../components/Reviews';

const RESERVES = [
  { name:'USDT TRC20',  amount:'20,814,506', usd:'~$20.8M' },
  { name:'Bitcoin',     amount:'2.543',       usd:'~$151K'  },
  { name:'Ethereum',    amount:'48.21',       usd:'~$75K'   },
  { name:'TRON',        amount:'985,000',     usd:'~$125K'  },
  { name:'Visa/MC UAH', amount:'4,200,000',   usd:'~$101K'  },
  { name:'Monero',      amount:'120.5',       usd:'~$18K'   },
  { name:'Ripple XRP',  amount:'95,000',      usd:'~$98K'   },
  { name:'Solana',      amount:'340',         usd:'~$48K'   },
];

const BEESWAP_IMG = (path) =>
  path ? `${API_BASE}/public/beeswap/image?path=${encodeURIComponent(path)}` : null;
function buildReserves(routes) {
  const seen = new Map();
  routes.forEach(r => {
    const key = r.to?.xml;
    if (!key) return;
    const existing = seen.get(key);
    const amount = parseFloat(r.rate?.amount || 0);
    if (!existing || amount > existing.amount) {
      seen.set(key, {
        xml:    key,
        name:   r.to?.name,
        symbol: r.to?.symbol,
        amount,
        imgUrl: r.to?.image?.files?.find(f => f.type === 'small')?.url || null,
      });
    }
  });
  return [...seen.values()].sort((a,b) => b.amount - a.amount);
}

function fmtReserve(n) {
  const num = parseFloat(String(n).replace(/,/g, ''));
  if (!num && num !== 0) return '—';
  if (num >= 1e9) return (num/1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num/1e6).toFixed(2) + 'M';
  if (num >= 1e3) return num.toLocaleString(undefined, {maximumFractionDigits:0});
  return num.toFixed(num < 1 ? 6 : 2);
}

const STATS = [
  { val:'93+',    label:'Exchange Pairs' },
  { val:'24/7',   label:'Always Online'  },
  { val:'5–60m',  label:'Processing'     },
  { val:'0',      label:'Security Incidents' },
];

const FEATURES = [
  { icon:'⚡', title:'Instant Processing',  desc:'Your exchange is processed automatically — no operators, no delays. Most orders complete within 5–60 minutes.' },
  { icon:'🔒', title:'Non-Custodial',       desc:'We never hold your funds. You send directly from your wallet and receive directly into yours.' },
  { icon:'🛡️', title:'AML Protected',       desc:'Every transaction is automatically screened using industry-leading AML tools to keep our platform clean and safe.' },
  { icon:'💬', title:'24/7 Support',        desc:'Our support team is available around the clock to help with any exchange issues, stuck transactions, or questions.' },
  { icon:'💱', title:'93+ Pairs',           desc:'Swap crypto to crypto, fiat to crypto, or crypto to fiat across dozens of supported currency pairs.' },
  { icon:'📊', title:'Transparent Rates',   desc:'Rates are shown upfront before you commit. No hidden fees — what you see is what you get.' },
];

export default function About() {
  const navigate = useNavigate();
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    fetchBeeSwapRoutes().then(data => { setRoutes(data); setLoading(false); });
  }, []);

  const reserves = routes.length > 0 ? buildReserves(routes) : RESERVES.map(r => ({ ...r, imgUrl: null, symbol: r.name }));

  const filtered = routes.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.from?.name?.toLowerCase().includes(q) || r.from?.symbol?.toLowerCase().includes(q)
        || r.to?.name?.toLowerCase().includes(q)   || r.to?.symbol?.toLowerCase().includes(q);
  });

  return (
    <div>

      {/* ── HERO ── */}
      <div style={{background:'#0B0E11'}}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-8 py-12 md:py-16 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-80 h-80 bg-yellow/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow/10 border border-yellow/20 rounded-full text-yellow text-[11px] font-bold mb-4 w-fit">
            ⚡ Automatic · Non-Custodial · 24/7
          </div>
          <h1 className="text-3xl md:text-[38px] font-extrabold leading-tight mb-4">
            Automatic<br /><span className="text-yellow">Crypto Exchange</span><br />You Can Trust
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-md mb-6">
            SwiftSwap converts your currencies automatically — crypto to crypto, crypto to fiat,
            or fiat to crypto. No registration needed. No waiting. Send and receive within minutes.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/rules" className="px-4 py-2 border border-border text-white text-xs font-semibold rounded-lg hover:border-yellow hover:text-yellow transition-colors">📋 Read Rules</Link>
            <Link to="/kyc"   className="px-4 py-2 border border-border text-white text-xs font-semibold rounded-lg hover:border-yellow hover:text-yellow transition-colors">🛡️ KYC/AML Policy</Link>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 pt-6 border-t border-border">
            {STATS.map(({val,label}) => (
              <div key={label}>
                <div className="text-[18px] font-extrabold text-yellow">{val}</div>
                <div className="text-[10px] text-muted mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Orbit rings hero with phone */}
        <div className="hidden md:block" style={{margin:'-48px -32px -48px 0', minHeight:'460px'}}>
          <AboutHero />
        </div>
      </div>

      {/* ── ABOUT US DETAIL ── */}
      <div className="px-4 md:px-8 py-10 border-t border-border" style={{background:'#0d1117'}}>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[17px] font-bold">About SwiftSwap</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-10">
          <div>
            <p className="text-muted text-sm leading-relaxed mb-4">
              SwiftSwap is a fully automatic cryptocurrency exchange platform built for speed, security,
              and simplicity. We process thousands of exchanges every month across 93+ currency pairs —
              including crypto-to-crypto, fiat-to-crypto, and crypto-to-fiat directions.
            </p>
            <p className="text-muted text-sm leading-relaxed mb-4">
              Unlike peer-to-peer platforms, SwiftSwap uses its own reserves to fulfill orders instantly.
              You don't wait for a buyer or seller — we handle it automatically, usually within 5–60 minutes.
            </p>
            <p className="text-muted text-sm leading-relaxed">
              We are committed to operating transparently. Our rates are shown upfront, our reserves are
              published in real time, and every transaction undergoes automatic AML screening to keep the
              platform safe for everyone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon:'🏦', title:'Own Reserves',    desc:'We use our own liquidity — no third-party dependency means faster, more reliable exchanges.' },
              { icon:'🔍', title:'Full Transparency',desc:'Live reserve balances, upfront rates, and no hidden fees. Ever.' },
              { icon:'🌍', title:'Global Access',   desc:'Available worldwide with no account required for basic exchanges.' },
              { icon:'📱', title:'Simple Process',  desc:'Four steps: select direction, enter details, send funds, receive crypto.' },
            ].map(({icon,title,desc}) => (
              <div key={title} className="bg-bg2 border border-border rounded-xl p-4 hover:border-yellow/50 transition-colors">
                <div className="text-xl mb-2">{icon}</div>
                <div className="text-[12.5px] font-bold mb-1">{title}</div>
                <div className="text-[11px] text-muted leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[15px] font-bold">Why Choose Us</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({icon,title,desc}) => (
            <div key={title} className="bg-bg2 border border-border rounded-xl p-5 hover:border-yellow/40 transition-colors group">
              <div className="text-2xl mb-3">{icon}</div>
              <div className="text-[13px] font-bold mb-2 group-hover:text-yellow transition-colors">{title}</div>
              <div className="text-[11.5px] text-muted leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CURRENCY RESERVES ── */}
      <div className="px-4 md:px-8 py-8 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[17px] font-bold">Currency Reserves</span>
          <div className="flex-1 h-px bg-border" />
          {routes.length > 0 && (
            <span className="text-[10px] text-green font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse inline-block" />Live
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {reserves.map((r,i) => (
            <div key={i} className="bg-bg2 border border-border rounded-xl p-4 hover:border-yellow transition-colors min-w-0 flex items-center gap-3">
              {/* Real logo from BeeSwap CDN */}
              <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-bg3 relative">
                {r.imgUrl ? (
                  <img
                    src={BEESWAP_IMG(r.imgUrl)}
                    alt={r.symbol}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.parentNode.querySelector('.img-fallback').style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="img-fallback absolute inset-0 items-center justify-center text-[10px] font-extrabold text-yellow"
                  style={{display: r.imgUrl ? 'none' : 'flex'}}>
                  {r.symbol?.substring(0,2)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold truncate">{r.name}</div>
                <div className="text-[13px] font-extrabold text-yellow">{fmtReserve(r.amount)}</div>
                <div className="text-[10px] text-muted">{r.symbol}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Exchange Directions */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[17px] font-bold">Select Exchange Direction</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="mb-4 max-w-xs">
          <div className="flex items-center bg-bg border border-border rounded-lg overflow-hidden focus-within:border-yellow transition-colors">
            <span className="pl-3 text-muted text-sm">🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search (BTC, UAH, USDT…)"
              className="bg-transparent border-none outline-none text-white text-[13px] px-3 py-2.5 w-full placeholder-muted" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted text-sm animate-pulse">Loading exchange directions…</div>
        ) : filtered.length===0 ? (
          <div className="text-center py-12 text-muted text-sm">No directions found for "{search}"</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((r,i) => {
              const fromImg = r.from?.image?.files?.find(f=>f.type==='small')?.url;
              const toImg   = r.to?.image?.files?.find(f=>f.type==='small')?.url;
              const rateOut = parseFloat(r.rate?.out||0);
              const rateIn  = parseFloat(r.rate?.in||0);
              const rateStr = rateOut > 1
                ? `1 ${r.from?.symbol} = ${rateOut.toFixed(r.to?.decimal||2)} ${r.to?.symbol}`
                : `1 ${r.to?.symbol} = ${rateIn.toFixed(r.from?.decimal||2)} ${r.from?.symbol}`;
              return (
                <div key={i} onClick={() => navigate(`/exchange?from=${r.from?.xml}&to=${r.to?.xml}`)}
                  className="bg-bg2 border border-border rounded-xl p-4 cursor-pointer hover:border-yellow transition-colors group">
                  {/* Currency icons + symbols */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-bg3 flex items-center justify-center relative shrink-0">
                      {fromImg && <img src={BEESWAP_IMG(fromImg)} alt={r.from?.symbol} className="w-full h-full object-cover absolute inset-0" onError={e=>e.target.remove()} />}
                      <span className="text-[9px] font-bold text-yellow relative z-10" style={{display: fromImg ? 'none' : 'block'}}>{r.from?.symbol?.substring(0,2)}</span>
                    </div>
                    <span className="text-[13px] font-extrabold text-yellow group-hover:text-white transition-colors">{r.from?.symbol}</span>
                    <span className="text-muted text-xs">→</span>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-bg3 flex items-center justify-center relative shrink-0">
                      {toImg && <img src={BEESWAP_IMG(toImg)} alt={r.to?.symbol} className="w-full h-full object-cover absolute inset-0" onError={e=>e.target.remove()} />}
                      <span className="text-[9px] font-bold text-green relative z-10" style={{display: toImg ? 'none' : 'block'}}>{r.to?.symbol?.substring(0,2)}</span>
                    </div>
                    <span className="text-[13px] font-extrabold text-yellow group-hover:text-white transition-colors">{r.to?.symbol}</span>
                  </div>
                  {/* Full names */}
                  <div className="text-[11.5px] font-semibold mb-1 truncate">{r.from?.name} → {r.to?.name}</div>
                  {/* Rate */}
                  <div className="text-[11px] text-green font-semibold">{rateStr}</div>
                  {/* Min */}
                  {r.from?.min && <div className="text-[10px] text-muted mt-1">Min: {Number(r.from.min).toLocaleString(undefined, {maximumFractionDigits: 8})} {r.from.symbol}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CTA BANNER ── */}
      <div className="mx-4 md:mx-8 mb-8 rounded-2xl border border-yellow/20 overflow-hidden"
        style={{background:'linear-gradient(135deg,rgba(240,185,11,0.08),rgba(240,185,11,0.03))'}}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-6">
          <div>
            <div className="text-[16px] font-extrabold mb-1">Ready to exchange?</div>
            <div className="text-[12px] text-muted">Pick a direction above or start with our most popular pair</div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => navigate('/exchange?from=CARDUAH&to=USDTTRC20')}
              className="px-5 py-2.5 bg-yellow text-black font-bold text-[13px] rounded-lg hover:bg-yellow-d transition-colors cursor-pointer">
              UAH → USDT
            </button>
            <button onClick={() => navigate('/exchange?from=USDTTRC20&to=CARDUAH')}
              className="px-5 py-2.5 border border-border text-white font-semibold text-[13px] rounded-lg hover:border-yellow hover:text-yellow transition-colors cursor-pointer bg-transparent">
              USDT → UAH
            </button>
          </div>
        </div>
      </div>

      {/* ── REVIEWS ── */}
      <Reviews />

    </div>
  );
}