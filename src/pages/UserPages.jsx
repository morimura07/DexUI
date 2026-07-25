import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageCircle, Search, Loader2, CheckCircle2, Clock, XCircle, Check, ArrowLeft, ArrowRight, RefreshCw, ClipboardList, Copy, Share2, Wallet, Repeat, ShieldAlert, ShieldCheck, Upload } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Panel, Button, SectionLabel, RingAccent } from '../components/ui/kit';
import { useT } from '../lib/i18n';
import { Reveal, RevealGroup, RevealItem, motion, lift, CountUp } from '../lib/motion';

// DB sends timestamps as "YYYY-MM-DD HH:MM:SS" (space, no TZ). Browsers may parse that
// as an Invalid Date, which caused orders to show "Expired" instantly. Normalise to ISO.
const parseTs = d => new Date(String(d || '').replace(' ', 'T'));

const badgeClass = s => ({
  WAIT_PAYMENT:'bg-brand/10 text-brand-fg', PAYMENT_RECEIVED:'bg-info/10 text-info',
  UNDER_REVIEW:'bg-info/10 text-info',
  PROCESSING:'bg-info/10 text-info', COMPLETED:'bg-green/10 text-green',
  EXPIRED:'bg-red/10 text-red', CANCELLED:'bg-red/10 text-red',
  AML_HOLD:'bg-hold/10 text-hold', KYC_HOLD:'bg-hold/10 text-hold', REFUNDED:'bg-bg3 text-muted',
}[s]||'bg-bg3 text-muted');

const Badge = ({status}) => {
  const t = useT();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{status ? t(`myOrders.badge.${status}`) : ''}
    </span>
  );
};

// ── ORDER PAGE ──
export function OrderPage() {
  const t = useT();
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const location    = window.history.state?.usr || {};
  const prefill     = location.prefill || null;

  const [order, setOrder]      = useState(null);
  const [loading, setLoad]     = useState(true);
  const [timeLeft, setTime]    = useState(null); // null until order loads
  const [copied, setCopied]    = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [revealPay, setRevealPay]   = useState(false); // crypto: show wallet/QR after "Continue to payment"
  const [marking, setMarking]       = useState(false); // disables button while marking paid
  const timerRef = useRef();
  const pollRef  = useRef();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate(`/login`, { state: { from: `/order/${orderId}` } });
    }
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchOrder = async () => {
      const res = await api.getOrder(orderId);
      if (res.success && res.data?.order) {
        const o = res.data.order;
        setOrder(o);
        // Set timer from real expires_at. DB sends "YYYY-MM-DD HH:MM:SS" (space, no TZ);
        // normalise to ISO so browsers don't parse it as Invalid Date (which caused false expiry).
        if (o.expires_at) {
          const ms = parseTs(o.expires_at).getTime();
          setTime(Number.isFinite(ms) ? Math.max(0, Math.floor((ms - Date.now()) / 1000)) : null);
        }
      }
      setLoad(false);
    };
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 15000);
    return () => { clearInterval(timerRef.current); clearInterval(pollRef.current); };
  }, [orderId, isLoggedIn]);

  // Start countdown only once timeLeft is set from real expires_at
  useEffect(() => {
    if (timeLeft === null) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTime(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft === null]);

  // NOTE: no client-side auto-cancel. The backend auto-expires orders past their
  // expires_at on every getOrder() (polled every 15s), returning status EXPIRED.
  // Cancelling from the client caused brand-new orders to be cancelled on load when
  // a timezone-ambiguous timestamp parsed as an invalid date. When the countdown
  // reaches 0 we just refetch so the server's decision is reflected.
  useEffect(() => {
    if (timeLeft === 0 && order?.status === 'WAIT_PAYMENT') {
      clearInterval(timerRef.current);
      api.getOrder(orderId).then(r => { if (r.success) setOrder(r.data.order); });
    }
  }, [timeLeft]);

  const fmt  = s => s === null ? '--:--' : `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const copy = (text, setter) => { navigator.clipboard.writeText(text||''); setter(true); setTimeout(()=>setter(false),2000); };
  const handlePaid   = async () => {
    setMarking(true);
    const r = await api.updateOrderStatus({ order_id: orderId, status: 'PAID', email: order?.email || prefill?.email || '' });
    setMarking(false);
    if (r.success) setOrder(r.data.order);
  };
  const handleCancel = async () => {
    const r = await api.updateOrderStatus({ order_id: orderId, status: 'CANCELLED', email: order?.email || prefill?.email || '' });
    if (r.success) setOrder(r.data.order);
  };
  const openChat = () => window.dispatchEvent(new CustomEvent('swiftswap:open-chat'));

  const fromSymbol  = order?.from?.symbol  || prefill?.fromSymbol  || '—';
  const toSymbol    = order?.to?.symbol    || prefill?.toSymbol    || '—';
  const fromName    = order?.from?.name    || prefill?.fromName    || '';
  const toName      = order?.to?.name      || prefill?.toName      || '';
  const giveAmt     = order?.from?.amount  || prefill?.give        || '—';
  const takeAmt     = order?.to?.amount    || prefill?.take        || '—';
  const destAddr    = order?.to?.destination_address || prefill?.address || '—';
  const emailVal    = order?.email         || prefill?.email       || '—';
  const rateVal     = prefill?.rate        || '';
  const payAddress  = order?.payment?.address || '';

  if (authLoading || (loading && !prefill)) return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-brand-fg" />
        {t('order.loadingOrder')}
      </div>
    </div>
  );
  if (!loading && !order && !prefill) return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
      {t('order.notFound')} <Link to="/about" className="ml-1 text-brand-fg">{t('order.createNewOrder')}</Link>
    </div>
  );

  // Fiat/bank orders have no crypto wallet — the backend leaves the payment address as
  // PENDING_OPERATOR_ASSIGNMENT and the operator handles payment in chat. That sentinel
  // (and the isFiat flag passed from the Exchange page) are the reliable signals; the
  // symbol/name hints are a fallback for the moment before the order finishes loading.
  const symU  = (fromSymbol || '').toUpperCase();
  const nameU = (fromName   || '').toUpperCase();
  const FIAT_SYMBOLS    = ['UAH','EUR','KZT','PLN','CZK','AED','IRN','USD']; // exact match (USD here won't match USDT)
  const FIAT_NAME_HINTS = ['CARD','BANK','VISA','MASTER','IBAN','PRIVAT','MONO','KASPI','HALYK','SEPA','WISE','BLIK','CASH'];
  const isFiat = prefill?.isFiat
    || payAddress === 'PENDING_OPERATOR_ASSIGNMENT'
    || FIAT_SYMBOLS.includes(symU)
    || symU.includes('UAH')                    // CARDUAH, etc.
    || FIAT_NAME_HINTS.some(h => nameU.includes(h));

  const statusHeading = () => {
    const s = order?.status;
    if (s === 'WAIT_PAYMENT') return [t('order.status.waitingForPayment'), 'text-brand-fg'];
    if (['PAYMENT_RECEIVED','UNDER_REVIEW'].includes(s)) return [t('order.status.underReview'), 'text-info'];
    if (s === 'PROCESSING') return [t('order.status.processing'), 'text-info'];
    if (s === 'COMPLETED') return [t('order.status.completed'), 'text-green'];
    if (s === 'EXPIRED') return [t('order.status.expired'), 'text-red'];
    if (s === 'CANCELLED') return [t('order.status.cancelled'), 'text-red'];
    if (s === 'KYC_HOLD') return [t('order.status.awaitingVerification'), 'text-hold'];
    return [t('order.status.new'), 'text-brand-fg'];
  };
  const [statusWord, statusTone] = statusHeading();

  const Row = ({ k, v, tone = '', mono = false }) => (
    <div className="py-2.5">
      <div className="text-xs text-subtle">{k}</div>
      <div className={`mt-0.5 font-semibold ${mono ? 'break-all font-mono text-xs' : 'text-sm'} ${tone}`}>{v}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16">
      <Reveal variant="fadeUp">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-light tracking-tight text-fg md:text-4xl">
            {t('order.exchangeHeading')}{' '}
            <motion.span key={order?.status} className={`inline-block ${statusTone}`}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
              {statusWord}
            </motion.span>
          </h1>
        </div>
      </Reveal>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">

        {/* LEFT — Transfer details */}
        <Panel pad={false} className="self-start">
          <div className="border-b border-border px-5 py-4 text-sm font-medium text-muted">{t('order.transferDetails')}</div>
          <div className="divide-y divide-border px-5">
            <Row k={t('order.orderId')} v={<span className="text-brand-fg">{orderId}</span>} />
            {rateVal && <Row k={t('order.rate')} v={<span className="text-green">{rateVal}</span>} />}
            <Row k={`${t('order.youSend')}${fromName ? ` · ${fromName}` : ''}`} v={`${parseFloat(giveAmt||0).toFixed(2)} ${fromSymbol}`} />
            <Row k={`${t('order.youReceive')}${toName ? ` · ${toName}` : ''}`} v={`${parseFloat(takeAmt||0).toFixed(2)} ${toSymbol}`} tone="text-green" />
            <Row k={t('order.nameAddress', { name: toName || t('order.destination') })} v={destAddr} mono />
            <Row k={t('order.email')} v={<span className="text-muted">{emailVal}</span>} />
            {order?.expires_at && order?.status === 'WAIT_PAYMENT' && (
              <>
                <Row k={t('order.actualUntil')} v={<span className="text-sm text-fg">{parseTs(order.expires_at).toLocaleString()}</span>} />
                <div className="py-3">
                  <div className="text-xs text-subtle">{t('order.timeLeft')}</div>
                  <div className={`mt-0.5 text-3xl font-light tabular-nums ${timeLeft !== null && timeLeft < 300 ? 'text-red' : 'text-brand-fg'}`}>{fmt(timeLeft)}</div>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* RIGHT — Payment action area */}
        <Reveal variant="fadeIn" className="self-start">
        <Panel className="self-start">

          {/* ───────── WAIT_PAYMENT ───────── */}
          {order?.status === 'WAIT_PAYMENT' && isFiat && (
            <div className="py-6 text-center">
              <MessageCircle className="mx-auto mb-4 h-10 w-10 text-brand-fg" />
              <div className="mb-2 text-lg font-medium text-fg">{t('order.fiat.title')}</div>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted">
                {t('order.fiat.desc1')} <strong className="text-brand-fg">{t('order.fiat.iHavePaidQuoted')}</strong> {t('order.fiat.desc2')}
              </p>
              <Button onClick={openChat} className="mx-auto"><MessageCircle className="h-4 w-4" /> {t('order.fiat.openChat')}</Button>
              <p className="mt-3 text-xs text-subtle">{t('order.orderId')}: <span className="font-medium text-brand-fg">{orderId}</span> {t('order.fiat.neverOnPage')}</p>
              <button onClick={handleCancel}
                className="mx-auto mt-5 block cursor-pointer rounded-lg border border-border bg-transparent px-5 py-2 text-sm text-muted transition-colors hover:border-red hover:text-red">
                {t('order.cancelOrder')}
              </button>
            </div>
          )}

          {/* Crypto — step 1: confirm details */}
          {order?.status === 'WAIT_PAYMENT' && !isFiat && !revealPay && (
            <>
              <div className="mb-4 text-base font-medium text-fg">{t('order.confirm.title')}</div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-xs text-subtle">{t('order.youReceive')}</div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green/20 text-[9px] font-bold text-green">{toSymbol?.substring(0,2)}</span>
                    <span className="text-sm text-muted">{toName}</span>
                    <span className="ml-auto text-sm font-semibold text-fg">{parseFloat(takeAmt||0).toFixed(2)} {toSymbol}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-subtle">{t('order.nameAddress', { name: toName })}</div>
                  <div className="break-all rounded-xl border border-border bg-bg px-3 py-2.5 font-mono text-xs text-muted">{destAddr}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-subtle">{t('order.email')}</div>
                  <div className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-fg">{emailVal}</div>
                </div>
              </div>
              <Button size="lg" onClick={()=>setRevealPay(true)} className="mt-5 py-3">{t('order.confirm.continueToPayment')}</Button>
              <Button size="lg" variant="outline" onClick={handleCancel} className="mt-2 py-2.5 hover:border-red hover:text-red">{t('order.cancel')}</Button>
            </>
          )}

          {/* Crypto — step 2: send funds, then mark as paid */}
          {order?.status === 'WAIT_PAYMENT' && !isFiat && revealPay && (
            <div className="text-center">
              <div className="mb-1 text-base font-medium text-fg">{t('order.pay.title')}</div>
              <p className="mb-4 text-xs text-muted">{t('order.pay.subtitle')}</p>
              <div className="mb-4 flex justify-center">
                <div className="flex h-36 w-36 items-center justify-center rounded-xl bg-white p-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(payAddress || '')}&bgcolor=ffffff&color=000000&margin=2`}
                    alt={t('order.pay.qrAlt')}
                    className="h-full w-full rounded-lg"
                    onError={e => e.target.style.display='none'}
                  />
                </div>
              </div>
              <div className="mb-3 text-left">
                <div className="mb-1.5 text-xs text-subtle">{t('order.pay.amountToSend')}</div>
                <div className="rounded-xl border border-border bg-bg px-4 py-3 text-sm font-semibold text-fg">{parseFloat(giveAmt||0).toFixed(2)} {fromSymbol}</div>
              </div>
              <div className="mb-4 text-left">
                <div className="mb-1.5 text-xs text-subtle">{t('order.pay.toThisAddress', { symbol: fromSymbol })}</div>
                <div className="flex items-center gap-2 rounded-xl border border-brand/30 bg-bg px-4 py-3">
                  <span className="flex-1 break-all font-mono text-xs text-brand-fg">{payAddress && payAddress !== 'PENDING_OPERATOR_ASSIGNMENT' ? payAddress : t('order.pay.addressBeingAssigned')}</span>
                  {payAddress && payAddress !== 'PENDING_OPERATOR_ASSIGNMENT' && (
                    <button onClick={()=>copy(payAddress, setCopied)}
                      className="flex shrink-0 items-center gap-1 cursor-pointer rounded-lg border border-border bg-bg3 px-2.5 py-1 text-xs transition-colors hover:border-brand hover:text-brand-fg">
                      {copied ? <><Check className="h-3 w-3" /> {t('order.copied')}</> : t('order.copy')}
                    </button>
                  )}
                </div>
              </div>
              <Button size="lg" onClick={handlePaid} disabled={marking} className="py-3">
                {marking ? t('order.pay.submitting') : <><Check className="h-4 w-4" /> {t('order.pay.iHavePaid')}</>}
              </Button>
              <Button size="lg" variant="outline" onClick={()=>setRevealPay(false)} className="mt-2 py-2.5"><ArrowLeft className="h-4 w-4" /> {t('order.back')}</Button>
            </div>
          )}

          {/* ───────── UNDER_REVIEW (paid, awaiting admin confirmation) ───────── */}
          {['UNDER_REVIEW','PAYMENT_RECEIVED'].includes(order?.status||'') && (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-info" />
              <div className="mb-2 text-lg font-medium text-info">{t('order.review.title')}</div>
              <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-muted">
                {t('order.review.desc1')}
                <strong className="text-fg"> {parseFloat(takeAmt||0).toFixed(2)} {toSymbol}</strong> {t('order.review.desc2')}
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-info/20 bg-info/10 px-4 py-2 text-xs text-info">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" /> {t('order.review.awaiting')}
              </div>
              <p className="mt-4 text-xs text-subtle">{t('order.orderId')}: <span className="font-medium text-brand-fg">{orderId}</span></p>
            </div>
          )}

          {order?.status === 'PROCESSING' && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-info" />
              <div className="mb-2 text-lg font-medium text-fg">{t('order.processing.title')}</div>
              <p className="text-sm text-muted">{t('order.processing.desc', { amount: `${parseFloat(takeAmt||0).toFixed(2)} ${toSymbol}` })}</p>
            </div>
          )}

          {/* KYC_HOLD — held for review, not rejected. Payment details stay hidden
              (they're gated on WAIT_PAYMENT) until an admin approves and the
              backend flips this order back on its own. */}
          {order?.status === 'KYC_HOLD' && (
            <div className="py-8 text-center">
              <ShieldAlert className="mx-auto mb-4 h-11 w-11 text-hold" />
              <div className="mb-3 text-xl font-light text-hold">{t('order.kycHold.title')}</div>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted">{t('order.kycHold.desc')}</p>
              <Button onClick={() => navigate('/profile', { state: { tab: 'verification' } })} className="mx-auto">
                {t('order.kycHold.verify')}
              </Button>
            </div>
          )}

          {order?.status === 'COMPLETED' && (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-11 w-11 text-green" />
              <div className="mb-2 text-xl font-light text-green">{t('order.completed.title')}</div>
              <p className="mb-5 text-sm text-muted">{t('order.completed.desc', { amount: `${parseFloat(takeAmt||0).toFixed(2)} ${toSymbol}` })}</p>
              <Button onClick={()=>navigate('/about')} className="mx-auto">{t('order.newExchange')}</Button>
            </div>
          )}

          {/* EXPIRED/CANCELLED — hide all payment details */}
          {['EXPIRED','CANCELLED'].includes(order?.status||'') && (
            <div className="py-8 text-center">
              {order?.status === 'EXPIRED'
                ? <Clock className="mx-auto mb-4 h-11 w-11 text-red" />
                : <XCircle className="mx-auto mb-4 h-11 w-11 text-red" />}
              <div className="mb-3 text-xl font-light text-red">
                {order?.status === 'EXPIRED' ? t('order.ended.expiredTitle') : t('order.ended.cancelledTitle')}
              </div>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted">
                {order?.status === 'EXPIRED'
                  ? t('order.ended.expiredDesc')
                  : t('order.ended.cancelledDesc')}
              </p>
              <Button onClick={()=>navigate('/about')} className="mx-auto">{t('order.createNewOrder')}</Button>
            </div>
          )}

          {!order && prefill && (
            <div className="shimmer py-8 text-center text-sm text-muted">{t('order.loadingDetails')}</div>
          )}
        </Panel>
        </Reveal>
      </div>
    </div>
  );
}

// ── MY ORDERS ──
export function MyOrders() {
  const t = useT();
  const [orders, setOrders] = useState([]);
  const [tab, setTab]       = useState('CURRENT');
  const [loading, setLoad]  = useState(true);
  const navigate            = useNavigate();

  useEffect(() => {
    api.myOrders().then(res => { if (res.success) setOrders(res.data.orders||[]); setLoad(false); });
  }, []);

  const TABS = [
    { key:'CURRENT',   label:t('myOrders.tabs.current'),   statuses:['WAIT_PAYMENT','PAYMENT_RECEIVED','UNDER_REVIEW','PROCESSING','AML_HOLD','KYC_HOLD'] },
    { key:'COMPLETED', label:t('myOrders.tabs.completed'), statuses:['COMPLETED'] },
    { key:'CANCELLED', label:t('myOrders.tabs.cancelled'), statuses:['CANCELLED','EXPIRED','REFUNDED'] },
    { key:'ALL',       label:t('myOrders.tabs.all'), statuses:null },
  ];

  const currentTab = TABS.find(t=>t.key===tab);
  const filtered   = currentTab.statuses
    ? orders.filter(o => currentTab.statuses.includes(o.status))
    : orders;

  const counts = {};
  TABS.forEach(t => {
    counts[t.key] = t.statuses ? orders.filter(o=>t.statuses.includes(o.status)).length : orders.length;
  });

  // Presentational only — renders one order card. Hover-lift via `lift`; the row's
  // click/navigation behaviour is unchanged.
  const renderCard = (o, i) => {
    const isActive   = ['WAIT_PAYMENT','PAYMENT_RECEIVED','UNDER_REVIEW','PROCESSING','AML_HOLD','KYC_HOLD'].includes(o.status);
    const isComplete = o.status === 'COMPLETED';
    return (
      <motion.div key={i} {...lift} onClick={()=>navigate(`/order/${o.order_id||o.id}`)}
        className={`group cursor-pointer rounded-xl border bg-bg2 px-4 py-3.5 transition-colors hover:border-brand/50
          ${isActive?'border-brand/30':isComplete?'border-green/20':'border-border'}`}>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-fg">#{o.id||o.order_id}</span>
            <Badge status={o.status} />
          </div>
          <span className="text-xs text-subtle">{new Date(o.created_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex shrink-0 items-center -space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg2 bg-brand/15 text-[10px] font-bold text-brand-fg">{(o.from?.symbol || o.from_symbol || '?').slice(0,2)}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg2 bg-bg3 text-[10px] font-bold text-fg">{(o.to?.symbol || o.to_symbol || '?').slice(0,2)}</span>
          </span>
          <div className="min-w-0">
            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-subtle">{t('myOrders.youSend')}</div>
            <div className="text-sm font-semibold leading-none text-fg">
              {parseFloat(o.from?.amount || o.from_amount || 0).toFixed(2)} <span className="text-xs font-normal text-muted">{o.from?.symbol || o.from_symbol || '—'}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-subtle" />
          <div className="min-w-0">
            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-subtle">{t('myOrders.youReceive')}</div>
            <div className={`text-sm font-semibold leading-none ${isComplete?'text-green':'text-fg'}`}>
              {parseFloat(o.to?.amount || o.to_amount || 0).toFixed(2)} <span className="text-xs font-normal text-muted">{o.to?.symbol || o.to_symbol || '—'}</span>
            </div>
          </div>
          {o.status === 'WAIT_PAYMENT' && o.expires_at && (
            <div className="ml-auto text-right">
              <div className="mb-0.5 text-[9px] uppercase tracking-wide text-subtle">{t('myOrders.expires')}</div>
              <div className={`text-sm font-semibold ${parseTs(o.expires_at) > new Date() ? 'text-brand-fg' : 'text-red'}`}>
                {parseTs(o.expires_at) > new Date()
                  ? t('myOrders.minutesLeft', { minutes: Math.max(0,Math.floor((parseTs(o.expires_at)-Date.now())/60000)) })
                  : t('myOrders.expired')}
              </div>
            </div>
          )}
          {['UNDER_REVIEW','PAYMENT_RECEIVED','PROCESSING'].includes(o.status) && (
            <div className="ml-auto text-right">
              <div className="mb-0.5 text-[9px] uppercase tracking-wide text-subtle">{t('myOrders.statusLabel')}</div>
              <div className="text-sm font-semibold text-info">{t('myOrders.underReview')}</div>
            </div>
          )}
          <div className={`text-muted transition-colors group-hover:text-brand-fg ${(o.status==='WAIT_PAYMENT'&&o.expires_at)||['UNDER_REVIEW','PAYMENT_RECEIVED','PROCESSING'].includes(o.status)?'':'ml-auto'}`}>›</div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16">
      <Reveal variant="fadeUp">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-light tracking-tight text-fg">{t('myOrders.title')}</h1>
          <Button onClick={()=>navigate('/about')} size="md">{t('myOrders.newExchange')}</Button>
        </div>
      </Reveal>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors
              ${tab===t.key?'text-brand-fg':'text-muted hover:text-fg'}`}>
            {tab===t.key && <motion.span layoutId="orders-tab" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
            <span className="relative z-10">{t.label}</span>
            {counts[t.key] > 0 && (
              <span className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                ${tab===t.key?'bg-brand/20 text-brand-fg':'bg-bg3 text-muted'}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="shimmer py-16 text-center text-sm text-muted">{t('myOrders.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-3 flex justify-center text-muted/40">
            {tab === 'CURRENT' ? <RefreshCw className="h-8 w-8" /> : tab === 'COMPLETED' ? <CheckCircle2 className="h-8 w-8" /> : <ClipboardList className="h-8 w-8" />}
          </div>
          <div className="text-sm text-muted">{t(`myOrders.empty.${tab.toLowerCase()}`)}</div>
          {tab === 'CURRENT' && (
            <Button onClick={()=>navigate('/about')} className="mx-auto mt-4">{t('myOrders.startExchange')}</Button>
          )}
        </div>
      ) : filtered.length <= 12 ? (
        <RevealGroup className="flex flex-col gap-2.5">
          {filtered.map((o,i) => <RevealItem key={i} variant="fadeUp">{renderCard(o,i)}</RevealItem>)}
        </RevealGroup>
      ) : (
        <Reveal variant="fadeUp" className="flex flex-col gap-2.5">
          {filtered.map((o,i) => renderCard(o,i))}
        </Reveal>
      )}
    </div>
  );
}

// ── PROFILE / ACCOUNT ──
const initialsOf = (name, email) => {
  const s = (name || email || '?').trim();
  const p = s.split(/\s+/);
  return (p.length > 1 ? p[0][0] + p[1][0] : s.slice(0, 2)).toUpperCase();
};
const fmtDate = d => { try { return d ? new Date(String(d).replace(' ', 'T')).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '—'; } catch { return '—'; } };
const pctOf = (cur, max) => { const m = Number(max) || 0, c = Number(cur) || 0; return m > 0 ? Math.min(100, (c / m) * 100) : 0; };

const PInput = ({ label, type = 'text', value, onChange, placeholder = '' }) => (
  <div>
    {label && <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand" />
  </div>
);
const PCard = ({ title, desc, children, danger, action, className = '' }) => (
  <div className={`rounded-2xl border bg-bg2 p-5 ${danger ? 'border-red/30' : 'border-border'} ${className}`}>
    {(title || action) && (
      <div className="mb-3 flex items-center justify-between gap-3">
        {title && <div className={`text-sm font-semibold ${danger ? 'text-red' : 'text-fg'}`}>{title}</div>}
        {action}
      </div>
    )}
    {desc && <div className="mb-4 text-xs leading-relaxed text-muted">{desc}</div>}
    {children}
  </div>
);
const PChip = ({ ok, warn, label }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium
    ${ok ? 'border-green/20 bg-green/10 text-green' : warn ? 'border-brand/20 bg-brand/10 text-brand-fg' : 'border-border bg-bg3 text-muted'}`}>
    <span className="h-1 w-1 rounded-full bg-current" />{label}
  </span>
);
const PBar = ({ label, cur, max, suffix = '' }) => (
  <div>
    <div className="mb-1.5 flex justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-fg">
        <CountUp value={Number(cur || 0)} format={n => Math.round(n).toLocaleString()} /> / <CountUp value={Number(max || 0)} format={n => Math.round(n).toLocaleString()} />{suffix}
      </span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-bg">
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pctOf(cur, max)}%` }} />
    </div>
  </div>
);
const PStat = ({ label, value, tone = '' }) => (
  <div className="rounded-xl border border-border bg-bg2 px-4 py-3">
    <div className="mb-0.5 text-[10px] uppercase tracking-wide text-subtle">{label}</div>
    <div className={`text-sm font-semibold ${tone || 'text-fg'}`}>{value}</div>
  </div>
);

// ── KYC ──
// The new /user/profile/kyc/* endpoints report NONE|PENDING|APPROVED|REJECTED.
// The older /user/verification/* surface reports lowercase and uses "verified"
// where the new one says "approved", so both are folded into one vocabulary.
const KYC_STATES = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'];
const normKyc = s => {
  const u = String(s || '').toUpperCase();
  if (u === 'VERIFIED') return 'APPROVED';
  return KYC_STATES.includes(u) ? u : 'NONE';
};
const DOC_TYPES = ['passport', 'national_id', 'drivers_license'];
// PHP's default upload_max_filesize is 2 MB and rejects larger uploads before the
// app sees them, which surfaces as a silent failure. Production is raised to 10 MB;
// catching it here gives a real message instead of a mystery.
const MAX_DOC_BYTES = 10 * 1024 * 1024;

function KycPanel({ state, submission, onSubmitted, toast }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [docType, setDoc] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const pickFile = e => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_DOC_BYTES) {
      toast('err', t('profile.kycPanel.tooLarge', { mb: Math.round(MAX_DOC_BYTES / 1024 / 1024) }));
      e.target.value = '';
      return setFile(null);
    }
    setFile(f);
  };

  const submit = async () => {
    if (!name.trim()) return toast('err', t('profile.kycPanel.nameRequired'));
    // Optional at the API level, but an admin can't review a submission without it.
    if (!file) return toast('err', t('profile.kycPanel.fileRequired'));
    setBusy(true);
    const fd = new FormData();
    fd.append('full_name', name.trim());
    fd.append('document_type', docType);
    fd.append('document', file);
    const r = await api.kycSubmit(fd);
    setBusy(false);
    if (r?.success) {
      toast('ok', r.data?.message || t('profile.kycPanel.submitted'));
      setOpen(false); setName(''); setFile(null);
      return onSubmitted();
    }
    if (r?.status === 409) { onSubmitted(); return toast('err', t('profile.kycPanel.alreadyPending')); }
    if (r?.status === 422) return toast('err', t('profile.kycPanel.missingFields'));
    toast('err', r?.error?.message || t('profile.kycPanel.failed'));
  };

  if (state === 'APPROVED') {
    return (
      <div className="flex items-start gap-2.5 text-sm text-green">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t('profile.identity.verified')}</span>
      </div>
    );
  }

  if (state === 'PENDING') {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2.5 text-sm text-muted">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-hold" />
          <span>{t('profile.kycPanel.underReview')}</span>
        </div>
        {submission?.created_at && (
          <div className="text-xs text-subtle">{t('profile.kycPanel.submittedOn', { date: fmtDate(submission.created_at) })}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state === 'REJECTED' && (
        <div className="rounded-xl border border-red/30 bg-red/5 p-3">
          <div className="mb-1 text-xs font-semibold text-red">{t('profile.kycPanel.rejectedTitle')}</div>
          <div className="text-xs leading-relaxed text-muted">
            {submission?.review_note || t('profile.kycPanel.rejectedNoReason')}
          </div>
        </div>
      )}

      {!open ? (
        <button onClick={() => setOpen(true)} className={btnGold}>
          {state === 'REJECTED' ? t('profile.identity.resubmit') : t('profile.identity.start')}
        </button>
      ) : (
        <div className="space-y-3">
          <PInput label={t('profile.kycPanel.fullName')} value={name} onChange={e => setName(e.target.value)}
            placeholder={t('profile.kycPanel.fullNamePlaceholder')} />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">{t('profile.kycPanel.docType')}</label>
            <select value={docType} onChange={e => setDoc(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand">
              {DOC_TYPES.map(d => <option key={d} value={d}>{t(`profile.kycPanel.doc.${d}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">{t('profile.kycPanel.document')}</label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-border bg-bg px-3.5 py-3 text-sm transition-colors hover:border-brand">
              <Upload className="h-4 w-4 shrink-0 text-subtle" />
              <span className={`truncate ${file ? 'text-fg' : 'text-subtle'}`}>
                {file ? file.name : t('profile.kycPanel.choose')}
              </span>
              <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={pickFile} className="hidden" />
            </label>
            <div className="mt-1.5 text-[11px] text-subtle">{t('profile.kycPanel.accepted', { mb: Math.round(MAX_DOC_BYTES / 1024 / 1024) })}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={submit} disabled={busy} className={`${btnGold} disabled:cursor-not-allowed disabled:opacity-60`}>
              {busy ? t('profile.kycPanel.submitting') : t('profile.kycPanel.submit')}
            </button>
            <button onClick={() => { setOpen(false); setFile(null); }}
              className="cursor-pointer border-none bg-transparent p-0 text-xs text-muted hover:text-fg">
              {t('profile.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const btnGold  = "cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-h";
const btnGhost = "cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-brand hover:text-brand-fg";

export function Profile() {
  const t = useT();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  // A KYC_HOLD order links straight here; honour the tab it asks for.
  const [tab, setTab]   = useState(() => window.history.state?.usr?.tab || 'profile');
  const [loading, setL] = useState(true);
  const [u, setU]       = useState(null);
  const [limits, setLim]= useState(null);
  const [kyc, setKyc]   = useState({ status: 'NONE', submission: null });
  const [bals, setBals] = useState([]);
  const [flash, setFlash] = useState(null);

  const [form, setForm] = useState({ name: '', phone: '' });
  const [link, setLink] = useState('');
  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const [pw, setPw]       = useState({ old_password: '', new_password: '', confirm: '' });
  const [em, setEm]       = useState({ email: '', password: '' });
  const [twoFA, setTwoFA] = useState(false);
  const [otp, setOtp]     = useState(null);
  const [delTxt, setDel]  = useState('');

  const toast = (type, text) => { setFlash({ type, text }); setTimeout(() => setFlash(null), 3500); };

  const load = async () => {
    setL(true);
    const [p, l, v, b, k] = await Promise.allSettled([
      api.profileGet(), api.profileLimits(), api.userVerificationGet(), api.walletsBalance(), api.kycStatus(),
    ]);
    if (p.status === 'fulfilled' && p.value?.success) {
      const usr = p.value.data.user || {};
      setU(usr);
      setForm({ name: usr.name || '', phone: usr.phone || '' });
      setLink(usr.partner_link || '');
      setTwoFA(!!usr.two_factor_enabled);
    }
    if (l.status === 'fulfilled' && l.value?.success) setLim(l.value.data.limits || null);
    if (b.status === 'fulfilled' && b.value?.success) setBals(b.value.data.balances || []);

    // KYC state has three possible sources and they can disagree. /user/profile/kyc/status
    // is authoritative; the limits payload carries the same field and is the next best
    // thing; the older /user/verification/* surface is the last resort so an already-
    // verified user is never shown as "not started" just because the new route 404s.
    const kycFromNew    = k.status === 'fulfilled' && k.value?.success ? k.value.data : null;
    const kycFromLimits = l.status === 'fulfilled' && l.value?.success ? l.value.data.limits?.kyc_status : null;
    const kycFromOld    = v.status === 'fulfilled' && v.value?.success ? (v.value.data.verifications || [])[0]?.status : null;
    setKyc({
      status: normKyc(kycFromNew?.kyc_status ?? kycFromLimits ?? kycFromOld ?? 'NONE'),
      submission: kycFromNew?.submission || null,
    });
    setL(false);
  };
  useEffect(() => { load(); }, []);

  const saveProfile = async () => {
    try {
      const r = await api.profileEditMain(form);
      if (link && link !== (u?.partner_link || '')) {
        const lr = await api.profileEditPartnerLink({ partner_link: link });
        if (!lr?.success) return toast('err', lr?.error?.message || t('profile.toast.partnerLinkNotSaved'));
      }
      r?.success ? toast('ok', t('profile.toast.profileSaved')) : toast('err', r?.error?.message || t('profile.toast.couldNotSave'));
    } catch { toast('err', t('profile.toast.couldNotSave')); }
  };
  const changePassword = async () => {
    if (pw.new_password !== pw.confirm) return toast('err', t('profile.toast.passwordsMismatch'));
    if (pw.new_password.length < 8)     return toast('err', t('profile.toast.passwordTooShort'));
    const r = await api.profileEditPassword({ old_password: pw.old_password, new_password: pw.new_password });
    if (r?.success) { toast('ok', t('profile.toast.passwordUpdated')); setPw({ old_password: '', new_password: '', confirm: '' }); }
    else toast('err', r?.error?.message || t('profile.toast.couldNotUpdatePassword'));
  };
  const changeEmail = async () => {
    const r = await api.profileEditEmail(em);
    if (r?.success) { toast('ok', r.data?.message || t('profile.toast.confirmationSent')); setEm({ email: '', password: '' }); load(); }
    else toast('err', r?.error?.message || t('profile.toast.couldNotChangeEmail'));
  };
  const enable2FA = async () => {
    const r = await api.otpCreate();
    if (r?.success) setOtp({ secret: r.data.secret, uri: r.data.qr_url, code: '' });
    else toast('err', r?.error?.message || t('profile.toast.couldNotStart2fa'));
  };
  const confirm2FA = async () => {
    const r = await api.otpConfirm({ code: otp?.code || '' });
    if (r?.success) { setTwoFA(true); setOtp(null); toast('ok', t('profile.toast.twoFaEnabled')); }
    else toast('err', r?.error?.message || t('profile.toast.invalidCode'));
  };
  const disable2FA = async () => {
    const r = await api.otpDelete();
    if (r?.success) { setTwoFA(false); toast('ok', t('profile.toast.twoFaDisabled')); } else toast('err', t('profile.toast.couldNotDisable2fa'));
  };
  const signOut = async () => { try { await logout(); } finally { navigate('/login'); } };
  const blockAccount = async () => {
    if (!window.confirm(t('profile.confirm.freeze'))) return;
    const r = await api.profileBlock();
    if (r?.success) signOut(); else toast('err', t('profile.toast.couldNotFreeze'));
  };
  const deleteAccount = async () => {
    if (delTxt !== 'DELETE') return toast('err', t('profile.toast.typeDeleteToConfirm'));
    const r = await api.profileDelete();
    if (r?.success) signOut(); else toast('err', t('profile.toast.couldNotDelete'));
  };
  const copy = txt => { try { navigator.clipboard.writeText(txt); toast('ok', t('profile.toast.copied')); } catch {} };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">{t('profile.loading')}</div>;

  const display = u || authUser || {};
  const kycState = kyc.status;
  const kycLabel = t(`profile.kyc.${{ NONE:'notStarted', PENDING:'pending', APPROVED:'approved', REJECTED:'rejected' }[kycState]}`);

  const TABS = [['profile',t('profile.tabs.profile')], ['security',t('profile.tabs.security')], ['verification',t('profile.tabs.verification')], ['wallets',t('profile.tabs.wallets')], ['danger',t('profile.tabs.danger')]];

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <Reveal variant="fadeUp">
        <div className="border-b border-border py-8">
          <h1 className="text-3xl font-light tracking-tight text-fg">{t('profile.title')}</h1>
          <p className="mt-1.5 text-sm text-muted">{t('profile.subtitle')}</p>
        </div>
      </Reveal>

      <div className="pt-8 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-6">

        {/* ── LEFT: identity + nav ── */}
        <div className="mb-4 space-y-3 lg:sticky lg:top-28 lg:mb-0">
          <div className="rounded-2xl border border-border bg-bg2 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-h))' }}>
                {initialsOf(display.name, display.email)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-tight text-fg">{display.name || t('profile.yourAccount')}</div>
                <div className="truncate text-xs text-muted">{display.email}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-subtle">{t('profile.memberSince', { date: fmtDate(display.created_at) })}</div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <PChip ok={!!display.email_verified} warn={!display.email_verified} label={display.email_verified ? t('profile.chip.verified') : t('profile.chip.unverified')} />
              <PChip ok={twoFA} warn={!twoFA} label={twoFA ? t('profile.chip.twoFaOn') : t('profile.chip.twoFaOff')} />
              {display.is_blocked && <PChip warn label={t('profile.chip.frozen')} />}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-bg2 p-1 lg:flex-col">
            {TABS.map(([k, lbl]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-left text-sm font-medium transition-colors lg:w-full
                  ${tab === k ? (k === 'danger' ? 'bg-red text-white' : 'bg-brand text-white') : 'text-muted hover:bg-bg3 hover:text-fg'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: content ── */}
        <div className="min-w-0">
          {flash && (
            <div className={`mb-4 rounded-xl border px-4 py-2.5 text-sm
              ${flash.type === 'ok' ? 'border-green/20 bg-green/10 text-green' : 'border-red/20 bg-red/10 text-red'}`}>
              {flash.text}
            </div>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <RevealGroup className="grid grid-cols-3 gap-3">
                <RevealItem variant="scaleIn"><PStat label={t('profile.stat.verification')} value={kycLabel} tone={kycState === 'APPROVED' ? 'text-green' : kycState === 'REJECTED' ? 'text-red' : 'text-brand-fg'} /></RevealItem>
                <RevealItem variant="scaleIn"><PStat label={t('profile.stat.twoFa')} value={twoFA ? t('profile.on') : t('profile.off')} tone={twoFA ? 'text-green' : 'text-muted'} /></RevealItem>
                <RevealItem variant="scaleIn"><PStat label={t('profile.stat.wallets')} value={<CountUp value={bals.length} />} /></RevealItem>
              </RevealGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <PCard title={t('profile.personal.title')}>
                  <div className="space-y-3">
                    <PInput label={t('profile.personal.fullName')} value={form.name} onChange={setF('name')} placeholder={t('profile.personal.fullNamePlaceholder')} />
                    <PInput label={t('profile.personal.phone')} value={form.phone} onChange={setF('phone')} placeholder="+254 7XX XXX XXX" />
                    <button onClick={saveProfile} className={btnGold}>{t('profile.personal.save')}</button>
                  </div>
                </PCard>
                <PCard title={t('profile.limits.title')}>
                  {limits ? (
                    <div className="space-y-4">
                      <PBar label={t('profile.limits.daily')}   cur={limits.current_daily}   max={limits.daily_limit}   suffix=" USD" />
                      <PBar label={t('profile.limits.monthly')} cur={limits.current_monthly} max={limits.monthly_limit} suffix=" USD" />
                      {limits.kyc_required_at && (
                        <div className="text-xs text-muted">{t('profile.limits.kycRequired', { amount: Number(limits.kyc_required_at).toLocaleString() })}</div>
                      )}
                      {/* Now that 30-day volume is real, warn before an order gets held
                          rather than after. */}
                      {kycState !== 'APPROVED' && Number(limits.current_monthly || 0) >= Number(limits.kyc_required_at || Infinity) && (
                        <div className="rounded-xl border border-hold/30 bg-hold/5 p-3">
                          <div className="mb-2 text-xs leading-relaxed text-muted">
                            {kycState === 'PENDING' ? t('profile.limits.thresholdPending') : t('profile.limits.thresholdReached')}
                          </div>
                          {kycState !== 'PENDING' && (
                            <button onClick={() => setTab('verification')}
                              className="cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-brand-fg hover:underline">
                              {t('profile.limits.verifyNow')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : <div className="text-sm text-muted">{t('profile.limits.unavailable')}</div>}
                </PCard>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PCard title={t('profile.password.title')}>
                  <div className="space-y-3">
                    <PInput label={t('profile.password.current')} type="password" value={pw.old_password} onChange={e => setPw(p => ({ ...p, old_password: e.target.value }))} />
                    <PInput label={t('profile.password.new')} type="password" value={pw.new_password} onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} />
                    <PInput label={t('profile.password.confirm')} type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                    <button onClick={changePassword} className={btnGold}>{t('profile.password.update')}</button>
                  </div>
                </PCard>
                <PCard title={t('profile.email.title')}>
                  {display.pending_email && <div className="mb-3 text-xs text-brand-fg">{t('profile.email.pending', { email: display.pending_email })}</div>}
                  <div className="space-y-3">
                    <PInput label={t('profile.email.new')} type="email" value={em.email} onChange={e => setEm(s => ({ ...s, email: e.target.value }))} placeholder="new@email.com" />
                    <PInput label={t('profile.password.current')} type="password" value={em.password} onChange={e => setEm(s => ({ ...s, password: e.target.value }))} />
                    <button onClick={changeEmail} className={btnGhost}>{t('profile.email.send')}</button>
                  </div>
                </PCard>
              </div>

              <PCard title={t('profile.twoFa.title')}
                desc={t('profile.twoFa.desc')}
                action={<PChip ok={twoFA} warn={!twoFA} label={twoFA ? t('profile.twoFa.enabled') : t('profile.twoFa.disabled')} />}>
                {!twoFA && !otp && <button onClick={enable2FA} className={btnGold}>{t('profile.twoFa.enable')}</button>}
                {!twoFA && otp && (
                  <div className="max-w-md space-y-3">
                    <div className="text-xs text-muted">{t('profile.twoFa.addSecret')}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all rounded-lg border border-border bg-bg px-3 py-2 text-xs text-brand-fg">{otp.secret}</code>
                      <button onClick={() => copy(otp.secret)} className="cursor-pointer rounded-lg border border-border px-2.5 py-2 text-xs text-muted hover:text-fg">{t('profile.copy')}</button>
                    </div>
                    <div className="flex gap-2">
                      <input value={otp.code} onChange={e => setOtp(o => ({ ...o, code: e.target.value }))} placeholder={t('profile.twoFa.codePlaceholder')} inputMode="numeric"
                        className="flex-1 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm tracking-widest text-fg outline-none focus:border-brand" />
                      <button onClick={confirm2FA} className={btnGold}>{t('profile.twoFa.verify')}</button>
                    </div>
                    <button onClick={() => setOtp(null)} className="cursor-pointer border-none bg-transparent p-0 text-xs text-muted hover:text-fg">{t('profile.cancel')}</button>
                  </div>
                )}
                {twoFA && <button onClick={disable2FA} className="cursor-pointer rounded-xl border border-red/40 px-4 py-2.5 text-sm font-medium text-red transition-colors hover:bg-red/10">{t('profile.twoFa.disable')}</button>}
              </PCard>
            </div>
          )}

          {/* VERIFICATION */}
          {tab === 'verification' && (
            <div className="grid gap-4 md:grid-cols-2">
              <PCard title={t('profile.identity.title')}
                action={<PChip ok={kycState === 'APPROVED'} warn={kycState === 'PENDING' || kycState === 'NONE'} label={kycLabel} />}
                desc={t('profile.identity.desc')}>
                <KycPanel state={kycState} submission={kyc.submission} onSubmitted={load} toast={toast} />
              </PCard>
              <PCard title={t('profile.emailCard.title')}
                action={<PChip ok={!!display.email_verified} warn={!display.email_verified} label={display.email_verified ? t('profile.chip.verified') : t('profile.chip.unverified')} />}
                desc={display.email_verified ? t('profile.emailCard.confirmed', { date: fmtDate(display.email_verified_at) }) : t('profile.emailCard.checkInbox')} />
            </div>
          )}

          {/* WALLETS */}
          {tab === 'wallets' && (
            <div>
              {bals.length === 0 ? (
                <PCard title={t('profile.wallets.title')} desc={t('profile.wallets.empty')}>
                  <button onClick={() => navigate('/about')} className={btnGold}>{t('profile.wallets.start')}</button>
                </PCard>
              ) : (
                <RevealGroup className="grid gap-4 sm:grid-cols-2">
                  {bals.map((b, i) => (
                    <RevealItem key={i} variant="scaleIn">
                    <PCard>
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-fg">{b.currency} <span className="text-xs font-normal text-muted">{b.name}</span></div>
                          {b.network && <div className="text-[10px] text-subtle">{b.network}</div>}
                        </div>
                        <div className="text-base font-semibold text-brand-fg"><CountUp value={Number(b.balance)} decimals={(String(b.balance).split('.')[1] || '').length} /></div>
                      </div>
                      {b.address && (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 break-all rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[10px] text-muted">{b.address}</code>
                          <button onClick={() => copy(b.address)} className="cursor-pointer rounded-lg border border-border px-2.5 py-1.5 text-[10px] text-muted hover:text-fg">{t('profile.copy')}</button>
                        </div>
                      )}
                    </PCard>
                    </RevealItem>
                  ))}
                </RevealGroup>
              )}
            </div>
          )}

          {/* DANGER */}
          {tab === 'danger' && (
            <div className="grid gap-4 md:grid-cols-2">
              <PCard danger title={t('profile.freeze.title')} desc={t('profile.freeze.desc')}>
                <button onClick={blockAccount} className="cursor-pointer rounded-xl border border-red/40 px-4 py-2.5 text-sm font-medium text-red transition-colors hover:bg-red/10">{t('profile.freeze.button')}</button>
              </PCard>
              <PCard danger title={t('profile.delete.title')} desc={t('profile.delete.desc')}>
                <div className="space-y-3">
                  <PInput label={t('profile.delete.confirmLabel')} value={delTxt} onChange={e => setDel(e.target.value)} placeholder="DELETE" />
                  <button onClick={deleteAccount} disabled={delTxt !== 'DELETE'}
                    className="cursor-pointer rounded-xl bg-red px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">{t('profile.delete.button')}</button>
                </div>
              </PCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AFFILIATE ──
export function Affiliate() {
  const t = useT();
  const [stats, setStats]     = useState(null);
  const [today, setToday]     = useState(null);
  const [balance, setBalance] = useState([]);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.affiliateBasic().then(r=>{ if(r.success) setStats(r.data.affiliate); });
    api.affiliateToday().then(r=>{ if(r.success) setToday(r.data.today); });
    api.walletsBalance().then(r=>{ if(r.success) setBalance(r.data.balances||[]); });
  }, []);

  const partnerUrl = `${window.location.origin}?ref=${stats?.partner_link||'yourlink'}`;
  const copyLink = () => { navigator.clipboard.writeText(partnerUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const supportStats = [
    [t('affiliate.stats.referrals'), <CountUp value={stats?.total_referrals ?? 0} />],
    [t('affiliate.stats.today'), <CountUp value={Number(today?.earned || 0)} decimals={2} />],
    [t('affiliate.stats.pending'), <CountUp value={Number(stats?.pending_earned || 0)} decimals={2} />],
  ];

  const STEPS = [
    [Share2, t('affiliate.steps.share.title'), t('affiliate.steps.share.desc')],
    [Repeat, t('affiliate.steps.exchange.title'), t('affiliate.steps.exchange.desc')],
    [Wallet, t('affiliate.steps.earn.title'), t('affiliate.steps.earn.desc')],
  ];

  return (
    <div className="mx-auto max-w-content px-6 pb-16">
      {/* ── EARNINGS HERO ── */}
      <section className="relative overflow-hidden">
        <RingAccent className="pointer-events-none absolute -right-24 -top-24 hidden h-[440px] w-[440px] opacity-50 lg:block" />
        <div className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-16">
          <div>
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-brand-fg">{t('affiliate.program')}</div>
            <Reveal variant="fadeUp">
              <h1 className="text-balance text-4xl font-light leading-[1.05] tracking-tight text-fg md:text-5xl lg:text-6xl">
                {t('affiliate.hero.pre')} <span className="text-brand-fg">0.3%</span> {t('affiliate.hero.post')}
              </h1>
            </Reveal>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              {t('affiliate.hero.desc')}
            </p>

            <div className="mt-8">
              <div className="mb-2 text-sm font-medium text-fg">{t('affiliate.referralLink')}</div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg2 p-1.5 pl-4">
                <span className="flex-1 truncate font-mono text-sm text-brand-fg">{partnerUrl}</span>
                <Button size="md" onClick={copyLink} className="shrink-0">
                  {copied ? <><Check className="h-4 w-4" /> {t('affiliate.copied')}</> : <><Copy className="h-4 w-4" /> {t('affiliate.copy')}</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Earnings summary card */}
          <Reveal variant="scaleIn" className="self-start">
          <div className="self-start rounded-2xl border border-border bg-bg2 p-6 md:p-7">
            <div className="text-sm text-subtle">{t('affiliate.totalEarned')}</div>
            <div className="mt-1 text-4xl font-light tabular-nums text-fg md:text-5xl">
              <CountUp value={Number(stats?.total_earned || 0)} decimals={2} /> <span className="text-xl text-muted">USDT</span>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {supportStats.map(([label, val]) => (
                <div key={label}>
                  <div className="text-lg font-light tabular-nums text-brand-fg">{val}</div>
                  <div className="mt-1 text-xs text-subtle">{label}</div>
                </div>
              ))}
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-border">
        <div className="py-14 lg:py-16">
          <SectionLabel n="01">{t('affiliate.howItWorks')}</SectionLabel>
          <Reveal variant="fadeUp">
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-border md:block" aria-hidden="true" />
            {STEPS.map(([Icon, title, desc], i) => (
              <li key={title} className="relative">
                <div className="mb-5 flex items-center gap-3">
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-bg2 text-brand-fg">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-sm tabular-nums text-subtle">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mb-2 text-lg font-normal text-fg">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{desc}</p>
              </li>
            ))}
          </ol>
          </Reveal>
        </div>
      </section>

      {/* ── WALLET + PAYOUT ── */}
      <section className="border-t border-border">
        <div className="grid gap-10 py-14 md:grid-cols-2 md:gap-16 lg:py-16">
          <div>
            <SectionLabel n="02">{t('affiliate.yourBalances')}</SectionLabel>
            {balance.length > 0 ? (
              <Reveal variant="fadeUp" className="divide-y divide-border rounded-2xl border border-border bg-bg2">
                {balance.map((b, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-medium text-fg">{b.currency}</div>
                      {b.network && <div className="text-xs text-subtle">{b.network}</div>}
                    </div>
                    <div className="text-lg font-light tabular-nums text-brand-fg"><CountUp value={Number(b.balance)} decimals={(String(b.balance).split('.')[1] || '').length} /></div>
                  </div>
                ))}
              </Reveal>
            ) : (
              <div className="rounded-2xl border border-border bg-bg2 p-8 text-center text-sm text-muted">
                {t('affiliate.balancesEmpty')}
              </div>
            )}
          </div>

          <div>
            <SectionLabel n="03">{t('affiliate.payoutTerms')}</SectionLabel>
            <div className="space-y-4 text-sm leading-relaxed text-muted">
              <p><span className="font-medium text-fg">{t('affiliate.terms.perExchange.head')}</span> {t('affiliate.terms.perExchange.body')}</p>
              <p><span className="font-medium text-fg">{t('affiliate.terms.onCompletion.head')}</span> {t('affiliate.terms.onCompletion.body')}</p>
              <p><span className="font-medium text-fg">{t('affiliate.terms.minimum.head')}</span> {t('affiliate.terms.minimum.body')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
