import { useState } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Contacts() {
  const { user } = useAuth();
  const [form, setForm]       = useState({
    name:     user?.name  || '',
    email:    user?.email || '',
    order_id: '',
    subject:  '',
    message:  '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Open the in-app chat bot instead of linking out to Telegram directly
  const openChat = () => window.dispatchEvent(new CustomEvent('swiftswap:open-chat'));

  // ── Send message logic — unchanged ──
  const submit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields'); return;
    }
    setSending(true); setError('');
    const res = await apiCall('POST', 'public/contact/submit', form);
    setSending(false);
    if (res.success) { setSent(true); setForm(f => ({ ...f, subject: '', message: '', order_id: '' })); }
    else setError(res.error?.message || 'Failed to send. Please try again.');
  };

  const CHANNELS = [
    {
      icon: <span className="text-[20px]">⚡</span>,
      tag: 'Fastest', label: 'Live Chat', value: 'Chat with SwiftBot',
      onClick: openChat, accent: '#F0B90B',
    },
    {
      icon: <span className="text-[20px]">✉️</span>,
      tag: 'Email', label: 'Support', value: 'support@swiftswap.com',
      href: 'mailto:support@swiftswap.com', accent: '#229ED9',
    },
    {
      icon: <span className="text-[20px]">🕐</span>,
      tag: 'Always on', label: 'Availability', value: '24/7 · within 1 hour',
      href: null, accent: '#03A66D',
    },
  ];

  const MORE = [
    { icon: '⚠️', label: 'Complaints', value: 'complaints@swiftswap.com' },
    { icon: '🔒', label: 'Security',   value: 'security@swiftswap.com' },
  ];

  const FAQ = [
    { q: 'How long does an exchange take?', a: 'Most exchanges complete within 5–60 minutes depending on network confirmations.' },
    { q: 'My order expired — what do I do?', a: 'Create a new order. If you already sent funds, contact support immediately with your order ID.' },
    { q: 'How do I track my order?', a: 'Log into your account and visit My Orders to see real-time status updates.' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">

      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green/10 border border-green/20 text-[11px] text-green font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" /> All systems operational
        </div>
        <h1 className="text-[30px] font-extrabold mb-2 leading-tight">
          We're here to <span className="text-yellow">help</span>
        </h1>
        <p className="text-muted text-[13px] max-w-md mx-auto">
          Questions about an exchange, order, or your account? Reach us any way you like — we reply fast.
        </p>
      </div>

      {/* Primary channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {CHANNELS.map((c, i) => {
          const Inner = (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${c.accent}1a`, color: c.accent }}>
                  {c.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${c.accent}1a`, color: c.accent }}>{c.tag}</span>
              </div>
              <div className="text-[11px] text-muted">{c.label}</div>
              <div className="text-[13px] font-bold text-white break-all">{c.value}</div>
            </>
          );
          if (c.href) return (
            <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
              className="bg-bg2 border border-border rounded-2xl p-4 hover:border-yellow/40 hover:-translate-y-0.5 transition-all">
              {Inner}
            </a>
          );
          if (c.onClick) return (
            <button key={i} onClick={c.onClick}
              className="text-left bg-bg2 border border-border rounded-2xl p-4 hover:border-yellow/40 hover:-translate-y-0.5 transition-all cursor-pointer">
              {Inner}
            </button>
          );
          return <div key={i} className="bg-bg2 border border-border rounded-2xl p-4">{Inner}</div>;
        })}
      </div>

      {/* ── Send a Message form — UNCHANGED ── */}
      <div className="bg-bg2 border border-border rounded-2xl p-5 md:p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[18px]">✉️</span>
          <div className="font-bold text-[15px]">Send a Message</div>
        </div>
        <p className="text-muted text-[11.5px] mb-4">Fill in the form and our team will get back to you within an hour.</p>

        {sent && (
          <div className="bg-green/10 border border-green/20 rounded-xl px-4 py-3 mb-4 text-[12px] text-green">
            ✅ Message sent! We'll get back to you within 1 hour.
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wide block mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Your name"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wide block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wide block mb-1">Order ID (optional)</label>
            <input value={form.order_id} onChange={e => set('order_id', e.target.value)}
              placeholder="SS-XXXXXXXX"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
          </div>

          <div>
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wide block mb-1">Subject *</label>
            <select value={form.subject} onChange={e => set('subject', e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors cursor-pointer">
              <option value="">Select a topic…</option>
              <option>Order Issue</option>
              <option>Payment Problem</option>
              <option>Account Support</option>
              <option>Wrong Amount Received</option>
              <option>Verification Request</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wide block mb-1">Message *</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)}
              rows={5} placeholder="Describe your issue in detail…"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors resize-none" />
          </div>

          {error && <div className="text-red text-[11px]">⚠ {error}</div>}

          <button onClick={submit} disabled={sending}
            className="w-full py-3 bg-yellow text-black font-extrabold text-[13px] rounded-xl hover:bg-yellow-d transition-colors cursor-pointer disabled:opacity-50">
            {sending ? '⏳ Sending…' : '✉️ Send Message'}
          </button>

          <p className="text-[10px] text-muted text-center">
            By submitting you agree to our{' '}
            <a href="/rules" className="text-yellow hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
      {/* ── end Send a Message form ── */}

      {/* Other ways + FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-[12px] font-bold mb-3 text-muted uppercase tracking-wide">Other ways to reach us</div>
          <div className="space-y-2">
            {MORE.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-bg2 border border-border rounded-xl px-4 py-3 hover:border-yellow/30 transition-colors">
                <span className="text-[16px] shrink-0">{m.icon}</span>
                <div className="min-w-0">
                  <div className="text-[10px] text-muted uppercase tracking-wide">{m.label}</div>
                  <div className="text-[12px] font-bold text-white break-all">{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold mb-3 text-muted uppercase tracking-wide">Common questions</div>
          {FAQ.map((f, i) => (
            <details key={i} className="bg-bg2 border border-border rounded-xl mb-2 overflow-hidden group">
              <summary className="px-4 py-3 text-[11.5px] font-semibold cursor-pointer list-none flex justify-between items-center hover:text-yellow transition-colors">
                {f.q} <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-4 pb-3 text-[11px] text-muted leading-relaxed border-t border-border">{f.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* ── Hero / CTA banner beneath Contact Us ── */}
      <div className="relative overflow-hidden rounded-3xl mt-10 border border-yellow/20"
        style={{ background: 'radial-gradient(120% 130% at 50% 0%, #1b1c12 0%, #0B0E11 58%)' }}>

        {/* gold glow */}
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(240,185,11,0.20) 0%, transparent 70%)' }} />
        {/* faint grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(#F0B90B 1px, transparent 1px), linear-gradient(90deg, #F0B90B 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
        {/* floating coins */}
        <span className="ss-float absolute left-6 top-9 text-[26px] text-yellow opacity-40" style={{ animationDelay: '0s' }}>₿</span>
        <span className="ss-float absolute right-9 top-14 text-[22px] text-blue-400 opacity-35" style={{ animationDelay: '1.1s' }}>Ξ</span>
        <span className="ss-float absolute left-[22%] bottom-7 text-[20px] opacity-30" style={{ animationDelay: '2s' }}>◎</span>
        <span className="ss-float absolute right-[24%] bottom-10 text-[24px] text-green opacity-35" style={{ animationDelay: '0.6s' }}>₮</span>

        <div className="relative px-6 md:px-10 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow/10 border border-yellow/20 text-[11px] text-yellow font-semibold mb-5">
            ⚡ 0% platform fee · instant swaps
          </div>
          <h2 className="text-[26px] md:text-[34px] font-extrabold leading-tight mb-3">
            Got your answer? <span className="text-yellow">Now make the swap.</span>
          </h2>
          <p className="text-muted text-[13px] max-w-md mx-auto mb-7">
            Pick a direction, send your payment, and receive your crypto — most exchanges land in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/about"
              className="ss-shimmer relative overflow-hidden px-7 py-3 bg-yellow text-black font-extrabold text-[13px] rounded-xl hover:bg-yellow-d transition-colors">
              Start an Exchange →
            </a>
            <button onClick={openChat}
              className="px-7 py-3 border border-border text-white font-bold text-[13px] rounded-xl hover:border-yellow hover:text-yellow transition-colors cursor-pointer bg-transparent">
              💬 Chat with us
            </button>
          </div>
        </div>

        <style>{`
          @keyframes ssFloat { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-10px) } }
          .ss-float { animation: ssFloat 4s ease-in-out infinite; }
          @keyframes ssShimmer { 0%{ transform: translateX(-130%) } 60%,100%{ transform: translateX(160%) } }
          .ss-shimmer::after {
            content:''; position:absolute; top:0; left:0; width:45%; height:100%;
            background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
            animation: ssShimmer 3s ease-in-out infinite;
          }
        `}</style>
      </div>

    </div>
  );
}