import { useState, useEffect, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Lock, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { Reveal } from '../../lib/motion';
import { adminCall } from '../api';

const META = {
  BTC:        { name: 'Bitcoin',     tag: 'BTC',  net: 'Bitcoin',       color: '#F7931A', dp: 8, confirms: 2  },
  USDT_TRC20: { name: 'Tether USDT', tag: 'USDT', net: 'Tron (TRC-20)', color: '#26A17B', dp: 6, confirms: 19 },
};

const fmt = (n, dp) => {
  const v = parseFloat(n || 0);
  return v === 0 ? '0' : v.toFixed(dp).replace(/0+$/, '').replace(/\.$/, '');
};
const usd = n => '$' + parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Copy({ value }) {
  const [done, setDone] = useState(false);
  const go = async () => {
    try { await navigator.clipboard.writeText(value); }
    catch { const t = document.createElement('textarea'); t.value = value; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setDone(true); setTimeout(() => setDone(false), 1500);
  };
  return (
    <button onClick={go} className={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-semibold cursor-pointer transition-colors ${done ? 'border-green text-green' : 'border-border text-muted hover:border-brand hover:text-brand-fg'}`}>
      {done ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function ReceiveModal({ meta, address, onClose }) {
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (qrRef.current && address) QRCode.toCanvas(qrRef.current, address, { width: 200, margin: 1 }).catch(() => {}); }, [address]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-bg2 border border-border rounded-2xl w-full max-w-[380px] max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-bold text-[14px] text-fg">Receive {meta.tag}</span>
          <button onClick={onClose} className="text-muted hover:text-fg cursor-pointer text-[16px] leading-none">×</button>
        </div>
        <div className="p-5">
          <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1.5">Network</div>
          <div className="bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] font-semibold text-fg mb-4">{meta.net}</div>
          <div className="flex justify-center mb-4"><div className="bg-white p-3 rounded-xl"><canvas ref={qrRef} /></div></div>
          <div className="bg-bg border border-border rounded-lg px-3 py-2.5 mb-3"><div className="font-mono text-[11px] text-fg break-all leading-relaxed">{address}</div></div>
          <button onClick={copy} className={`w-full py-2.5 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${copied ? 'bg-green text-white' : 'bg-brand text-white hover:bg-brand-h'}`}>
            {copied ? '✓ Address copied' : 'Copy address'}
          </button>
          <div className="mt-4 bg-red/10 border border-red/25 rounded-lg px-3 py-2.5 text-[10.5px] text-red leading-relaxed">
            ⚠ Send only <strong>{meta.tag}</strong> on the <strong>{meta.net}</strong> network. Coins on any other network are permanently lost.
          </div>
          <div className="mt-3 text-[10px] text-muted text-center">Credited after {meta.confirms} confirmation{meta.confirms === 1 ? '' : 's'}.</div>
        </div>
      </div>
    </div>
  );
}

function SendModal({ asset, meta, available, limit = 0, used = 0, onClose, onDone }) {
  const [stepN, setStep]  = useState(1);
  const [to, setTo]       = useState('');
  const [amt, setAmt]     = useState('');
  const [totp, setTotp]   = useState('');
  const [needTotp, setNeed] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');
  const [wd, setWd]       = useState(null);
  const [uri, setUri]     = useState('');
  const [scannable, setScan] = useState(false);
  const [txid, setTxid]   = useState('');
  const qrRef = useRef(null);

  useEffect(() => { if (stepN === 2 && qrRef.current && uri) QRCode.toCanvas(qrRef.current, uri, { width: 190, margin: 1 }).catch(() => {}); }, [stepN, uri]);

  const submit = async () => {
    setErr(''); setBusy(true);
    const body = { asset, to_address: to.trim(), amount: parseFloat(amt) };
    if (totp) body.totp_code = totp;
    const r = await adminCall('POST', 'admin/wallet/withdraw', body);
    setBusy(false);
    if (r.error?.code === 'TOTP_REQUIRED') { setNeed(true); setErr(''); return; }
    if (r.error?.code === 'TOTP_INVALID')  { setNeed(true); setErr('That 2FA code is not valid.'); return; }
    if (r.success) { setWd(r.data.withdrawal); setUri(r.data.payment_uri); setScan(r.data.scannable); setStep(2); }
    else setErr(r.error?.message || 'Could not create the withdrawal.');
  };
  const confirmSent = async () => {
    setErr(''); setBusy(true);
    const r = await adminCall('PUT', 'admin/wallet/withdraw/sent', { id: wd.id, txid: txid.trim() });
    setBusy(false);
    if (r.success) { onDone(`Withdrawal recorded — ${amt} ${meta.tag} sent.`); onClose(); }
    else setErr(r.error?.message || 'Could not record the transaction.');
  };
  const cancel = async () => { if (wd) await adminCall('PUT', 'admin/wallet/withdraw/cancel', { id: wd.id }); onClose(); };
  const copy = async (v) => { try { await navigator.clipboard.writeText(v); } catch {} };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
      <div className="bg-bg2 border border-border rounded-2xl w-full max-w-[400px] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-bold text-[14px] text-fg">Send {meta.tag}</span>
          <button onClick={stepN === 1 ? onClose : cancel} className="text-muted hover:text-fg cursor-pointer text-[16px] leading-none">×</button>
        </div>
        <div className="p-5">
          {stepN === 1 ? (
            <>
              <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1.5">Network</div>
              <div className="bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] font-semibold text-fg mb-4">{meta.net}</div>
              <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1.5">Receiver address</div>
              <input value={to} onChange={e => setTo(e.target.value)} autoFocus placeholder={asset === 'BTC' ? 'bc1…' : 'T…'}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[11px] font-mono text-fg outline-none focus:border-brand mb-4" />
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted uppercase tracking-wide font-semibold">Amount</span>
                <button onClick={() => setAmt(String(available))} className="text-[10px] text-brand-fg hover:underline cursor-pointer">Max</button>
              </div>
              <input value={amt} onChange={e => setAmt(e.target.value)} type="number" step="any" placeholder="0.00"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[14px] font-bold text-fg outline-none focus:border-brand" />
              <div className="text-[10px] text-muted mt-1">Available: {fmt(available, meta.dp)} {meta.tag}</div>
              {limit > 0 && <div className="text-[10px] text-muted mt-0.5">24h limit: {fmt(used, meta.dp)} / {fmt(limit, meta.dp)} {meta.tag} used</div>}

              {needTotp && (
                <div className="mt-3">
                  <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1.5">2FA code</div>
                  <input value={totp} onChange={e => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" autoFocus
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[15px] font-mono tracking-[0.3em] text-center text-fg outline-none focus:border-brand" />
                  <div className="text-[10px] text-muted mt-1">Required to authorise money leaving the treasury.</div>
                </div>
              )}
              {err && <div className="mt-3 bg-red/10 border border-red/25 rounded-lg px-3 py-2 text-[11px] text-red">{err}</div>}
              <button onClick={submit} disabled={busy || !to || !amt || (needTotp && totp.length !== 6)}
                className="w-full mt-4 py-2.5 bg-brand text-white rounded-lg text-[12px] font-bold cursor-pointer hover:bg-brand-h transition-colors disabled:opacity-50">
                {busy ? 'Checking…' : 'Continue'}
              </button>
              <div className="mt-3 text-[10px] text-muted text-center">Double-check the address. Crypto sent to a wrong address is lost forever.</div>
            </>
          ) : (
            <>
              <div className="bg-yellow/10 border border-yellow/25 rounded-lg px-3 py-2.5 mb-4 text-[11px] text-yellow leading-relaxed">
                Approve this in your wallet to send it. This server cannot sign transactions.
              </div>
              {scannable ? (
                <>
                  <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-2">Scan with your wallet</div>
                  <div className="flex justify-center mb-4"><div className="bg-white p-3 rounded-xl"><canvas ref={qrRef} /></div></div>
                </>
              ) : (
                <div className="mb-4 text-[11px] text-muted leading-relaxed">Open your wallet, choose <strong className="text-fg">Send → USDT → Tron (TRC-20)</strong>, and paste the address and amount below.</div>
              )}
              <div className="bg-bg border border-border rounded-lg p-3 mb-3 space-y-2.5">
                <div>
                  <div className="text-[9px] text-muted uppercase font-semibold mb-1">To address</div>
                  <div className="flex items-center gap-2"><span className="font-mono text-[10.5px] text-fg break-all flex-1">{to}</span>
                    <button onClick={() => copy(to)} className="shrink-0 px-2 py-0.5 rounded border border-border text-[9px] text-muted hover:border-brand hover:text-brand-fg cursor-pointer">Copy</button></div>
                </div>
                <div className="border-t border-border pt-2.5">
                  <div className="text-[9px] text-muted uppercase font-semibold mb-1">Amount</div>
                  <div className="flex items-center gap-2"><span className="text-[13px] font-bold text-fg flex-1">{amt} {meta.tag}</span>
                    <button onClick={() => copy(String(amt))} className="shrink-0 px-2 py-0.5 rounded border border-border text-[9px] text-muted hover:border-brand hover:text-brand-fg cursor-pointer">Copy</button></div>
                </div>
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1.5">Transaction hash (after sending)</div>
              <input value={txid} onChange={e => setTxid(e.target.value)} placeholder="Paste the txid from your wallet"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[10.5px] font-mono text-fg outline-none focus:border-brand" />
              {err && <div className="mt-3 bg-red/10 border border-red/25 rounded-lg px-3 py-2 text-[11px] text-red">{err}</div>}
              <button onClick={confirmSent} disabled={busy || !txid.trim()}
                className="w-full mt-4 py-2.5 bg-green text-white rounded-lg text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
                {busy ? 'Saving…' : "✓ I've sent it — record this"}
              </button>
              <button onClick={cancel} className="w-full mt-2 py-2 border border-border text-muted rounded-lg text-[11px] cursor-pointer hover:text-fg">Cancel withdrawal</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Treasury() {
  const [assets, setAssets]     = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWd]    = useState([]);
  const [loading, setLoad]      = useState(true);
  const [syncing, setSync]      = useState(false);
  const [msg, setMsg]           = useState(null);
  const [edit, setEdit]         = useState(null);
  const [addr, setAddr]         = useState('');
  const [receive, setReceive]   = useState(null);
  const [send, setSend]         = useState(null);

  const load = async () => {
    const [a, d, w] = await Promise.all([
      adminCall('GET', 'admin/wallet/assets'),
      adminCall('GET', 'admin/wallet/deposits'),
      adminCall('GET', 'admin/wallet/withdrawals'),
    ]);
    if (a.success) setAssets(a.data.assets);
    if (d.success) setDeposits(d.data.deposits);
    if (w.success) setWd(w.data.withdrawals);
    setLoad(false);
  };
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSync(true); setMsg(null);
    const r = await adminCall('POST', 'admin/wallet/sync'); setSync(false);
    if (r.success) { const { new: n, updated } = r.data; setMsg({ ok: true, text: n || updated ? `Sync complete — ${n} new, ${updated} confirmed.` : 'Sync complete — no new deposits found.' }); load(); }
    else setMsg({ ok: false, text: r.error?.message || 'Sync failed.' });
  };
  const saveAddr = async () => {
    const r = await adminCall('PUT', 'admin/wallet/address', { asset: edit, address: addr.trim() });
    if (r.success) { setEdit(null); setAddr(''); setMsg({ ok: true, text: 'Deposit address saved.' }); load(); }
    else setMsg({ ok: false, text: r.error?.message || 'Could not save address.' });
  };

  if (loading) return <div className="text-[12px] text-muted">Loading wallets…</div>;
  const totalUsd = assets.reduce((s, a) => s + parseFloat(a.usd_value || 0), 0);

  return (
    <div>
      <Reveal variant="fadeUp" className="mb-4 bg-bg2 border border-border rounded-xl px-4 py-3 flex items-start gap-3">
        <Lock className="h-4 w-4 text-green shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted leading-relaxed">
          <strong className="text-fg">No keys on this server.</strong> Deposits are detected on-chain and credited automatically.
          Sends are prepared and recorded here, but signed in your own wallet — so a breach of this server cannot move your funds.
        </div>
      </Reveal>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Total balance</div>
          <div className="text-[22px] font-extrabold text-fg">{usd(totalUsd)}</div>
        </div>
        <button onClick={sync} disabled={syncing}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-[12px] font-bold rounded-lg cursor-pointer hover:bg-brand-h transition-colors disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync deposits'}
        </button>
      </div>

      {msg && <div className={`mb-4 rounded-lg px-3 py-2 text-[11.5px] border ${msg.ok ? 'bg-green/10 border-green/25 text-green' : 'bg-red/10 border-red/25 text-red'}`}>{msg.text}</div>}

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3 mb-6">
        {assets.map(a => {
          const m = META[a.asset] || { name: a.asset, tag: a.asset, net: a.network, color: '#5100fd', dp: 8 };
          return (
            <div key={a.asset} className="bg-bg2 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0" style={{ background: m.color }}>{m.tag.slice(0, 3)}</span>
                  <div><div className="font-semibold text-[13px] text-fg">{m.tag}</div><div className="text-[10px] text-muted">{m.net}</div></div>
                </div>
                <div className="text-right"><div className="text-[12px] font-semibold text-fg">{usd(a.usd_price)}</div>
                  <div className={`text-[10px] ${a.usd_change >= 0 ? 'text-green' : 'text-red'}`}>{a.usd_change >= 0 ? '+' : ''}{parseFloat(a.usd_change || 0).toFixed(2)}%</div></div>
              </div>
              <div className="bg-bg border border-border rounded-lg px-3 py-2.5 mb-3">
                <div className="text-[9px] text-muted uppercase font-semibold mb-0.5">Balance</div>
                <div className="text-[15px] font-bold text-fg">{fmt(a.balance, m.dp)} {m.tag}</div>
                <div className="text-[10px] text-muted">{usd(a.usd_value)}</div>
                {parseFloat(a.pending) > 0 && <div className="text-[10px] text-yellow mt-1">+{fmt(a.pending, m.dp)} pending</div>}
              </div>
              {edit === a.asset ? (
                <div className="flex flex-col gap-2">
                  <input value={addr} onChange={e => setAddr(e.target.value)} placeholder={a.asset === 'BTC' ? 'bc1…' : 'T…'} autoFocus
                    className="w-full bg-bg border border-border rounded-lg px-2.5 py-2 text-[11px] font-mono text-fg outline-none focus:border-brand" />
                  <div className="flex gap-2">
                    <button onClick={saveAddr} className="flex-1 py-2 bg-brand text-white text-[11px] font-bold rounded-lg">Save</button>
                    <button onClick={() => { setEdit(null); setAddr(''); }} className="flex-1 py-2 border border-border text-muted text-[11px] rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : a.address ? (
                <>
                  <div className="flex items-center gap-2 mb-3"><span className="font-mono text-[10px] text-fg truncate flex-1">{a.address}</span><Copy value={a.address} />
                    <button onClick={() => { setEdit(a.asset); setAddr(a.address); }} className="shrink-0 text-[9px] text-muted hover:text-brand-fg underline">Change</button></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setReceive(a.asset)} className="flex items-center justify-center gap-1.5 py-2.5 border border-border rounded-lg text-[11.5px] font-semibold text-fg hover:border-green hover:text-green transition-colors"><ArrowDownLeft className="h-3.5 w-3.5" /> Deposit</button>
                    <button onClick={() => setSend(a.asset)} disabled={parseFloat(a.balance) <= 0} className="flex items-center justify-center gap-1.5 py-2.5 border border-border rounded-lg text-[11.5px] font-semibold text-fg hover:border-brand hover:text-brand-fg transition-colors disabled:opacity-40"><ArrowUpRight className="h-3.5 w-3.5" /> Send</button>
                  </div>
                </>
              ) : (
                <button onClick={() => { setEdit(a.asset); setAddr(''); }} className="w-full py-2.5 border border-brand/40 text-brand-fg text-[11.5px] font-semibold rounded-lg hover:bg-brand/10">+ Set deposit address</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <Reveal variant="fadeUp" className="hidden md:block bg-bg2 border border-border rounded-xl overflow-x-auto mb-6">
        <table className="w-full text-[12px] min-w-[760px]">
          <thead><tr className="bg-bg text-muted text-[10px] uppercase tracking-wide">
            <th className="text-left py-2.5 px-4 font-semibold">Asset</th><th className="text-left py-2.5 px-4 font-semibold">Price</th>
            <th className="text-left py-2.5 px-4 font-semibold">Balance</th><th className="text-left py-2.5 px-4 font-semibold">Deposit address</th>
            <th className="text-left py-2.5 px-4 font-semibold">Actions</th></tr></thead>
          <tbody>
            {assets.map(a => {
              const m = META[a.asset] || { name: a.asset, tag: a.asset, net: a.network, color: '#5100fd', dp: 8 };
              return (
                <tr key={a.asset} className="border-t border-border align-top">
                  <td className="py-3 px-4"><div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0" style={{ background: m.color }}>{m.tag.slice(0, 3)}</span>
                    <div><div className="font-semibold text-fg">{m.tag}</div><div className="text-[10px] text-muted">{m.net}</div></div></div></td>
                  <td className="py-3 px-4"><div className="text-fg">{usd(a.usd_price)}</div><div className={`text-[10px] ${a.usd_change >= 0 ? 'text-green' : 'text-red'}`}>{a.usd_change >= 0 ? '+' : ''}{parseFloat(a.usd_change || 0).toFixed(2)}%</div></td>
                  <td className="py-3 px-4"><div className="font-semibold text-fg">{fmt(a.balance, m.dp)} {m.tag}</div><div className="text-[10px] text-muted">{usd(a.usd_value)}</div>
                    {parseFloat(a.pending) > 0 && <div className="text-[10px] text-yellow mt-0.5">+{fmt(a.pending, m.dp)} pending</div>}</td>
                  <td className="py-3 px-4 max-w-[280px]">
                    {edit === a.asset ? (
                      <div className="flex flex-col gap-2">
                        <input value={addr} onChange={e => setAddr(e.target.value)} placeholder={a.asset === 'BTC' ? 'bc1…' : 'T…'} autoFocus
                          className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-fg outline-none focus:border-brand" />
                        <div className="flex gap-2">
                          <button onClick={saveAddr} className="px-3 py-1 bg-brand text-white text-[10px] font-bold rounded">Save</button>
                          <button onClick={() => { setEdit(null); setAddr(''); }} className="px-3 py-1 border border-border text-muted text-[10px] rounded">Cancel</button>
                        </div>
                      </div>
                    ) : a.address ? (
                      <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-fg truncate">{a.address}</span><Copy value={a.address} />
                        <button onClick={() => { setEdit(a.asset); setAddr(a.address); }} className="shrink-0 text-[9px] text-muted hover:text-brand-fg underline">Change</button></div>
                    ) : (
                      <button onClick={() => { setEdit(a.asset); setAddr(''); }} className="px-3 py-1.5 border border-brand/40 text-brand-fg text-[10px] font-semibold rounded-lg hover:bg-brand/10">+ Set deposit address</button>
                    )}
                  </td>
                  <td className="py-3 px-4"><div className="flex flex-col gap-1.5">
                    <button onClick={() => a.address && setReceive(a.asset)} disabled={!a.address}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10.5px] font-semibold text-fg hover:border-green hover:text-green transition-colors disabled:opacity-40"><ArrowDownLeft className="h-3.5 w-3.5" /> Deposit</button>
                    <button onClick={() => a.address && setSend(a.asset)} disabled={!a.address || parseFloat(a.balance) <= 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[10.5px] font-semibold text-fg hover:border-brand hover:text-brand-fg transition-colors disabled:opacity-40"><ArrowUpRight className="h-3.5 w-3.5" /> Send</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Reveal>

      <div className="font-semibold text-[13px] mb-3 text-fg">Recent deposits</div>
      <div className="bg-bg2 border border-border rounded-xl overflow-x-auto">
        {deposits.length === 0 ? (
          <div className="py-8 text-center text-[11.5px] text-muted">No deposits yet. Set an address, send a small test amount, then hit <strong className="text-fg">Sync deposits</strong>.</div>
        ) : (
          <table className="w-full text-[12px] min-w-[560px]">
            <thead><tr className="bg-bg text-muted text-[10px] uppercase tracking-wide">
              <th className="text-left py-2.5 px-4 font-semibold">Asset</th><th className="text-left py-2.5 px-4 font-semibold">Amount</th>
              <th className="text-left py-2.5 px-4 font-semibold">Status</th><th className="text-left py-2.5 px-4 font-semibold">Seen</th>
              <th className="text-left py-2.5 px-4 font-semibold">Tx</th></tr></thead>
            <tbody>
              {deposits.map(d => {
                const m = META[d.asset] || { tag: d.asset, dp: 8 }; const ok = d.status === 'CONFIRMED';
                return (
                  <tr key={d.id} className="border-t border-border">
                    <td className="py-2.5 px-4 font-semibold text-fg">{m.tag}</td>
                    <td className="py-2.5 px-4 text-green font-semibold">+{fmt(d.amount, m.dp)}</td>
                    <td className="py-2.5 px-4"><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ok ? 'bg-green/15 text-green' : 'bg-yellow/15 text-yellow'}`}>{ok ? 'CONFIRMED' : `PENDING · ${d.confirmations}`}</span></td>
                    <td className="py-2.5 px-4 text-muted text-[10px]">{d.seen_at ? new Date(d.seen_at.replace(' ', 'T')).toLocaleString() : '—'}</td>
                    <td className="py-2.5 px-4"><a href={d.explorer_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] text-brand-fg hover:underline">{d.txid.slice(0, 10)}… <ExternalLink className="h-3 w-3" /></a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {withdrawals.length > 0 && (
        <>
          <div className="font-semibold text-[13px] mt-6 mb-3 text-fg">Withdrawals</div>
          <div className="bg-bg2 border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-[12px] min-w-[620px]">
              <thead><tr className="bg-bg text-muted text-[10px] uppercase tracking-wide">
                <th className="text-left py-2.5 px-4 font-semibold">Asset</th><th className="text-left py-2.5 px-4 font-semibold">Amount</th>
                <th className="text-left py-2.5 px-4 font-semibold">To</th><th className="text-left py-2.5 px-4 font-semibold">Status</th>
                <th className="text-left py-2.5 px-4 font-semibold">Tx</th></tr></thead>
              <tbody>
                {withdrawals.map(w => {
                  const m = META[w.asset] || { tag: w.asset, dp: 8 };
                  const tone = w.status === 'SENT' || w.status === 'CONFIRMED' ? 'bg-green/15 text-green' : w.status === 'CANCELLED' ? 'bg-red/15 text-red' : 'bg-yellow/15 text-yellow';
                  return (
                    <tr key={w.id} className="border-t border-border">
                      <td className="py-2.5 px-4 font-semibold text-fg">{m.tag}</td>
                      <td className="py-2.5 px-4 text-red font-semibold">−{fmt(w.amount, m.dp)}</td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-muted max-w-[160px] truncate">{w.to_address}</td>
                      <td className="py-2.5 px-4"><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${tone}`}>{w.status === 'AWAITING_SIGNATURE' ? 'AWAITING SIGNATURE' : w.status}</span></td>
                      <td className="py-2.5 px-4">{w.txid ? <a href={w.explorer_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-brand-fg hover:underline">{w.txid.slice(0, 10)}…</a> : <span className="text-muted text-[10px]">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {send && (() => { const a = assets.find(x => x.asset === send); const m = META[send]; return a ? (
        <SendModal asset={send} meta={m} available={parseFloat(a.balance)} limit={parseFloat(a.daily_limit || 0)} used={parseFloat(a.daily_used || 0)}
          onClose={() => setSend(null)} onDone={(txt) => { setMsg({ ok: true, text: txt }); load(); }} />) : null; })()}
      {receive && (() => { const a = assets.find(x => x.asset === receive); const m = META[receive]; return a?.address ? (
        <ReceiveModal meta={m} address={a.address} onClose={() => setReceive(null)} />) : null; })()}
    </div>
  );
}