import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCryptoPrices } from '../api/client';
import CryptoHero from '../components/CryptoHero';

const LOGO_IDS = {
  bitcoin:'1', ethereum:'279', tether:'325', binancecoin:'825',
  'usd-coin':'6319', ripple:'44', solana:'4128', dogecoin:'5',
  tron:'1094', polkadot:'12171', cardano:'2010', 'matic-network':'4713',
  litecoin:'2', chainlink:'877', avalanche:'12559', stellar:'100',
  monero:'69', cosmos:'3076', uniswap:'12504', 'shiba-inu':'11939',
};

const fmt  = n => { if(!n&&n!==0)return'—'; if(Math.abs(n)>=1e12)return`$${(n/1e12).toFixed(2)}T`; if(Math.abs(n)>=1e9)return`$${(n/1e9).toFixed(2)}B`; if(Math.abs(n)>=1e6)return`$${(n/1e6).toFixed(2)}M`; return`$${n.toLocaleString(undefined,{maximumFractionDigits:2})}`; };
const fmtP = p => !p&&p!==0?'—':p>=1000?p.toLocaleString(undefined,{maximumFractionDigits:2}):p>=1?p.toFixed(4):p.toFixed(6);

const FILTER_TABS = ['Hot','Gainers','Losers','All'];
const TIME_TABS   = [{ val:'1h', label:'1 Hour' },{ val:'24h', label:'24 Hours' },{ val:'7d', label:'7 Days' }];

const FALLBACK = [
  { id:'bitcoin',      symbol:'BTC',  name:'Bitcoin',   current_price:59461, price_change_percentage_1h_in_currency:-0.3, price_change_percentage_24h:-1.2, price_change_percentage_7d_in_currency:2.1,  total_volume:43930000000, market_cap:1190000000000 },
  { id:'ethereum',     symbol:'ETH',  name:'Ethereum',  current_price:1562,  price_change_percentage_1h_in_currency:-0.6, price_change_percentage_24h:-2.1, price_change_percentage_7d_in_currency:-3.4, total_volume:17040000000, market_cap:189830000000  },
  { id:'tether',       symbol:'USDT', name:'Tether',    current_price:1.00,  price_change_percentage_1h_in_currency:0.0,  price_change_percentage_24h:0.01,  price_change_percentage_7d_in_currency:0.02, total_volume:84650000000, market_cap:186050000000  },
  { id:'binancecoin',  symbol:'BNB',  name:'BNB',       current_price:556,   price_change_percentage_1h_in_currency:-0.4, price_change_percentage_24h:-0.9, price_change_percentage_7d_in_currency:5.2,  total_volume:1430000000,  market_cap:75380000000   },
  { id:'usd-coin',     symbol:'USDC', name:'USD Coin',  current_price:1.00,  price_change_percentage_1h_in_currency:0.0,  price_change_percentage_24h:0.00,  price_change_percentage_7d_in_currency:0.01, total_volume:14850000000, market_cap:73710000000   },
  { id:'ripple',       symbol:'XRP',  name:'XRP',       current_price:1.04,  price_change_percentage_1h_in_currency:-0.8, price_change_percentage_24h:-1.5, price_change_percentage_7d_in_currency:-4.2, total_volume:2480000000,  market_cap:64800000000   },
  { id:'solana',       symbol:'SOL',  name:'Solana',    current_price:142,   price_change_percentage_1h_in_currency:1.2,  price_change_percentage_24h:3.2,   price_change_percentage_7d_in_currency:8.5,  total_volume:3210000000,  market_cap:59400000000   },
  { id:'cardano',      symbol:'ADA',  name:'Cardano',   current_price:0.38,  price_change_percentage_1h_in_currency:-1.1, price_change_percentage_24h:-2.4, price_change_percentage_7d_in_currency:-6.1, total_volume:820000000,   market_cap:13500000000   },
  { id:'dogecoin',     symbol:'DOGE', name:'Dogecoin',  current_price:0.124, price_change_percentage_1h_in_currency:0.5,  price_change_percentage_24h:1.1,   price_change_percentage_7d_in_currency:12.3, total_volume:1100000000,  market_cap:17900000000   },
  { id:'tron',         symbol:'TRX',  name:'TRON',      current_price:0.127, price_change_percentage_1h_in_currency:0.2,  price_change_percentage_24h:0.8,   price_change_percentage_7d_in_currency:3.1,  total_volume:950000000,   market_cap:11200000000   },
  { id:'polkadot',     symbol:'DOT',  name:'Polkadot',  current_price:6.82,  price_change_percentage_1h_in_currency:-2.1, price_change_percentage_24h:-3.1, price_change_percentage_7d_in_currency:-8.9, total_volume:450000000,   market_cap:9800000000    },
  { id:'litecoin',     symbol:'LTC',  name:'Litecoin',  current_price:68.4,  price_change_percentage_1h_in_currency:0.3,  price_change_percentage_24h:1.4,   price_change_percentage_7d_in_currency:4.7,  total_volume:620000000,   market_cap:5100000000    },
  { id:'chainlink',    symbol:'LINK', name:'Chainlink', current_price:13.2,  price_change_percentage_1h_in_currency:0.8,  price_change_percentage_24h:2.6,   price_change_percentage_7d_in_currency:9.8,  total_volume:480000000,   market_cap:7800000000    },
  { id:'stellar',      symbol:'XLM',  name:'Stellar',   current_price:0.11,  price_change_percentage_1h_in_currency:-0.5, price_change_percentage_24h:-1.8, price_change_percentage_7d_in_currency:-5.3, total_volume:210000000,   market_cap:3200000000    },
  { id:'uniswap',      symbol:'UNI',  name:'Uniswap',   current_price:7.4,   price_change_percentage_1h_in_currency:1.5,  price_change_percentage_24h:4.2,   price_change_percentage_7d_in_currency:11.2, total_volume:190000000,   market_cap:5600000000    },
  { id:'shiba-inu',    symbol:'SHIB', name:'Shiba Inu', current_price:0.0000081, price_change_percentage_1h_in_currency:2.1, price_change_percentage_24h:5.8, price_change_percentage_7d_in_currency:18.4, total_volume:870000000, market_cap:4800000000    },
  { id:'avalanche',    symbol:'AVAX', name:'Avalanche', current_price:28.4,  price_change_percentage_1h_in_currency:-1.3, price_change_percentage_24h:-3.7, price_change_percentage_7d_in_currency:-9.2, total_volume:340000000,   market_cap:11600000000   },
  { id:'cosmos',       symbol:'ATOM', name:'Cosmos',    current_price:8.1,   price_change_percentage_1h_in_currency:0.6,  price_change_percentage_24h:1.9,   price_change_percentage_7d_in_currency:6.3,  total_volume:270000000,   market_cap:3100000000    },
  { id:'monero',       symbol:'XMR',  name:'Monero',    current_price:148,   price_change_percentage_1h_in_currency:-0.2, price_change_percentage_24h:-0.7, price_change_percentage_7d_in_currency:1.4,  total_volume:95000000,    market_cap:2700000000    },
  { id:'matic-network',symbol:'MATIC',name:'Polygon',   current_price:0.52,  price_change_percentage_1h_in_currency:1.8,  price_change_percentage_24h:2.6,   price_change_percentage_7d_in_currency:7.1,  total_volume:320000000,   market_cap:5100000000    },
];

const COLORS = { bitcoin:'#F7931A', ethereum:'#627EEA', tether:'#26A17B', binancecoin:'#F3BA2F', 'usd-coin':'#2775CA', ripple:'#346AA9', solana:'#9945FF', dogecoin:'#C3A634', tron:'#FF0013', polkadot:'#E6007A', cardano:'#0033AD', litecoin:'#BFBBBB', chainlink:'#2A5ADA', stellar:'#7ECDE1', uniswap:'#FF007A', 'shiba-inu':'#FFA409', avalanche:'#E84142', cosmos:'#2E3148', monero:'#FF6600', 'matic-network':'#8247E5' };

// 7-day mini trend line. Uses live sparkline data when present, else synthesizes
// a deterministic line from the 7d change so fallback rows still show a trend.
const sparkOf = c => {
  const p = c.sparkline_in_7d?.price;
  if (Array.isArray(p) && p.length > 1) return p;
  const chg = c.price_change_percentage_7d_in_currency || 0;
  const end = c.current_price || 1;
  const start = end / (1 + chg / 100);
  const seed = (c.id || '').length;
  const n = 18;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = start + (end - start) * t;
    return base + Math.sin(i * 1.3 + seed) * (end * 0.012);
  });
};
function Sparkline({ data, up }) {
  if (!data || data.length < 2) return <div className="w-[58px] sm:w-[84px] h-7" />;
  const w = 84, h = 28;
  const min = Math.min(...data), max = Math.max(...data), range = (max - min) || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const color = up ? '#03A66D' : '#CF304A';
  const gid = up ? 'spkU' : 'spkD';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-[58px] sm:w-[84px] h-7">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Overview() {
  const [coins, setCoins]       = useState(FALLBACK);
  const [isLive, setIsLive]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('Hot');
  const [tab, setTab]           = useState('24h');
  const [tabOpen, setTabOpen]   = useState(false);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();
  const tabRef   = useRef();

  useEffect(() => {
    setLoading(true);
    const ids = 'bitcoin,ethereum,tether,binancecoin,usd-coin,ripple,solana,cardano,dogecoin,tron,polkadot,litecoin,chainlink,stellar,uniswap,shiba-inu,avalanche,cosmos,monero,matic-network';
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCoins(data.map(c => ({ ...c, color: COLORS[c.id] || '#F0B90B' })));
          setIsLive(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const close = e => { if(tabRef.current && !tabRef.current.contains(e.target)) setTabOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const getChg = c => tab==='1h' ? c.price_change_percentage_1h_in_currency : tab==='7d' ? c.price_change_percentage_7d_in_currency : c.price_change_percentage_24h;
  const tabLabel = TIME_TABS.find(t=>t.val===tab)?.label || '24 Hours';

  const filtered = coins
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    .filter(c => {
      const ch = getChg(c);
      if (filter === 'Gainers') return ch > 0;
      if (filter === 'Losers')  return ch < 0;
      if (filter === 'Hot')     return Math.abs(c.total_volume || 0) > 1000000000; // >1B volume
      return true;
    })
    .sort((a,b) => {
      if (filter === 'Gainers') return (getChg(b)||0) - (getChg(a)||0);
      if (filter === 'Losers')  return (getChg(a)||0) - (getChg(b)||0);
      return (b.market_cap||0) - (a.market_cap||0);
    });

  const rankMap = {};
  coins.slice().sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0)).forEach((c, i) => { rankMap[c.id] = i + 1; });

  const ticker = [...coins, ...coins];

  return (
    <div>
      {/* Ticker */}
      <div className="bg-bg2 border-b border-border overflow-hidden whitespace-nowrap px-6">
        <div className="inline-flex gap-7 py-2 animate-ticker">
          {ticker.map((c,i) => {
            const ch = c.price_change_percentage_24h;
            return (
              <div key={i} className="flex items-center gap-1.5 text-[11.5px]">
                <span className="text-muted font-medium">{c.symbol?.toUpperCase()}</span>
                <span className="text-white font-semibold">${fmtP(c.current_price)}</span>
                <span className={ch>=0?'text-green':'text-red'}>{ch>=0?'+':''}{ch?.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 px-4 md:px-8 py-10 md:py-14 overflow-hidden relative"
        style={{background:'linear-gradient(135deg,#0B0E11 0%,#0B0E11 45%,#080f22 100%)'}}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-[40px] font-extrabold leading-tight mb-4 tracking-tight">
            Swap Crypto<br /><span className="text-yellow">Fast & Securely</span>
          </h1>
          <p className="text-muted text-sm md:text-[13.5px] leading-relaxed max-w-md mb-7">
            SwiftSwap is an automatic crypto exchange platform — no registration needed for basic swaps.
            Send one currency, receive another directly to your wallet within minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/about" className="px-5 py-2.5 bg-yellow text-black text-sm font-bold rounded-lg hover:bg-yellow-d transition-colors">Start Exchanging</Link>
            <Link to="/news"  className="px-5 py-2.5 border border-border text-white text-sm font-semibold rounded-lg hover:border-yellow hover:text-yellow transition-colors">Crypto News</Link>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-8 mt-8 pt-6 border-t border-border">
            {[['93+','Exchange Pairs'],['24/7','Automatic'],['5–60m','Processing'],['256-bit','Encryption']].map(([v,l])=>(
              <div key={l}>
                <div className="text-xl md:text-[22px] font-extrabold text-yellow">{v}</div>
                <div className="text-[11px] text-muted mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:block" style={{margin:'-40px -32px -40px 0', minHeight:'380px'}}>
          <CryptoHero />
        </div>
      </div>

            {/* Market Table */}
      <div className="px-4 md:px-8 py-6 md:py-8">

        {/* Toolbar — single tidy row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-bold">Crypto Market</div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isLive?'bg-green/10 text-green':'bg-yellow/10 text-yellow'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive?'bg-green animate-pulse':'bg-yellow'}`} />
              {isLive ? 'Live' : 'Cached'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Segmented filter */}
            <div className="flex bg-bg2 border border-border rounded-lg p-0.5">
              {FILTER_TABS.map(f => {
                const on = filter === f;
                const tone = f === 'Gainers' ? 'text-green' : f === 'Losers' ? 'text-red' : 'text-yellow';
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-[11.5px] font-semibold rounded-md transition-colors cursor-pointer border-none ${on ? `bg-bg3 ${tone}` : 'bg-transparent text-muted hover:text-white'}`}>
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex items-center bg-bg2 border border-border rounded-lg overflow-hidden focus-within:border-yellow transition-colors">
              <span className="pl-2.5 text-muted text-xs">🔍</span>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search coin…"
                className="bg-transparent border-none outline-none text-white text-[12px] px-2 py-1.5 w-32 sm:w-40 placeholder-muted" />
            </div>

            {/* Timeframe */}
            <div className="relative" ref={tabRef}>
              <button onClick={() => setTabOpen(!tabOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg2 border border-border rounded-lg text-[12px] text-white cursor-pointer hover:border-yellow transition-colors">
                {tabLabel}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {tabOpen && (
                <div className="absolute right-0 top-10 bg-bg2 border border-border rounded-lg overflow-hidden z-20 min-w-[130px] shadow-xl">
                  {TIME_TABS.map(t => (
                    <div key={t.val} onClick={() => { setTab(t.val); setTabOpen(false); }}
                      className={`px-4 py-2.5 text-[12px] cursor-pointer transition-colors ${tab===t.val?'text-yellow bg-yellow/10 font-semibold':'text-muted hover:text-white hover:bg-bg3'}`}>
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-muted text-sm">
            <div className="text-2xl mb-3 animate-pulse">⏳</div>
            Fetching live market data…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="text-[11px] font-medium py-2.5 pl-2 pr-1 text-right w-9 hidden sm:table-cell">#</th>
                  <th className="text-[11px] font-medium py-2.5 px-2 sm:px-3 text-left w-[46%] sm:w-auto">Name</th>
                  <th className="text-[11px] font-medium py-2.5 px-2 sm:px-3 text-right w-[30%] sm:w-auto">Price</th>
                  <th className="text-[11px] font-medium py-2.5 px-3 text-right hidden sm:table-cell">Change ({tabLabel})</th>
                  <th className="text-[11px] font-medium py-2.5 px-2 sm:px-3 text-center w-[24%] sm:w-auto">7 Days</th>
                  <th className="text-[11px] font-medium py-2.5 px-3 text-right hidden lg:table-cell">24h Volume</th>
                  <th className="text-[11px] font-medium py-2.5 px-3 text-right hidden xl:table-cell">Market Cap</th>
                  <th className="text-[11px] font-medium py-2.5 px-3 text-right hidden sm:table-cell w-[110px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-12 text-muted text-sm">No coins found</td></tr>
                ) : filtered.map(c => {
                  const ch = getChg(c);
                  const logoId = LOGO_IDS[c.id];
                  const logoUrl = logoId ? `https://assets.coingecko.com/coins/images/${logoId}/small/${c.id}.png` : null;
                  const color = COLORS[c.id] || '#F0B90B';
                  const spark = sparkOf(c);
                  const sparkUp = spark[spark.length-1] >= spark[0];
                  return (
                    <tr key={c.id} onClick={() => navigate('/about')}
                      className="border-b border-white/[0.04] hover:bg-bg2 transition-colors cursor-pointer group">
                      <td className="py-3 pl-2 pr-1 text-right text-[11px] text-muted tabular-nums hidden sm:table-cell">{rankMap[c.id] || '—'}</td>
                      <td className="py-3 px-2 sm:px-3 w-[46%] sm:w-auto">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center relative"
                            style={{ background: color+'22', boxShadow: `0 0 0 1px ${color}33` }}>
                            {logoUrl && (
                              <img src={logoUrl} alt={c.symbol}
                                className="w-full h-full object-cover absolute inset-0"
                                onError={e => e.target.style.display='none'} />
                            )}
                            <span className="text-[10px] font-extrabold relative z-10" style={{color}}>
                              {c.symbol?.substring(0,2).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[13px] group-hover:text-yellow transition-colors">{c.symbol?.toUpperCase()}</div>
                            <div className="text-[11px] text-muted truncate">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right font-bold text-[13px] tabular-nums whitespace-nowrap w-[30%] sm:w-auto">
                        ${fmtP(c.current_price)}
                      </td>
                      <td className="py-3 px-3 text-right hidden sm:table-cell">
                        {ch != null ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${ch>=0?'bg-green/10 text-green':'bg-red/10 text-red'}`}>
                            {ch>=0?'▲':'▼'} {Math.abs(ch).toFixed(2)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-2 sm:px-3 w-[24%] sm:w-auto">
                        <div className="flex justify-center"><Sparkline data={spark} up={sparkUp} /></div>
                      </td>
                      <td className="py-3 px-3 text-right text-muted text-[12px] tabular-nums hidden lg:table-cell whitespace-nowrap">{fmt(c.total_volume)}</td>
                      <td className="py-3 px-3 text-right text-muted text-[12px] tabular-nums hidden xl:table-cell whitespace-nowrap">{fmt(c.market_cap)}</td>
                      <td className="py-3 px-3 text-right hidden sm:table-cell">
                        <button onClick={e=>{e.stopPropagation();navigate('/about');}}
                          className="px-3 py-1 text-[11px] font-semibold border border-border rounded-lg text-white bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 hover:border-yellow hover:text-yellow transition-all">
                          Exchange
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* caption */}
            <div className="flex items-center justify-between mt-3 px-1 text-[10.5px] text-muted">
              <span>{filtered.length} of {coins.length} coins</span>
              <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow transition-colors">Data by CoinGecko</a>
            </div>
          </div>
        )}
      </div>

      {/* ── WHY SWIFTSWAP ── */}
      <div className="px-4 md:px-8 py-10 border-t border-border">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[17px] font-bold">Why SwiftSwap?</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon:'⚡', title:'Instant Swaps', desc:'Exchanges processed automatically in 5–60 minutes. No manual steps, no waiting for operators.' },
            { icon:'🔒', title:'Non-Custodial', desc:'We never hold your funds. You send directly and receive directly to your wallet.' },
            { icon:'💱', title:'93+ Pairs',     desc:'Swap crypto to crypto, fiat to crypto, or crypto to fiat across dozens of supported pairs.' },
            { icon:'🛡️', title:'AML Protected', desc:'Every transaction is automatically screened. Clean funds, safe exchange, every time.' },
          ].map(({icon,title,desc}) => (
            <div key={title} className="bg-bg2 border border-border rounded-xl p-5 hover:border-yellow/50 transition-colors">
              <div className="text-2xl mb-3">{icon}</div>
              <div className="text-[13.5px] font-bold mb-2">{title}</div>
              <div className="text-[12px] text-muted leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="px-4 md:px-8 py-10 border-t border-border" style={{background:'#0d1117'}}>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[17px] font-bold">How It Works</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Mobile: vertical timeline */}
        <div className="flex flex-col items-center gap-0 max-w-md mx-auto md:hidden">
          {[
            { step:'01', title:'Select Direction', desc:'Choose the currency pair you want to swap from our 93+ exchange directions.' },
            { step:'02', title:'Enter Details',    desc:'Input the amount, your receiving wallet address and email for notifications.' },
            { step:'03', title:'Send Funds',       desc:'Transfer the exact amount to our payment address shown in your order.' },
            { step:'04', title:'Receive Crypto',   desc:'We automatically send the converted funds to your wallet within minutes.' },
          ].map(({step,title,desc}, i, arr) => (
            <div key={step} className="flex gap-5 w-full">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-yellow/10 border border-yellow/40 flex items-center justify-center text-yellow font-extrabold text-sm shrink-0">
                  {step}
                </div>
                {i < arr.length-1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-yellow/30 to-transparent my-1" style={{minHeight:'40px'}} />
                )}
              </div>
              <div className="pb-8">
                <div className="text-[13.5px] font-bold mb-1.5 mt-2">{title}</div>
                <div className="text-[12px] text-muted leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal steps */}
        <div className="hidden md:grid grid-cols-4 gap-0 relative">
          {/* Connecting line behind all steps */}
          <div className="absolute top-[22px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-yellow/10 via-yellow/30 to-yellow/10" />
          {[
            { step:'01', title:'Select Direction', desc:'Choose the currency pair you want to swap from our 93+ exchange directions.' },
            { step:'02', title:'Enter Details',    desc:'Input the amount, your receiving wallet address and email for notifications.' },
            { step:'03', title:'Send Funds',       desc:'Transfer the exact amount to our payment address shown in your order.' },
            { step:'04', title:'Receive Crypto',   desc:'We automatically send the converted funds to your wallet within minutes.' },
          ].map(({step,title,desc}) => (
            <div key={step} className="flex flex-col items-center text-center px-4 relative">
              <div className="w-11 h-11 rounded-full bg-yellow/10 border border-yellow/40 flex items-center justify-center text-yellow font-extrabold text-sm shrink-0 mb-4 relative z-10" style={{background:'#0d1117'}}>
                {step}
              </div>
              <div className="text-[13.5px] font-bold mb-2">{title}</div>
              <div className="text-[12px] text-muted leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link to="/about" className="px-8 py-3 bg-yellow text-black font-bold text-sm rounded-lg hover:bg-yellow-d transition-colors">
            Start Your First Exchange →
          </Link>
        </div>
      </div>

      {/* ── MARKET STATS ── */}
      <div className="px-4 md:px-8 py-10 border-t border-border">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[17px] font-bold">Market Overview</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Total Market Cap',  val: fmt(coins.reduce((s,c)=>s+(c.market_cap||0),0)),  sub:'All tracked assets', color:'text-yellow' },
            { label:'24h Total Volume',  val: fmt(coins.reduce((s,c)=>s+(c.total_volume||0),0)), sub:'Across all pairs',    color:'text-blue-400' },
            { label:'Top Gainer (24h)',  val: (() => { const g = [...coins].sort((a,b)=>(b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0))[0]; return g ? `${g.symbol?.toUpperCase()} +${g.price_change_percentage_24h?.toFixed(2)}%` : '—'; })(), sub:'Best performing', color:'text-green' },
            { label:'Top Loser (24h)',   val: (() => { const l = [...coins].sort((a,b)=>(a.price_change_percentage_24h||0)-(b.price_change_percentage_24h||0))[0]; return l ? `${l.symbol?.toUpperCase()} ${l.price_change_percentage_24h?.toFixed(2)}%` : '—'; })(), sub:'Worst performing', color:'text-red' },
          ].map(({label,val,sub,color}) => (
            <div key={label} className="bg-bg2 border border-border rounded-xl p-4">
              <div className="text-[11px] text-muted mb-1.5">{label}</div>
              <div className={`text-[16px] font-extrabold ${color} mb-1`}>{val}</div>
              <div className="text-[10.5px] text-muted">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SUPPORTED CURRENCIES ── */}
      <div className="px-4 md:px-8 py-10 border-t border-border" style={{background:'#0d1117'}}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[17px] font-bold">Supported Currencies</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          {coins.map(c => {
            const color = COLORS[c.id] || '#F0B90B';
            return (
              <div key={c.id} onClick={() => navigate('/about')}
                className="flex items-center gap-2 px-3 py-2 bg-bg2 border border-border rounded-lg hover:border-yellow cursor-pointer transition-colors group">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold shrink-0"
                  style={{background:color+'22', color}}>
                  {c.symbol?.substring(0,1)}
                </div>
                <span className="text-[12px] font-semibold group-hover:text-yellow transition-colors">{c.symbol?.toUpperCase()}</span>
              </div>
            );
          })}
          <div className="flex items-center px-3 py-2 text-[12px] text-muted">+more</div>
        </div>
      </div>

      {/* ── TRUST BADGES ── */}
      <div className="px-4 md:px-8 py-10 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon:'🔐', val:'256-bit', label:'AES Encryption' },
            { icon:'✅', val:'0',       label:'Security Incidents' },
            { icon:'⚡', val:'5–60m',   label:'Processing Time'   },
            { icon:'🌍', val:'24/7',    label:'Always Online'     },
          ].map(({icon,val,label}) => (
            <div key={label} className="flex flex-col items-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-[22px] font-extrabold text-yellow">{val}</div>
              <div className="text-[11px] text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}