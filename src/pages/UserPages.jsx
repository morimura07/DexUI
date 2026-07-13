import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// DB sends timestamps as "YYYY-MM-DD HH:MM:SS" (space, no TZ). Browsers may parse that
// as an Invalid Date, which caused orders to show "Expired" instantly. Normalise to ISO.
const parseTs = d => new Date(String(d || '').replace(' ', 'T'));

const badgeClass = s => ({
  WAIT_PAYMENT:'bg-yellow/10 text-yellow', PAYMENT_RECEIVED:'bg-blue-500/10 text-blue-400',
  UNDER_REVIEW:'bg-blue-500/10 text-blue-400',
  PROCESSING:'bg-blue-500/10 text-blue-400', COMPLETED:'bg-green/10 text-green',
  EXPIRED:'bg-red/10 text-red', CANCELLED:'bg-red/10 text-red',
  AML_HOLD:'bg-orange-500/10 text-orange-400', REFUNDED:'bg-bg3 text-muted',
}[s]||'bg-bg3 text-muted');

const Badge = ({status}) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeClass(status)}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />{status?.replace(/_/g,' ')}
  </span>
);

// ── ORDER PAGE ──
export function OrderPage() {
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
      if (res.success) {
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
    <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm">
      <div className="text-center">
        <div className="text-2xl animate-pulse mb-3">⏳</div>
        Loading order…
      </div>
    </div>
  );
  if (!loading && !order && !prefill) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm">
      Order not found. <Link to="/about" className="text-yellow ml-1">Create new order</Link>
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

  const TELEGRAM_URL = 'https://t.me/SwiftSwapSupport';

  const Row = ({k,v,mono=false}) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-[11.5px] text-muted shrink-0">{k}</span>
      <span className={`text-[13px] font-semibold text-right ${mono?'font-mono text-[11px] break-all':''}`}>{v}</span>
    </div>
  );

  return (
    <div className="px-4 md:px-6 py-6 lg:pr-[400px]">
     <div className="max-w-4xl mx-auto">

      <div className="text-center mb-4">
        {order?.status === 'WAIT_PAYMENT' && <h1 className="text-[22px] font-extrabold">Exchange <span className="text-yellow">waiting for payment</span></h1>}
        {['PAYMENT_RECEIVED','UNDER_REVIEW'].includes(order?.status||'') && <h1 className="text-[22px] font-extrabold">Exchange <span className="text-blue-400">under review</span></h1>}
        {order?.status === 'PROCESSING' && <h1 className="text-[22px] font-extrabold">Exchange <span className="text-blue-400">processing</span></h1>}
        {order?.status === 'COMPLETED' && <h1 className="text-[22px] font-extrabold">Exchange <span className="text-green">completed</span></h1>}
        {['EXPIRED','CANCELLED'].includes(order?.status||'') && <h1 className="text-[22px] font-extrabold">Exchange <span className="text-red">{order?.status?.toLowerCase()}</span></h1>}
        {!order && <h1 className="text-[22px] font-extrabold">Exchange <span className="text-yellow">new</span></h1>}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">

        {/* LEFT — Transfer details */}
        <div className="bg-bg2 border border-border rounded-xl p-4">
          <div className="text-[12px] font-bold mb-3 text-muted">Transfer details</div>
          <div className="flex flex-col gap-2 text-[11.5px]">
            <div><div className="text-muted text-[10px]">ID:</div><div className="font-bold text-yellow">{orderId}</div></div>
            <div className="h-px bg-border"/>
            {rateVal && <div><div className="text-muted text-[10px]">Rate:</div><div className="font-semibold text-green">{rateVal}</div></div>}
            <div className="h-px bg-border"/>
            <div>
              <div className="text-muted text-[10px]">You send, {fromName}:</div>
              <div className="font-bold text-white">{parseFloat(giveAmt||0).toFixed(2)} {fromSymbol}</div>
            </div>
            <div>
              <div className="text-muted text-[10px]">You receive, {toName}:</div>
              <div className="font-bold text-green">{parseFloat(takeAmt||0).toFixed(2)} {toSymbol}</div>
            </div>
            <div className="h-px bg-border"/>
            <div>
              <div className="text-muted text-[10px]">{toName} address:</div>
              <div className="font-mono text-[10px] break-all text-muted">{destAddr}</div>
            </div>
            <div>
              <div className="text-muted text-[10px]">E-mail:</div>
              <div className="text-[11px] text-muted">{emailVal}</div>
            </div>
            {order?.expires_at && order?.status === 'WAIT_PAYMENT' && (
              <>
                <div className="h-px bg-border"/>
                <div className="flex items-center justify-between">
                  <div className="text-muted text-[10px]">Actual until:</div>
                  <div className="text-[10px] text-white">{parseTs(order.expires_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-muted text-[10px]">Time left:</div>
                  <div className={`text-[20px] font-extrabold tabular-nums ${timeLeft !== null && timeLeft < 300 ? 'text-red' : 'text-yellow'}`}>{fmt(timeLeft)}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Payment action area */}
        <div className="bg-bg2 border border-border rounded-xl p-4">

          {/* ───────── WAIT_PAYMENT ───────── */}
          {order?.status === 'WAIT_PAYMENT' && isFiat && (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">💬</div>
              <div className="text-[16px] font-bold mb-2">Complete your payment in the live chat</div>
              <p className="text-muted text-[12.5px] mb-5 leading-relaxed">
                For bank &amp; card transfers, our operator shares the payment details privately in the chat.
                Pay there, then tap <strong className="text-yellow">“I have paid”</strong> in the chat to confirm.
              </p>
              <button onClick={openChat}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow text-black font-extrabold rounded-xl hover:bg-yellow-d transition-colors text-[14px] cursor-pointer border-none">
                💬 Open payment chat
              </button>
              <p className="text-[10px] text-muted mt-3">Order ID: <span className="text-yellow font-semibold">{orderId}</span> · payment details never appear on this page</p>
              <button onClick={handleCancel}
                className="block mx-auto mt-5 px-5 py-2 border border-border text-muted text-[12px] rounded-lg hover:border-red hover:text-red transition-colors cursor-pointer bg-transparent">
                Cancel order
              </button>
            </div>
          )}

          {/* Crypto — step 1: confirm details */}
          {order?.status === 'WAIT_PAYMENT' && !isFiat && !revealPay && (
            <>
              <div className="text-[13px] font-bold mb-3">Check and confirm your payment data:</div>
              <div className="mb-2">
                <div className="text-[10px] text-muted mb-1">You receive:</div>
                <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-green/20 flex items-center justify-center text-green text-[9px] font-bold shrink-0">{toSymbol?.substring(0,2)}</div>
                  <span className="text-muted text-[12px]">{toName}</span>
                  <span className="ml-auto font-bold text-[13px]">{parseFloat(takeAmt||0).toFixed(2)} {toSymbol}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="text-[10px] text-muted mb-1">{toName} address:</div>
                <div className="bg-bg border border-border rounded-lg px-3 py-2 font-mono text-[10px] text-muted break-all">{destAddr}</div>
              </div>
              <div className="mb-4">
                <div className="text-[10px] text-muted mb-1">E-mail:</div>
                <div className="bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white">{emailVal}</div>
              </div>
              <button onClick={()=>setRevealPay(true)}
                className="w-full py-3 bg-yellow text-black font-extrabold text-[14px] rounded-lg hover:bg-yellow-d transition-colors cursor-pointer mb-2">
                Continue to payment →
              </button>
              <button onClick={handleCancel}
                className="w-full py-2 border border-border text-muted text-[12px] rounded-lg hover:border-red hover:text-red transition-colors cursor-pointer bg-transparent">
                Cancel
              </button>
            </>
          )}

          {/* Crypto — step 2: send funds, then mark as paid */}
          {order?.status === 'WAIT_PAYMENT' && !isFiat && revealPay && (
            <div className="text-center">
              <div className="text-[14px] font-bold mb-1">Send your payment to complete the order</div>
              <p className="text-[11px] text-muted mb-4">Transfer the exact amount to the address below, then mark it as paid.</p>
              <div className="flex justify-center mb-4">
                <div className="w-36 h-36 bg-white rounded-xl p-1 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(payAddress || '')}&bgcolor=ffffff&color=000000&margin=2`}
                    alt="Payment QR Code"
                    className="w-full h-full rounded-lg"
                    onError={e => e.target.style.display='none'}
                  />
                </div>
              </div>
              <div className="mb-3 text-left">
                <div className="text-[11px] text-muted mb-1.5">Amount to send:</div>
                <div className="bg-bg border border-border rounded-xl px-4 py-3 font-bold text-[13px]">{parseFloat(giveAmt||0).toFixed(2)} {fromSymbol}</div>
              </div>
              <div className="mb-4 text-left">
                <div className="text-[11px] text-muted mb-1.5">To this {fromSymbol} address:</div>
                <div className="flex items-center gap-2 bg-bg border border-yellow/30 rounded-xl px-4 py-3">
                  <span className="font-mono text-[11px] text-yellow flex-1 break-all">{payAddress && payAddress !== 'PENDING_OPERATOR_ASSIGNMENT' ? payAddress : 'Address being assigned — please contact support'}</span>
                  {payAddress && payAddress !== 'PENDING_OPERATOR_ASSIGNMENT' && (
                    <button onClick={()=>copy(payAddress, setCopied)}
                      className="px-2.5 py-1 text-[11px] bg-bg3 border border-border rounded-lg hover:border-yellow hover:text-yellow transition-colors cursor-pointer shrink-0">
                      {copied?'✓':'Copy'}
                    </button>
                  )}
                </div>
              </div>
              <button onClick={handlePaid} disabled={marking}
                className="w-full py-3 bg-yellow text-black font-extrabold text-[14px] rounded-lg hover:bg-yellow-d transition-colors cursor-pointer mb-2 disabled:opacity-50">
                {marking ? 'Submitting…' : '✓ I have paid'}
              </button>
              <button onClick={()=>setRevealPay(false)}
                className="w-full py-2 border border-border text-muted text-[12px] rounded-lg hover:border-yellow hover:text-yellow transition-colors cursor-pointer bg-transparent">
                ← Back
              </button>
            </div>
          )}

          {/* ───────── UNDER_REVIEW (paid, awaiting admin confirmation) ───────── */}
          {['UNDER_REVIEW','PAYMENT_RECEIVED'].includes(order?.status||'') && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔎</div>
              <div className="text-[16px] font-bold mb-2 text-blue-400">Payment received — under review</div>
              <p className="text-muted text-[12.5px] mb-5 leading-relaxed max-w-sm mx-auto">
                Thanks! We’ve been notified that you paid. Our team is verifying the funds, and your
                <strong className="text-white"> {parseFloat(takeAmt||0).toFixed(2)} {toSymbol}</strong> will be released to your wallet once confirmed.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Awaiting confirmation from our team
              </div>
              <p className="text-[10px] text-muted mt-4">Order ID: <span className="text-yellow font-semibold">{orderId}</span></p>
            </div>
          )}

          {/* WAIT_PAYMENT — after clicking Pay, show payment destination */}
          {order?.status === 'PROCESSING' && (
            <div className="text-center py-8">
              <div className="text-3xl animate-spin mb-4">⏳</div>
              <div className="text-[16px] font-bold mb-2">Processing your exchange</div>
              <p className="text-muted text-[12.5px]">We are sending {parseFloat(takeAmt||0).toFixed(2)} {toSymbol} to your wallet. This may take a few minutes.</p>
            </div>
          )}

          {order?.status === 'COMPLETED' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <div className="text-[18px] font-extrabold text-green mb-2">Exchange Completed!</div>
              <p className="text-muted text-[12.5px] mb-5">{parseFloat(takeAmt||0).toFixed(2)} {toSymbol} has been sent to your wallet.</p>
              <button onClick={()=>navigate('/about')} className="px-6 py-2.5 bg-yellow text-black font-bold rounded-lg hover:bg-yellow-d cursor-pointer">
                New Exchange
              </button>
            </div>
          )}

          {/* EXPIRED/CANCELLED — hide all payment details */}
          {['EXPIRED','CANCELLED'].includes(order?.status||'') && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">{order?.status === 'EXPIRED' ? '⏰' : '❌'}</div>
              <div className="text-[18px] font-bold text-red mb-3">
                Order {order?.status === 'EXPIRED' ? 'Expired' : 'Cancelled'}
              </div>
              <p className="text-muted text-[12.5px] mb-6 leading-relaxed">
                {order?.status === 'EXPIRED'
                  ? 'The payment window has closed. No funds were transferred.'
                  : 'This order has been cancelled. No funds were transferred.'}
              </p>
              <button onClick={()=>navigate('/about')}
                className="px-6 py-3 bg-yellow text-black font-bold rounded-xl hover:bg-yellow-d cursor-pointer text-[13px]">
                Create New Order
              </button>
            </div>
          )}

          {!order && prefill && (
            <div className="text-center py-8 text-muted animate-pulse text-sm">Loading order details…</div>
          )}
        </div>
      </div>
     </div>
    </div>
  );
}

// ── MY ORDERS ──
export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab]       = useState('CURRENT');
  const [loading, setLoad]  = useState(true);
  const navigate            = useNavigate();

  useEffect(() => {
    api.myOrders().then(res => { if (res.success) setOrders(res.data.orders||[]); setLoad(false); });
  }, []);

  const TABS = [
    { key:'CURRENT',   label:'🔄 Current',   statuses:['WAIT_PAYMENT','PAYMENT_RECEIVED','UNDER_REVIEW','PROCESSING','AML_HOLD'] },
    { key:'COMPLETED', label:'✅ Completed',  statuses:['COMPLETED'] },
    { key:'CANCELLED', label:'❌ Cancelled',  statuses:['CANCELLED','EXPIRED','REFUNDED'] },
    { key:'ALL',       label:'📋 All Orders', statuses:null },
  ];

  const currentTab = TABS.find(t=>t.key===tab);
  const filtered   = currentTab.statuses
    ? orders.filter(o => currentTab.statuses.includes(o.status))
    : orders;

  const counts = {};
  TABS.forEach(t => {
    counts[t.key] = t.statuses ? orders.filter(o=>t.statuses.includes(o.status)).length : orders.length;
  });

  return (
    <div className="flex flex-col px-4 md:px-8 pt-6" style={{ height: 'calc(100dvh - 56px)' }}>

      {/* Fixed header — stays put while orders scroll */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[17px] font-extrabold">My Orders</h2>
          <button onClick={()=>navigate('/about')}
            className="px-3.5 py-1.5 bg-yellow text-black text-[11.5px] font-bold rounded-lg hover:bg-yellow-d transition-colors cursor-pointer">
            + New Exchange
          </button>
        </div>

        <div className="flex border-b border-border overflow-x-auto gap-1">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-3.5 py-2 text-[11.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-all cursor-pointer bg-transparent flex items-center gap-1.5
                ${tab===t.key?'text-yellow border-yellow':'text-muted border-transparent hover:text-white'}`}>
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold
                  ${tab===t.key?'bg-yellow/20 text-yellow':'bg-bg3 text-muted'}`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable orders panel */}
      <div className="orders-scroll flex-1 min-h-0 overflow-y-auto py-3.5 pr-1.5">
        {loading ? (
          <div className="text-center py-14 text-muted text-sm animate-pulse">Loading your orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-3xl mb-3 opacity-40">
              {tab==='CURRENT'?'🔄':tab==='COMPLETED'?'✅':'📋'}
            </div>
            <div className="text-muted text-[13px]">No {tab.toLowerCase()} orders yet</div>
            {tab === 'CURRENT' && (
              <button onClick={()=>navigate('/about')}
                className="mt-4 px-5 py-2 bg-yellow text-black text-[12px] font-bold rounded-lg cursor-pointer hover:bg-yellow-d transition-colors">
                Start an Exchange
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((o,i) => {
              const isActive   = ['WAIT_PAYMENT','PAYMENT_RECEIVED','UNDER_REVIEW','PROCESSING','AML_HOLD'].includes(o.status);
              const isComplete = o.status === 'COMPLETED';
              return (
                <div key={i} onClick={()=>navigate(`/order/${o.order_id||o.id}`)}
                  className={`bg-bg2 border rounded-lg px-3.5 py-2.5 cursor-pointer hover:border-yellow/50 transition-all group
                    ${isActive?'border-yellow/30':isComplete?'border-green/20':'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow font-bold text-[11.5px]">#{o.id||o.order_id}</span>
                      <Badge status={o.status} />
                    </div>
                    <span className="text-[10px] text-muted">{new Date(o.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-[9.5px] text-muted mb-0.5 uppercase tracking-wide">You Send</div>
                      <div className="font-bold text-[13px] text-white leading-none">
                        {parseFloat(o.from?.amount || o.from_amount || 0).toFixed(2)} <span className="text-[10px] text-muted font-normal">{o.from?.symbol || o.from_symbol || '—'}</span>
                      </div>
                    </div>
                    <div className="text-muted text-[13px]">→</div>
                    <div className="min-w-0">
                      <div className="text-[9.5px] text-muted mb-0.5 uppercase tracking-wide">You Receive</div>
                      <div className={`font-bold text-[13px] leading-none ${isComplete?'text-green':'text-white'}`}>
                        {parseFloat(o.to?.amount || o.to_amount || 0).toFixed(2)} <span className="text-[10px] text-muted font-normal">{o.to?.symbol || o.to_symbol || '—'}</span>
                      </div>
                    </div>
                    {o.status === 'WAIT_PAYMENT' && o.expires_at && (
                      <div className="ml-auto text-right">
                        <div className="text-[9px] text-muted mb-0.5 uppercase tracking-wide">Expires</div>
                        <div className={`text-[11.5px] font-bold ${parseTs(o.expires_at) > new Date() ? 'text-yellow' : 'text-red'}`}>
                          {parseTs(o.expires_at) > new Date()
                            ? `${Math.max(0,Math.floor((parseTs(o.expires_at)-Date.now())/60000))}m left`
                            : 'Expired'}
                        </div>
                      </div>
                    )}
                    {['UNDER_REVIEW','PAYMENT_RECEIVED','PROCESSING'].includes(o.status) && (
                      <div className="ml-auto text-right">
                        <div className="text-[9px] text-muted mb-0.5 uppercase tracking-wide">Status</div>
                        <div className="text-[11.5px] font-bold text-blue-400">Under review</div>
                      </div>
                    )}
                    <div className={`text-muted group-hover:text-yellow transition-colors text-sm ${(o.status==='WAIT_PAYMENT'&&o.expires_at)||['UNDER_REVIEW','PAYMENT_RECEIVED','PROCESSING'].includes(o.status)?'':'ml-auto'}`}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .orders-scroll { scrollbar-width: thin; scrollbar-color: #2B3139 transparent; }
        .orders-scroll::-webkit-scrollbar { width: 8px; }
        .orders-scroll::-webkit-scrollbar-track { background: transparent; }
        .orders-scroll::-webkit-scrollbar-thumb { background: #2B3139; border-radius: 8px; }
        .orders-scroll::-webkit-scrollbar-thumb:hover { background: #F0B90B; }
      `}</style>
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
    {label && <label className="text-[10px] text-muted font-medium block mb-1">{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-white text-[12px] outline-none placeholder-muted focus:border-yellow transition-colors" />
  </div>
);
const PCard = ({ title, desc, children, danger, action, className = '' }) => (
  <div className={`bg-bg2 border rounded-xl p-4 ${danger ? 'border-red/30' : 'border-border'} ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-3">
        {title && <div className={`font-semibold text-[12.5px] ${danger ? 'text-red' : ''}`}>{title}</div>}
        {action}
      </div>
    )}
    {desc && <div className="text-[10.5px] text-muted mb-3 leading-snug">{desc}</div>}
    {children}
  </div>
);
const PChip = ({ ok, warn, label }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border
    ${ok ? 'bg-green/10 text-green border-green/20' : warn ? 'bg-yellow/10 text-yellow border-yellow/20' : 'bg-bg3 text-muted border-border'}`}>
    <span className="w-1 h-1 rounded-full bg-current" />{label}
  </span>
);
const PBar = ({ label, cur, max, suffix = '' }) => (
  <div>
    <div className="flex justify-between text-[10.5px] mb-1">
      <span className="text-muted">{label}</span>
      <span className="text-white font-medium">{Number(cur || 0).toLocaleString()} / {Number(max || 0).toLocaleString()}{suffix}</span>
    </div>
    <div className="h-1 bg-bg rounded-full overflow-hidden">
      <div className="h-full bg-yellow rounded-full transition-all" style={{ width: `${pctOf(cur, max)}%` }} />
    </div>
  </div>
);
const PStat = ({ label, value, tone = '' }) => (
  <div className="bg-bg2 border border-border rounded-lg px-3 py-2.5">
    <div className="text-[9px] text-muted uppercase tracking-wide mb-0.5">{label}</div>
    <div className={`text-[13px] font-bold ${tone}`}>{value}</div>
  </div>
);
const btnGold  = "px-4 py-2 bg-yellow text-black font-semibold text-[12px] rounded-lg hover:bg-yellow-d transition-colors cursor-pointer";
const btnGhost = "px-4 py-2 border border-border text-white font-medium text-[12px] rounded-lg hover:border-yellow hover:text-yellow transition-colors cursor-pointer";

export function Profile() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]   = useState('profile');
  const [loading, setL] = useState(true);
  const [u, setU]       = useState(null);
  const [limits, setLim]= useState(null);
  const [vers, setVers] = useState([]);
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
    const [p, l, v, b] = await Promise.allSettled([
      api.profileGet(), api.profileLimits(), api.userVerificationGet(), api.walletsBalance(),
    ]);
    if (p.status === 'fulfilled' && p.value?.success) {
      const usr = p.value.data.user || {};
      setU(usr);
      setForm({ name: usr.name || '', phone: usr.phone || '' });
      setLink(usr.partner_link || '');
      setTwoFA(!!usr.two_factor_enabled);
    }
    if (l.status === 'fulfilled' && l.value?.success) setLim(l.value.data.limits || null);
    if (v.status === 'fulfilled' && v.value?.success) setVers(v.value.data.verifications || []);
    if (b.status === 'fulfilled' && b.value?.success) setBals(b.value.data.balances || []);
    setL(false);
  };
  useEffect(() => { load(); }, []);

  const saveProfile = async () => {
    try {
      const r = await api.profileEditMain(form);
      if (link && link !== (u?.partner_link || '')) {
        const lr = await api.profileEditPartnerLink({ partner_link: link });
        if (!lr?.success) return toast('err', lr?.error?.message || 'Partner link not saved');
      }
      r?.success ? toast('ok', 'Profile saved') : toast('err', r?.error?.message || 'Could not save');
    } catch { toast('err', 'Could not save'); }
  };
  const changePassword = async () => {
    if (pw.new_password !== pw.confirm) return toast('err', 'New passwords do not match');
    if (pw.new_password.length < 8)     return toast('err', 'Password must be at least 8 characters');
    const r = await api.profileEditPassword({ old_password: pw.old_password, new_password: pw.new_password });
    if (r?.success) { toast('ok', 'Password updated'); setPw({ old_password: '', new_password: '', confirm: '' }); }
    else toast('err', r?.error?.message || 'Could not update password');
  };
  const changeEmail = async () => {
    const r = await api.profileEditEmail(em);
    if (r?.success) { toast('ok', r.data?.message || 'Confirmation sent to new email'); setEm({ email: '', password: '' }); load(); }
    else toast('err', r?.error?.message || 'Could not change email');
  };
  const enable2FA = async () => {
    const r = await api.otpCreate();
    if (r?.success) setOtp({ secret: r.data.secret, uri: r.data.qr_url, code: '' });
    else toast('err', r?.error?.message || 'Could not start 2FA setup');
  };
  const confirm2FA = async () => {
    const r = await api.otpConfirm({ code: otp?.code || '' });
    if (r?.success) { setTwoFA(true); setOtp(null); toast('ok', 'Two-factor authentication enabled'); }
    else toast('err', r?.error?.message || 'Invalid code');
  };
  const disable2FA = async () => {
    const r = await api.otpDelete();
    if (r?.success) { setTwoFA(false); toast('ok', '2FA disabled'); } else toast('err', 'Could not disable 2FA');
  };
  const signOut = async () => { try { await logout(); } finally { navigate('/login'); } };
  const blockAccount = async () => {
    if (!window.confirm('Freeze your account? You will be signed out and exchanges will be blocked until support reactivates it.')) return;
    const r = await api.profileBlock();
    if (r?.success) signOut(); else toast('err', 'Could not freeze account');
  };
  const deleteAccount = async () => {
    if (delTxt !== 'DELETE') return toast('err', 'Type DELETE to confirm');
    const r = await api.profileDelete();
    if (r?.success) signOut(); else toast('err', 'Could not delete account');
  };
  const copy = t => { try { navigator.clipboard.writeText(t); toast('ok', 'Copied'); } catch {} };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">Loading account…</div>;

  const display = u || authUser || {};
  const verStatus = (vers[0]?.status || '').toLowerCase();
  const kycState = vers.length === 0 ? 'none' : (verStatus || 'pending');
  const kycLabel = kycState === 'none' ? 'Not started' : kycState.charAt(0).toUpperCase() + kycState.slice(1);

  const TABS = [['profile','Profile'], ['security','Security'], ['verification','Verification'], ['wallets','Wallets'], ['danger','Danger']];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-7">
      <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-5 lg:items-start">

        {/* ── LEFT: identity + nav ── */}
        <div className="lg:sticky lg:top-6 space-y-3 mb-4 lg:mb-0">
          <div className="bg-bg2 border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-extrabold text-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #F0B90B, #c99a09)' }}>
                {initialsOf(display.name, display.email)}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold truncate leading-tight">{display.name || 'Your account'}</div>
                <div className="text-[10.5px] text-muted truncate">{display.email}</div>
              </div>
            </div>
            <div className="text-[10px] text-muted mt-2">Member since {fmtDate(display.created_at)}</div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <PChip ok={!!display.email_verified} warn={!display.email_verified} label={display.email_verified ? 'Verified' : 'Unverified'} />
              <PChip ok={twoFA} warn={!twoFA} label={twoFA ? '2FA on' : '2FA off'} />
              {display.is_blocked && <PChip warn label="Frozen" />}
            </div>
          </div>

          <div className="flex lg:flex-col gap-1 bg-bg2 border border-border rounded-xl p-1 overflow-x-auto">
            {TABS.map(([k, lbl]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`lg:w-full text-left px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer
                  ${tab === k ? (k === 'danger' ? 'bg-red text-white' : 'bg-yellow text-black') : 'text-muted hover:text-white hover:bg-bg3'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: content ── */}
        <div className="min-w-0">
          {flash && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-[11.5px] border
              ${flash.type === 'ok' ? 'bg-green/10 text-green border-green/20' : 'bg-red/10 text-red border-red/20'}`}>
              {flash.text}
            </div>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <PStat label="Verification" value={kycLabel} tone={kycState === 'approved' || kycState === 'verified' ? 'text-green' : 'text-yellow'} />
                <PStat label="2FA" value={twoFA ? 'On' : 'Off'} tone={twoFA ? 'text-green' : 'text-muted'} />
                <PStat label="Wallets" value={bals.length} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <PCard title="Personal details">
                  <div className="space-y-2.5">
                    <PInput label="Full name" value={form.name} onChange={setF('name')} placeholder="Your name" />
                    <PInput label="Phone" value={form.phone} onChange={setF('phone')} placeholder="+254 7XX XXX XXX" />
                    <button onClick={saveProfile} className={btnGold}>Save changes</button>
                  </div>
                </PCard>
                <PCard title="Limits">
                  {limits ? (
                    <div className="space-y-2.5">
                      <PBar label="Daily"   cur={limits.current_daily}   max={limits.daily_limit}   suffix=" USD" />
                      <PBar label="Monthly" cur={limits.current_monthly} max={limits.monthly_limit} suffix=" USD" />
                      {limits.kyc_required_at && (
                        <div className="text-[10px] text-muted">KYC required above {Number(limits.kyc_required_at).toLocaleString()} USD.</div>
                      )}
                    </div>
                  ) : <div className="text-[11px] text-muted">Unavailable.</div>}
                </PCard>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {tab === 'security' && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <PCard title="Change password">
                  <div className="space-y-2.5">
                    <PInput label="Current password" type="password" value={pw.old_password} onChange={e => setPw(p => ({ ...p, old_password: e.target.value }))} />
                    <PInput label="New password" type="password" value={pw.new_password} onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} />
                    <PInput label="Confirm new" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                    <button onClick={changePassword} className={btnGold}>Update password</button>
                  </div>
                </PCard>
                <PCard title="Change email">
                  {display.pending_email && <div className="text-[10.5px] text-yellow mb-2.5">Pending: {display.pending_email}</div>}
                  <div className="space-y-2.5">
                    <PInput label="New email" type="email" value={em.email} onChange={e => setEm(s => ({ ...s, email: e.target.value }))} placeholder="new@email.com" />
                    <PInput label="Current password" type="password" value={em.password} onChange={e => setEm(s => ({ ...s, password: e.target.value }))} />
                    <button onClick={changeEmail} className={btnGhost}>Send confirmation</button>
                  </div>
                </PCard>
              </div>

              <PCard title="Two-factor authentication"
                desc="An authenticator-app code in addition to your password."
                action={<PChip ok={twoFA} warn={!twoFA} label={twoFA ? 'Enabled' : 'Disabled'} />}>
                {!twoFA && !otp && <button onClick={enable2FA} className={btnGold}>Enable 2FA</button>}
                {!twoFA && otp && (
                  <div className="space-y-2.5 max-w-md">
                    <div className="text-[10.5px] text-muted">Add this secret to your authenticator app:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-[11.5px] text-yellow break-all">{otp.secret}</code>
                      <button onClick={() => copy(otp.secret)} className="px-2.5 py-1.5 border border-border rounded-lg text-[10.5px] text-muted hover:text-white cursor-pointer">Copy</button>
                    </div>
                    <div className="flex gap-2">
                      <input value={otp.code} onChange={e => setOtp(o => ({ ...o, code: e.target.value }))} placeholder="6-digit code" inputMode="numeric"
                        className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-white text-[12px] tracking-widest outline-none focus:border-yellow" />
                      <button onClick={confirm2FA} className={btnGold}>Verify</button>
                    </div>
                    <button onClick={() => setOtp(null)} className="text-[10.5px] text-muted hover:text-white cursor-pointer bg-transparent border-none p-0">Cancel</button>
                  </div>
                )}
                {twoFA && <button onClick={disable2FA} className="px-4 py-2 border border-red/40 text-red font-medium text-[12px] rounded-lg hover:bg-red/10 transition-colors cursor-pointer">Disable 2FA</button>}
              </PCard>
            </div>
          )}

          {/* VERIFICATION */}
          {tab === 'verification' && (
            <div className="grid md:grid-cols-2 gap-3">
              <PCard title="Identity"
                action={<PChip ok={kycState === 'approved' || kycState === 'verified'} warn={kycState === 'pending' || kycState === 'none'} label={kycLabel} />}
                desc="Verify to raise your exchange limits.">
                {kycState === 'none' && <button onClick={() => navigate('/kyc')} className={btnGold}>Start verification</button>}
                {kycState === 'pending' && <div className="text-[11px] text-muted">Your submission is under review.</div>}
                {(kycState === 'approved' || kycState === 'verified') && <div className="text-[11px] text-green">Your identity is verified.</div>}
                {kycState === 'rejected' && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] text-red">Last submission rejected. Re-submit clearer documents.</div>
                    <button onClick={() => navigate('/kyc')} className={btnGold}>Re-submit</button>
                  </div>
                )}
              </PCard>
              <PCard title="Email"
                action={<PChip ok={!!display.email_verified} warn={!display.email_verified} label={display.email_verified ? 'Verified' : 'Unverified'} />}
                desc={display.email_verified ? `Confirmed ${fmtDate(display.email_verified_at)}.` : 'Check your inbox for the verification link.'} />
            </div>
          )}

          {/* WALLETS */}
          {tab === 'wallets' && (
            <div>
              {bals.length === 0 ? (
                <PCard title="Wallets" desc="Balances appear here after your first exchange.">
                  <button onClick={() => navigate('/about')} className={btnGold}>Start an exchange</button>
                </PCard>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {bals.map((b, i) => (
                    <PCard key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-[13px]">{b.currency} <span className="text-muted text-[10.5px] font-normal">{b.name}</span></div>
                          {b.network && <div className="text-[9.5px] text-muted">{b.network}</div>}
                        </div>
                        <div className="text-[14px] font-bold text-yellow">{b.balance}</div>
                      </div>
                      {b.address && (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-muted break-all">{b.address}</code>
                          <button onClick={() => copy(b.address)} className="px-2.5 py-1.5 border border-border rounded-lg text-[10px] text-muted hover:text-white cursor-pointer">Copy</button>
                        </div>
                      )}
                    </PCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DANGER */}
          {tab === 'danger' && (
            <div className="grid md:grid-cols-2 gap-3">
              <PCard danger title="Freeze account" desc="Blocks your account and all exchanges. Support is needed to reactivate.">
                <button onClick={blockAccount} className="px-4 py-2 border border-red/40 text-red font-medium text-[12px] rounded-lg hover:bg-red/10 transition-colors cursor-pointer">Freeze account</button>
              </PCard>
              <PCard danger title="Delete account" desc="Permanently closes your account. Cannot be undone.">
                <div className="space-y-2.5">
                  <PInput label='Type "DELETE" to confirm' value={delTxt} onChange={e => setDel(e.target.value)} placeholder="DELETE" />
                  <button onClick={deleteAccount} disabled={delTxt !== 'DELETE'}
                    className="px-4 py-2 bg-red text-white font-medium text-[12px] rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40">Delete permanently</button>
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

  return (
    <div className="px-4 md:px-8 py-7 max-w-2xl">
      <h2 className="text-[18px] font-extrabold mb-1">Affiliate Program</h2>
      <p className="text-[12px] text-muted mb-6">Earn 0.3% commission on every completed order from your referrals</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ['Total Earned', `${stats?.total_earned||'0.00'} USDT`],
          ['Total Referrals', stats?.total_referrals||0],
          ['Today',           `${today?.earned||'0.00'} USDT`],
          ['Pending',         `${stats?.pending_earned||'0.00'} USDT`],
        ].map(([label,val])=>(
          <div key={label} className="bg-bg2 border border-border rounded-xl p-4">
            <div className="text-[11px] text-muted mb-1.5">{label}</div>
            <div className="text-[16px] font-extrabold text-yellow">{val}</div>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <label className="text-[11.5px] text-muted block mb-1.5">Your Partner Link</label>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3.5 py-2.5">
          <span className="text-yellow font-mono text-[12px] flex-1 break-all">{partnerUrl}</span>
          <button onClick={()=>{ navigator.clipboard.writeText(partnerUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
            className="px-3 py-1 text-[11px] bg-bg3 border border-border rounded hover:border-yellow hover:text-yellow transition-colors whitespace-nowrap cursor-pointer">
            {copied?'✓ Copied!':'Copy'}
          </button>
        </div>
      </div>

      {balance.length>0 && (
        <div className="mb-5">
          <div className="text-[13px] font-bold mb-3">Wallet Balances</div>
          {balance.map((b,i)=>(
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-border text-[12.5px]">
              <span className="text-muted">{b.currency} ({b.network})</span>
              <span className="text-yellow font-bold">{b.balance}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-bg2 border border-border rounded-xl p-4">
        <h3 className="text-[13px] font-bold text-yellow mb-3">How It Works</h3>
        {['Share your partner link with friends. When they complete an exchange, you earn 0.3% of the exchange amount.',
          'Commission is credited to your internal wallet only after orders reach COMPLETED status.',
          'Minimum withdrawal: 5 USDT. Withdraw via the Partner Withdrawal section.'].map((p,i)=>(
          <p key={i} className="text-[12px] text-muted leading-relaxed mb-2 last:mb-0">{p}</p>
        ))}
      </div>
    </div>
  );
}