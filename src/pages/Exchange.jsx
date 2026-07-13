import { useState, useEffect } from 'react';
import { Lock, Zap, ShieldCheck, Landmark, Crown, ChevronDown, AlertTriangle, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, fetchBeeSwapRoutes } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateAddress } from '../utils/addressValidator';
import { Panel, Field, Input, Checkbox, Radio, Alert, Button } from '../components/ui/kit';
import { useT } from '../lib/i18n';
import { Reveal, motion } from '../lib/motion';

// Format an amount for display: up to 2 decimals for values >= 1 (fiat/USDT),
// up to 8 for small crypto values (< 1), with thousands separators. Strips trailing zeros.
const fmtAmt = (n) => {
  const num = parseFloat(n);
  if (!num && num !== 0) return '—';
  const dp = (num !== 0 && Math.abs(num) < 1) ? 8 : 2;
  return num.toLocaleString(undefined, { maximumFractionDigits: dp });
};

export default function Exchange() {
  const t = useT();
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
    if (!give||parseFloat(give)<=0) { setError(t('exchange.errEnterAmount')); return; }
    if (overMax)     { setError(t('exchange.errOverMax', { amount: fmtAmt(F.max), symbol: F.symbol })); return; }
    if (overReserve) { setError(t('exchange.errOverReserve', { symbol: T.symbol })); return; }
    if (!address.trim()) { setError(t('exchange.errEnterAddress')); return; }
    // Validate the destination address matches the target network (skips fiat/bank payouts).
    const addrCheck = validateAddress(address, toXml, T.symbol);
    if (!addrCheck.ok) { setError(addrCheck.message); return; }
    if (!email.trim())   { setError(t('exchange.errEnterEmail')); return; }
    if (!chkRules)       { setError(t('exchange.errAgreeRules')); return; }
    if (!chkAml)         { setError(t('exchange.errAgreeAml')); return; }
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
      setError(res.error?.message || t('exchange.errGeneric'));
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

  const addrInvalid = address.trim() && !validateAddress(address, toXml, T.symbol).ok;

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Themeable ambient glow — no hardcoded gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-[360px] w-[760px] max-w-full -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]"
      />

      <div className="relative z-10 mx-auto max-w-2xl px-6 pb-24">
        {/* Back link */}
        <Link to="/about" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-brand-fg">
          <ArrowLeft className="h-4 w-4" /> {t('exchange.backToDirections')}
        </Link>

        {/* Header */}
        <Reveal variant="fadeUp">
          <header className="mb-8 text-center">
            <h1 className="text-balance text-4xl font-light tracking-tight text-fg md:text-5xl">{t('exchange.title')}</h1>
            <p className="mt-3 text-base text-muted">{t('exchange.subtitle')}</p>
          </header>
        </Reveal>

        {/* Rate summary */}
        {route && !loading && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-border bg-bg2 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted">{t('exchange.rate')}</span>
              <span className="font-semibold text-fg">{rateDisplay}</span>
            </div>
            <div className="flex items-center gap-5 text-subtle">
              <span>{t('exchange.minLabel')} <span className="text-fg">{fmtAmt(F.min)} {F.symbol}</span></span>
              <span>{t('exchange.maxLabel')} <span className="text-fg">{fmtAmt(F.max)} {F.symbol}</span></span>
              <span>{t('exchange.processingTime')}</span>
            </div>
          </div>
        )}

        {/* ── Swap ── */}
        <Reveal variant="fadeUp" delay={0.06}>
          <Panel className="mb-4" pad={false}>
            <div className="p-5">
            {/* Send */}
            <div className="rounded-2xl border border-border bg-bg p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-subtle">
                <span>{t('exchange.youSend')}</span>
                <span>{t('exchange.maxAmount', { amount: fmtAmt(F.max), symbol: F.symbol })}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="number" value={give} onChange={(e) => setGive(e.target.value)} placeholder="0.00"
                  aria-label={t('exchange.amountToSend')}
                  className="w-full min-w-0 bg-transparent text-3xl font-light text-fg outline-none placeholder:text-subtle"
                />
                <CurrencyButton img={BEESWAP_IMG(fromImg)} symbol={F.symbol || fromXml} onClick={() => navigate('/about')} />
              </div>
            </div>

            {/* Flip */}
            <div className="relative z-10 flex justify-center">
              <button
                onClick={() => navigate(`/exchange?from=${toXml}&to=${fromXml}`)}
                aria-label={t('exchange.reverseDirection')}
                className="-my-3 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-bg2 bg-bg3 text-fg transition-colors hover:bg-brand hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M8 7h12M8 7l4-4M8 7l4 4M16 17H4M16 17l4 4M16 17l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Receive */}
            <div className="rounded-2xl border border-border bg-bg p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-subtle">
                <span>{t('exchange.youReceive')}</span>
                {reserve > 0
                  ? <span className={overReserve ? 'text-red' : 'text-green'}>{t('exchange.reserveAmount', { amount: fmtAmt(reserve), symbol: T.symbol })}</span>
                  : <span className="text-green">{t('exchange.inReserve')}</span>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="number" value={take} readOnly placeholder="0"
                  aria-label={t('exchange.amountToReceive')}
                  className="w-full min-w-0 bg-transparent text-3xl font-light text-fg outline-none placeholder:text-subtle"
                />
                <CurrencyButton img={BEESWAP_IMG(toImg)} symbol={T.symbol || toXml} onClick={() => navigate('/about')} />
              </div>
            </div>

            {(overMax || overReserve) && (
              <p className="mt-3 flex items-start gap-1 text-xs text-red">
                <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                <span>
                  {overMax
                    ? t('exchange.overMaxNote', { amount: fmtAmt(F.max), symbol: F.symbol })
                    : t('exchange.overReserveNote', { symbol: T.symbol })}
                </span>
              </p>
            )}
            </div>
          </Panel>
        </Reveal>

        {/* ── Recipient ── */}
        <Panel className="mb-4">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label={t('exchange.addressLabel', { name: T.name || toXml })}
              error={addrInvalid ? validateAddress(address, toXml, T.symbol).message : undefined}
            >
              <Input
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder={t('exchange.addressPlaceholder', { symbol: T.symbol || toXml })} invalid={!!addrInvalid}
              />
            </Field>
            <Field label={t('exchange.emailLabel')} hint={t('exchange.emailHint')}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </Field>
          </div>
        </Panel>

        {/* ── Options ── */}
        <div className="mb-4 flex flex-wrap gap-3">
          <OptionChip active={priority} onClick={() => setPri(!priority)} Icon={Zap} label={t('exchange.priorityPayout')} price="+5 USDT" />
          <OptionChip active={vip} onClick={() => setVip(!vip)} Icon={Crown} label={t('exchange.vipSupport')} price="+3 USDT" />
        </div>

        {/* ── Agreements + AML ── */}
        <Panel className="mb-4 space-y-5">
          <div className="space-y-3">
            <Checkbox checked={chkRules} onChange={(e) => setRules(e.target.checked)}>
              {t('exchange.agreeRulesPre')}<Link to="/rules" className="font-medium text-brand-fg hover:underline">{t('exchange.rulesLink')}</Link>{t('exchange.agreeRulesPost')}
            </Checkbox>
            <Checkbox checked={chkAml} onChange={(e) => setAml(e.target.checked)}>
              {t('exchange.agreeAmlPre')}<Link to="/kyc" className="font-medium text-brand-fg hover:underline">{t('exchange.kycLink')}</Link>{t('exchange.agreeAmlPost')}
            </Checkbox>
          </div>

          <div className="border-t border-border pt-5">
            <div className="mb-3 text-sm font-medium text-fg">{t('exchange.selectOneOption')}</div>
            <div className="space-y-3">
              <Radio checked={amlOpt === 'refund'} onChange={() => setAmlOpt('refund')}>
                {t('exchange.amlRefund')}
              </Radio>
              <Radio checked={amlOpt === 'passed'} onChange={() => setAmlOpt('passed')}>
                {t('exchange.amlPassed')}
              </Radio>
            </div>
          </div>
        </Panel>

        {/* Error */}
        {error && (
          <Alert className="mb-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>
            {verifyNeeded && (
              <div className="mt-2 border-t border-red/20 pt-2">
                {verifySent ? (
                  <span className="text-xs text-muted">{t('exchange.verifySent', { email })}</span>
                ) : (
                  <button onClick={resendVerify} type="button" className="cursor-pointer border-none bg-transparent p-0 text-xs text-brand-fg hover:underline">
                    {t('exchange.resendVerify', { email: email || t('exchange.yourAddress') })}
                  </button>
                )}
              </div>
            )}
          </Alert>
        )}

        {/* Submit */}
        <Button size="lg" onClick={handleStart} disabled={creating || loading || overMax || overReserve} className="bg-gradient-to-br from-brand to-brand-h py-5 text-base tracking-wide">
          {creating ? t('exchange.processing') : t('exchange.startExchange')}
        </Button>

        {!isLoggedIn && (
          <p className="mt-3 text-center text-sm text-muted">
            {t('exchange.signInPre')}<Link to="/login" className="text-brand-fg hover:underline">{t('exchange.signInLink')}</Link>{t('exchange.signInPost')}
          </p>
        )}

        {/* Trust */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-6">
          {[[Lock, t('exchange.trustSecure')], [Zap, t('exchange.trustFast')], [ShieldCheck, t('exchange.trustAml')], [Landmark, t('exchange.trustReserves')]].map(([Icon, label], i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-subtle">
              <Icon className="h-3.5 w-3.5 text-brand-fg" />{label}
            </div>
          ))}
        </div>

        {/* Other directions */}
        {allRoutes.length > 1 && (
          <div className="mt-10">
            <div className="mb-3 text-sm font-medium text-muted">{t('exchange.otherDirections')}</div>
            <div className="flex flex-wrap gap-2">
              {allRoutes
                .filter((r) => !(r.from?.xml === fromXml && r.to?.xml === toXml))
                .slice(0, 12)
                .map((r, i) => (
                  <Link
                    key={i} to={`/exchange?from=${r.from?.xml}&to=${r.to?.xml}`}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-bg2 px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand/40 hover:text-brand-fg"
                  >
                    <span>{r.from?.symbol}</span>
                    <span className="text-subtle">→</span>
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

function CurrencyButton({ img, symbol, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex shrink-0 items-center gap-2 rounded-full bg-bg3 py-2 pl-2 pr-3 transition-colors hover:bg-bg4"
    >
      {img ? (
        <img src={img} alt="" className="h-7 w-7 rounded-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
          {symbol?.slice(0, 2) || '??'}
        </span>
      )}
      <span className="font-semibold text-fg">{symbol}</span>
      <ChevronDown className="h-3.5 w-3.5 text-muted" />
    </motion.button>
  );
}

function OptionChip({ active, onClick, Icon, label, price }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
        active ? 'border-brand bg-brand/10 text-fg' : 'border-border text-muted hover:text-fg'
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? 'text-brand-fg' : ''}`} />
      <span className="font-medium">{label}</span>
      <span className="text-brand-fg">{price}</span>
    </motion.button>
  );
}
