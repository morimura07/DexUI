import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, fetchBeeSwapRoutes } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateAddress } from '../utils/addressValidator';

// Format an amount for display: up to 2 decimals for values >= 1 (fiat/USDT),
// up to 8 for small crypto values (< 1), with thousands separators. Strips trailing zeros.
const fmtAmt = (n) => {
  const num = parseFloat(n);
  if (!num && num !== 0) return '—';
  const dp = (num !== 0 && Math.abs(num) < 1) ? 8 : 2;
  return num.toLocaleString(undefined, { maximumFractionDigits: dp });
};

export default function Exchange() {
  const { isLoggedIn } = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const fromXml = searchParams.get('from') || 'CARDUAH';
  const toXml   = searchParams.get('to')   || 'USDTTRC20';

  const [route, setRoute]     = useState(null);
  const [allRoutes, setAll]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [give, setGive]       = useState('');
  const [take, setTake]       = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail]     = useState('');
  const [chkRules, setRules]  = useState(false);
  const [chkAml, setAml]      = useState(false);
  const [amlOpt, setAmlOpt]   = useState('refund');
  const [priority, setPri]    = useState(false);
  const [vip, setVip]         = useState(false);
  const [error, setError]     = useState('');
  const [verifyNeeded, setVerifyNeeded] = useState(false);
  const [verifySent, setVerifySent]     = useState(false);
  const [creating, setCreate] = useState(false);

  useEffect(() => {
    fetchBeeSwapRoutes().then(routes => {
      setAll(routes);
      setRoute(routes.find(r => r.from?.xml===fromXml && r.to?.xml===toXml) || routes[0] || null);
      setLoading(false);
    });
  }, [fromXml, toXml]);

  useEffect(() => {
    if (!route || !give) { setTake(''); return; }
    const amt = parseFloat(give) || 0;
    if (amt <= 0) { setTake(''); return; }
    const rateIn  = parseFloat(route.rate?.in  || 1);
    const rateOut = parseFloat(route.rate?.out || 1);
    // If rate.out > 1: you receive rateOut per 1 given (e.g. USDT→UAH: 1 USDT = 45.44 UAH)
    // If rate.in > 1: you give rateIn per 1 received (e.g. UAH→USDT: 47.81 UAH = 1 USDT)
    let result;
    if (rateOut > 1) {
      result = amt * rateOut;
    } else {
      result = amt / rateIn;
    }
    setTake(result.toFixed((result !== 0 && Math.abs(result) < 1) ? 8 : 2));
  }, [give, route]);

  const handleStart = async () => {
    if (!isLoggedIn) { navigate('/login', {state:{from:`/exchange?from=${fromXml}&to=${toXml}`}}); return; }
    if (!give||parseFloat(give)<=0) { setError('Please enter the amount you want to give'); return; }
    if (overMax)     { setError(`Amount exceeds the maximum of ${fmtAmt(F.max)} ${F.symbol}`); return; }
    if (overReserve) { setError(`This amount exceeds our available reserve for ${T.symbol}. Please try a smaller amount.`); return; }
    if (!address.trim()) { setError('Please enter your receiving wallet address'); return; }
    // Validate the destination address matches the target network (skips fiat/bank payouts).
    const addrCheck = validateAddress(address, toXml, T.symbol);
    if (!addrCheck.ok) { setError(addrCheck.message); return; }
    if (!email.trim())   { setError('Please enter your email address'); return; }
    if (!chkRules)       { setError('You must agree to the exchange rules to proceed'); return; }
    if (!chkAml)         { setError('You must agree to the KYC/AML policy to proceed'); return; }
    setError(''); setCreate(true);
    const res = await api.createOrder({
      from_xml:             fromXml,
      to_xml:               toXml,
      amount:               give,
      destination_address:  address,
      email,
      priority,
      vip_support:          vip,
      aml_confirmed:        true,
      from_name:    F.name    || fromXml,
      from_symbol:  F.symbol  || fromXml,
      to_name:      T.name    || toXml,
      to_symbol:    T.symbol  || toXml,
      rate_in:      rateIn,
      rate_out:     rateOut > 1 ? rateOut : 0,
      min_amount:   F.min || 0,
      max_amount:   F.max || 0,
      route_uid:    route?.routeId || null,
    });
    setCreate(false);
    if (res.success) {
      // Detect fiat payment — needs bank details via chat
      const FIAT_SYMBOLS = ['UAH','USD','EUR','KZT','PLN','CZK','AED','IRN'];
      const isFiat = FIAT_SYMBOLS.includes(F.symbol) ||
                     (F.name && ['Visa','MasterCard','Privat','Mono','Bank','Card','IBAN','Cash','Wire'].some(k => F.name.includes(k)));

      navigate(`/order/${res.data.order.id}`, {
        state: {
          prefill: {
            fromSymbol:  F.symbol || fromXml,
            toSymbol:    T.symbol || toXml,
            fromName:    F.name  || fromXml,
            toName:      T.name  || toXml,
            give,
            take,
            address,
            email,
            rate:        rateDisplay,
            isFiat,
            orderId:     res.data.order.id,
          }
        }
      });

      // Trigger chat bot for fiat orders
      if (isFiat) {
        const orderId = res.data.order.id;
        window.dispatchEvent(new CustomEvent('swiftswap:fiat-order', {
          detail: { orderId, fromName: F.name || fromXml, fromSymbol: F.symbol || fromXml, toSymbol: T.symbol || toXml, give, email }
        }));
      }
    }
    else {
      setError(res.error?.message || 'Something went wrong. Please try again.');
      setVerifyNeeded(res.error?.code === 'EMAIL_NOT_VERIFIED');
    }
  };

  const resendVerify = async () => {
    if (!email.trim()) return;
    await api.resendVerification({ email });
    setVerifySent(true);
  };

  const F = route?.from || {};
  const T = route?.to   || {};
  const rateIn  = parseFloat(route?.rate?.in  || 0);
  const rateOut = parseFloat(route?.rate?.out || 0);

  // Reserve (in the TO/receive currency) and live over-limit checks.
  const reserve   = parseFloat(route?.reserve || 0);
  const giveNum   = parseFloat(give) || 0;
  const takeNum   = parseFloat(take) || 0;
  const maxNum    = parseFloat(F.max || 0);
  const overMax     = maxNum > 0 && giveNum > maxNum;
  const overReserve = reserve > 0 && takeNum > reserve;

  // Human-readable rate string
  const rateDisplay = rateOut > 1
    ? `1 ${F.symbol} = ${rateOut.toFixed(T.decimal || 2)} ${T.symbol}`
    : `1 ${T.symbol} = ${rateIn.toFixed(F.decimal || 2)} ${F.symbol}`;

  // BeeSwap image base URL
  const BEESWAP_IMG = (path) =>
    path ? `${API_BASE}/public/beeswap/image?path=${encodeURIComponent(path)}` : null;

  const fromImg = F.image?.files?.find(f => f.type === 'small')?.url;
  const toImg   = T.image?.files?.find(f => f.type === 'small')?.url;

  return (
    <div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, #1a1400 0%, #0B0E11 50%)'}}>

      {/* Hero banner with line art background */}
      <div className="relative overflow-hidden" style={{background:'radial-gradient(ellipse at 50% 100%, rgba(240,185,11,0.18) 0%, rgba(240,185,11,0.04) 40%, transparent 70%)'}}>
        {/* SVG line art */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1200 300" preserveAspectRatio="none">
          {Array.from({length:12},(_,i)=>(
            <path key={i} d={`M${500+i*20},0 Q${600+i*10},150 ${400+i*30},300`}
              stroke="#F0B90B" strokeWidth="0.8" fill="none"/>
          ))}
          {Array.from({length:8},(_,i)=>(
            <path key={`r${i}`} d={`M${700-i*15},0 Q${600-i*8},120 ${750-i*25},300`}
              stroke="#F0B90B" strokeWidth="0.5" fill="none"/>
          ))}
        </svg>

        <div className="relative z-10 px-4 md:px-12 pt-10 pb-6">
          {/* Back link */}
          <Link to="/about" className="inline-flex items-center gap-1.5 text-muted text-[12.5px] hover:text-yellow transition-colors mb-8">
            ← Back to directions
          </Link>

          {/* AML notice */}
          <div className="max-w-4xl mx-auto mb-8 rounded-xl border border-yellow/25 px-5 py-4"
            style={{background:'rgba(240,185,11,0.07)'}}>
            <p className="text-[12.5px] text-yellow/90 leading-relaxed">
              <span className="font-bold">SwiftSwap carries out automatic AML verification of all transactions</span> using specialized compliance services.
              If a transaction is flagged as high-risk (darknet, mixer, gambling, sanctions list, etc.),
              we reserve the right to suspend the exchange and request identity verification.
              Note: commissions may vary for fiat exchanges below the specified monitoring limits.
            </p>
          </div>

          {/* Title */}
          <div className="text-center mb-2">
            <h1 className="text-[36px] md:text-[48px] font-extrabold text-white tracking-tight">Swift currency exchanger</h1>
            <p className="text-muted text-[14px] mt-2">Send any currency. Receive any currency. Fast, secure, automatic.</p>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="px-4 md:px-12 pb-12 max-w-6xl mx-auto">

        {/* Rate info bar */}
        {route && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-4 py-2.5 rounded-lg border border-border bg-bg2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-muted">Exchange rate:</span>
              <span className="font-bold text-green">{rateDisplay}</span>
            </div>
            <div className="flex items-center gap-5 text-muted">
              <span>Min: <span className="text-white font-semibold">{fmtAmt(F.min)} {F.symbol}</span></span>
              <span>Max: <span className="text-white font-semibold">{fmtAmt(F.max)} {F.symbol}</span></span>
              <span>Processing: <span className="text-white font-semibold">5–60 min</span></span>
            </div>
          </div>
        )}

        {/* ── GIVE / TAKE ── full width side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {/* Give */}
          <div>
            <div className="text-[15px] font-bold mb-2">Give</div>
            <div className="flex rounded-xl overflow-hidden border border-border bg-bg2 focus-within:border-yellow transition-colors">
              <input type="number" value={give} onChange={e=>setGive(e.target.value)}
                placeholder="0.00"
                className="bg-transparent border-none outline-none text-white text-[20px] font-bold px-4 py-4 w-full placeholder-muted" />
              <button onClick={()=>navigate(`/about`)}
                className="flex items-center gap-2.5 px-4 border-l border-border bg-bg3 hover:bg-bg4 transition-colors cursor-pointer min-w-[130px] justify-center">
                {fromImg
                  ? <img src={BEESWAP_IMG(fromImg)} alt={F.symbol} className="w-7 h-7 rounded-full object-cover" onError={e=>e.target.style.display='none'} />
                  : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold" style={{background:'rgba(240,185,11,0.2)',color:'#F0B90B'}}>{F.symbol?.substring(0,2)||'??'}</div>
                }
                <span className="font-bold text-[14px]">{F.symbol||fromXml}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="#848E9C" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="text-[11px] text-muted mt-1.5 px-1">
              Min: <span className="text-white">{fmtAmt(F.min)}</span> &nbsp;·&nbsp; Max: <span className="text-white">{fmtAmt(F.max)}</span>
            </div>
            {overMax && (
              <div className="text-red text-[11px] mt-1 px-1 font-semibold">⚠ Amount exceeds the maximum of {fmtAmt(F.max)} {F.symbol}</div>
            )}
          </div>

          {/* Take */}
          <div>
            <div className="text-[15px] font-bold mb-2">Take</div>
            <div className="flex rounded-xl overflow-hidden border border-border bg-bg2">
              <input type="number" value={take} readOnly placeholder="0"
                className="bg-transparent border-none outline-none text-white text-[20px] font-bold px-4 py-4 w-full placeholder-muted" />
              <button onClick={()=>navigate(`/about`)}
                className="flex items-center gap-2.5 px-4 border-l border-border bg-bg3 hover:bg-bg4 transition-colors cursor-pointer min-w-[130px] justify-center">
                {toImg
                  ? <img src={BEESWAP_IMG(toImg)} alt={T.symbol} className="w-7 h-7 rounded-full object-cover" onError={e=>e.target.style.display='none'} />
                  : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold" style={{background:'rgba(3,166,109,0.2)',color:'#03A66D'}}>{T.symbol?.substring(0,2)||'??'}</div>
                }
                <span className="font-bold text-[14px]">{T.symbol||toXml}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="#848E9C" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="text-[11px] mt-1.5 px-1">
              {reserve > 0
                ? <span className={overReserve ? 'text-red font-semibold' : 'text-green'}>
                    Reserve: <span className="font-semibold">{fmtAmt(reserve)} {T.symbol}</span>
                    {overReserve && <span className="block text-red mt-0.5">⚠ Exceeds available reserve — try a smaller amount</span>}
                  </span>
                : <span className="text-green">Reserve: <span className="font-semibold">available</span></span>
              }
            </div>
          </div>
        </div>

        {/* Swap direction */}
        <div className="flex justify-center my-4">
          <button onClick={()=>navigate(`/exchange?from=${toXml}&to=${fromXml}`)}
            className="w-10 h-10 rounded-full bg-bg3 border border-border flex items-center justify-center hover:bg-yellow hover:border-yellow transition-colors cursor-pointer group shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              className="stroke-muted group-hover:stroke-black transition-colors">
              <path d="M8 7h12M8 7l4-4M8 7l4 4M16 17H4M16 17l4 4M16 17l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── ADDRESS / EMAIL ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-[15px] font-bold mb-2">{T.name||toXml} address</div>
            <div className="flex items-center rounded-xl border border-border bg-bg2 focus-within:border-yellow transition-colors overflow-hidden">
              <input type="text" value={address} onChange={e=>setAddress(e.target.value)}
                placeholder={`${T.symbol||toXml} address`}
                className="bg-transparent border-none outline-none text-white text-[13.5px] px-4 py-4 w-full placeholder-muted" />
              <div className="pr-4 text-muted text-lg shrink-0">◈</div>
            </div>
            {address.trim() && !validateAddress(address, toXml, T.symbol).ok && (
              <div className="text-red text-[11px] mt-1.5 flex items-start gap-1">
                <span>⚠</span>
                <span>{validateAddress(address, toXml, T.symbol).message}</span>
              </div>
            )}
          </div>
          <div>
            <div className="text-[15px] font-bold mb-2">E-mail</div>
            <div className="flex items-center rounded-xl border border-border bg-bg2 focus-within:border-yellow transition-colors overflow-hidden">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="E-mail"
                className="bg-transparent border-none outline-none text-white text-[13.5px] px-4 py-4 w-full placeholder-muted" />
            </div>
          </div>
        </div>

        {/* ── OPTIONAL SERVICES ── */}
        <div className="flex flex-wrap gap-4 mb-5">
          <Chk checked={priority} onChange={e=>setPri(e.target.checked)}>
            ⚡ Priority payout &nbsp;<span className="text-yellow font-bold">(+5 USDT)</span>
          </Chk>
          <Chk checked={vip} onChange={e=>setVip(e.target.checked)}>
            👑 VIP support &nbsp;<span className="text-yellow font-bold">(+3 USDT)</span>
          </Chk>
        </div>

        {/* ── AGREEMENTS ── */}
        <div className="flex flex-col gap-3 mb-5">
          <Chk checked={chkRules} onChange={e=>setRules(e.target.checked)}>
            I agree with the <Link to="/rules" className="text-yellow hover:underline font-semibold">rules</Link>.
          </Chk>
          <Chk checked={chkAml} onChange={e=>setAml(e.target.checked)}>
            I agree with the <Link to="/kyc" className="text-yellow hover:underline font-semibold">KYC/AML policy</Link>.
          </Chk>
        </div>

        {/* ── AML OPTIONS ── */}
        <div className="mb-5">
          <div className="text-[13px] text-white font-semibold mb-3">Select one option:</div>
          <div className="flex flex-col gap-3">
            {[
              { val:'refund', label:'I confirm my consent to a refund in case the exchange is suspended due to AML reasons and understand that a network fee may be deducted from the exchange amount upon refund.' },
              { val:'passed', label:'I have passed the preliminary AML check.' },
            ].map(opt => (
              <label key={opt.val} className="flex items-start gap-3 text-[12.5px] text-muted cursor-pointer leading-relaxed hover:text-white transition-colors">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${amlOpt===opt.val?'border-yellow':'border-muted'}`}
                  onClick={()=>setAmlOpt(opt.val)}>
                  {amlOpt===opt.val && <div className="w-2.5 h-2.5 rounded-full bg-yellow" />}
                </div>
                <span onClick={()=>setAmlOpt(opt.val)}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red/10 border border-red/30 rounded-xl px-4 py-3 mb-4 text-[12.5px] text-red">
            <div className="flex items-center gap-2.5">⚠ {error}</div>
            {verifyNeeded && (
              <div className="mt-2 pt-2 border-t border-red/20">
                {verifySent ? (
                  <span className="text-[11.5px] text-muted">Verification email sent to {email}. Check your inbox, then try again.</span>
                ) : (
                  <button onClick={resendVerify} type="button"
                    className="text-[11.5px] text-yellow hover:underline cursor-pointer bg-transparent border-none p-0">
                    Resend verification email to {email || 'your address'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── START BUTTON ── */}
        <button onClick={handleStart} disabled={creating||loading||overMax||overReserve}
          className="w-full py-5 text-black font-extrabold text-[16px] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-wide"
          style={{background:'linear-gradient(135deg,#F0B90B 0%,#d4a209 100%)'}}>
          {creating ? '⏳  Processing your order…' : 'Start exchange'}
        </button>

        {!isLoggedIn && (
          <div className="text-center mt-3 text-[12px] text-muted">
            You'll be asked to <Link to="/login" className="text-yellow hover:underline">sign in</Link> before your order is confirmed
          </div>
        )}

        {/* Trust row */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-border">
          {[['🔒','End-to-end secure'],['⚡','5–60 min processing'],['🛡️','AML compliant'],['💼','Own reserves']].map(([icon,label])=>(
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>

        {/* Other directions */}
        {allRoutes.length > 1 && (
          <div className="mt-8">
            <div className="text-[13px] text-muted font-semibold mb-3">Other available directions</div>
            <div className="flex flex-wrap gap-2">
              {allRoutes
                .filter(r=>!(r.from?.xml===fromXml&&r.to?.xml===toXml))
                .slice(0,12)
                .map((r,i)=>(
                  <Link key={i} to={`/exchange?from=${r.from?.xml}&to=${r.to?.xml}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bg2 border border-border rounded-lg text-[12px] font-semibold hover:border-yellow hover:text-yellow transition-colors">
                    <span>{r.from?.symbol}</span>
                    <span className="text-muted text-xs">→</span>
                    <span>{r.to?.symbol}</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chk({checked, onChange, children}) {
  return (
    <label className="flex items-start gap-2.5 text-[12.5px] text-muted cursor-pointer leading-relaxed hover:text-white transition-colors">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked?'border-yellow bg-yellow/20':'border-muted'}`}
        onClick={()=>onChange({target:{checked:!checked}})}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#F0B90B" strokeWidth="1.5" strokeLinecap="round"/></svg>}
      </div>
      <span onClick={()=>onChange({target:{checked:!checked}})}>{children}</span>
    </label>
  );
}