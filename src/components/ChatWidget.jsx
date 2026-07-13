import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { API_BASE as BASE } from '../config';
const STORAGE_KEY = 'ss_chat_state';

const loadState = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};
const saveState = (msgs, ticketId, handedOff, fiatFlow, fiatPaid) => {
  try {
    // Image messages hold a blob: URL that dies on reload — persist a placeholder instead.
    const safeMsgs = msgs.map(m =>
      (m.content && typeof m.content === 'object' && m.content.type === 'image')
        ? { ...m, content: '📸 Screenshot sent' }
        : m
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ msgs: safeMsgs, ticketId, handedOff, fiatFlow, fiatPaid }));
  } catch {}
};
const clearState = () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} };

const QUICK = [
  'How do I start an exchange?',
  'How long does an exchange take?',
  'My order expired, what do I do?',
  'What currencies do you support?',
  'I want to talk to a human agent',
];

function Dots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
          style={{ animationDelay: `${i*0.15}s` }} />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const saved = loadState();
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState(saved?.msgs || [
    { role:'assistant', content:"Hi! I'm SwiftBot ⚡ How can I help you today?" }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [ticketId, setTicketId]   = useState(saved?.ticketId || null);
  const [handedOff, setHandedOff] = useState(saved?.handedOff || false);
  const [lastReply, setLastReply] = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);
  const fileRef   = useRef(null);

  const [uploading, setUploading] = useState(false); // screenshot upload in progress

  const [fiatFlow, setFiatFlow] = useState(saved?.fiatFlow || null); // tracks fiat order flow step
  const [fiatPaid, setFiatPaid] = useState(saved?.fiatPaid || false); // fiat: user confirmed payment in chat
  const [refundFlow, setRefundFlow] = useState(null); // tracks refund request flow step

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, loading]);
  useEffect(() => { if (open) { setUnread(0); inputRef.current?.focus(); } }, [open]);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Save state whenever it changes
  useEffect(() => { saveState(msgs, ticketId, handedOff, fiatFlow, fiatPaid); }, [msgs, ticketId, handedOff, fiatFlow, fiatPaid]);

  // Resume polling only if there's an active handoff ticket
  useEffect(() => {
    if (ticketId && handedOff) {
      startPolling(ticketId);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []); // eslint-disable-line

  // Listen for fiat order events from Exchange page
  useEffect(() => {
    const handleFiatOrder = (e) => {
      const { orderId, fromName, fromSymbol, toSymbol, give, email } = e.detail;
      setOpen(true);
      setFiatFlow({ step: 'confirm', orderId, fromName, fromSymbol, toSymbol, give, email });
      setMsgs([
        { role:'assistant', content:`Hi! I can see you created order **${orderId}** to exchange **${give} ${fromSymbol}** → **${toSymbol}**.` },
        { role:'assistant', content:`For security, bank/card payment details are shared privately here. Are you ready to proceed with the payment?` },
        { role:'system', content:'Reply YES to confirm and receive payment details' },
      ]);
      setUnread(2);
    };
    window.addEventListener('swiftswap:fiat-order', handleFiatOrder);
    return () => window.removeEventListener('swiftswap:fiat-order', handleFiatOrder);
  }, []);

  // Allow the order page (and anywhere else) to pop the chat open
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('swiftswap:open-chat', openChat);
    return () => window.removeEventListener('swiftswap:open-chat', openChat);
  }, []);

  // Fiat: user confirms they've paid the bank/card details shared in chat
  const markFiatPaid = async () => {
    if (!fiatFlow?.orderId || fiatPaid) return;
    try {
      const token = localStorage.getItem('ss_token');
      const r = await fetch(`${BASE}/public/exchanger/order/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order_id: fiatFlow.orderId, status: 'PAID', email: fiatFlow.email }),
      });
      const d = await r.json();
      if (d.success) {
        setFiatPaid(true);
        addMsg('system', '✅ Marked as paid — our team is verifying your payment and will release your crypto shortly.');
      } else {
        addMsg('system', `⚠️ ${d.error?.message || 'Could not mark as paid. Please try again.'}`);
      }
    } catch {
      addMsg('system', '⚠️ Network error. Please try again.');
    }
  };

  const startPolling = (tid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    if (!tid) return;
    let seen = null;
    pollRef.current = setInterval(async () => {
      try {
        const r    = await fetch(`${BASE}/public/chat/reply?ticket_id=${tid}`);
        const data = await r.json();
        if (!data.success) return;
        const reply  = data.data?.reply;
        const status = data.data?.status;
        if (reply && reply !== seen) {
          seen = reply;
          setLastReply(reply);
          addMsg('agent', reply);
          if (!open) setUnread(u => u+1);
        }
        if (status === 'RESOLVED' || status === 'CLOSED') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          addMsg('system', '✅ Your case has been closed. Thank you for contacting SwiftSwap! Starting a fresh chat...');
          setHandedOff(false);
          setTicketId(null);
          setRefundFlow(null);
          clearState();
          // Clear chat fully after a short delay so user can see the resolution message
          setTimeout(() => {
            setMsgs([{ role:'assistant', content:"Hi! I'm SwiftBot ⚡ How can I help you today?" }]);
            setLastReply(null);
            setFiatFlow(null);
          }, 3000);
        }
      } catch {}
    }, 10000); // 10 seconds
  };

  const addMsg = (role, content) => {
    setMsgs(prev => [...prev, { role, content }]);
  };

  // Kick off the refund request flow — bot asks for the Order ID.
  const startRefund = () => {
    if (loading || handedOff) return;
    setRefundFlow({ step: 'order_id' });
    addMsg('user', 'I want to request a refund');
    addMsg('assistant', "I can help you request a refund. What's your Order ID? You'll find it on your order confirmation or in your account history (it looks like a short code).");
  };

  // Screenshot upload — sends the image to the support Telegram group.
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = ''; // allow re-selecting the same file
    if (!file || uploading) return;

    // Client-side validation (server re-checks).
    if (!file.type.startsWith('image/')) {
      addMsg('assistant', 'Please choose an image file (JPG, PNG, GIF, or WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addMsg('assistant', 'That image is too large (max 5MB). Please choose a smaller one.');
      return;
    }

    // Show the image immediately in the thread.
    const previewUrl = URL.createObjectURL(file);
    addMsg('user', { type: 'image', url: previewUrl });
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('image', file);
      if (ticketId) fd.append('ticket_id', ticketId);
      if (user?.email) fd.append('email', user.email);

      const res  = await fetch(`${BASE}/public/chat/upload`, { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        // If this opened a new ticket, connect the user to an agent.
        if (data.ticket_id && !ticketId) {
          setTicketId(data.ticket_id);
          setHandedOff(true);
          startPolling(data.ticket_id);
          addMsg('system', `🎫 Ticket ${data.ticket_id} opened — an agent will respond here`);
        }
        addMsg('assistant', '📸 Screenshot sent to our support team. They can see it now.');
      } else {
        addMsg('assistant', data.error?.message || "Sorry, I couldn't send that image. Please try again.");
      }
    } catch {
      addMsg('assistant', 'Connection error while sending the image. Please try again.');
    }
    setUploading(false);
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    addMsg('user', msg);
    setLoading(true);

    // Handle fiat payment flow steps
    if (fiatFlow) {
      if (fiatFlow.step === 'confirm') {
        const isYes = /yes|yeah|yep|sure|ok|ready|proceed|confirm/i.test(msg);
        if (isYes) {
          setFiatFlow(f => ({ ...f, step: 'name' }));
          addMsg('assistant', "Great! Please enter your full name for verification:");
        } else {
          addMsg('assistant', "No problem. If you change your mind, just say YES to proceed or create a new order.");
        }
        setLoading(false);
        return;
      }
      if (fiatFlow.step === 'name') {
        setFiatFlow(f => ({ ...f, name: msg, step: 'phone' }));
        addMsg('assistant', "Thank you! Now please enter your phone number:");
        setLoading(false);
        return;
      }
      if (fiatFlow.step === 'phone') {
        const fullInfo = { ...fiatFlow, phone: msg, step: 'waiting' };
        setFiatFlow(fullInfo);
        // Create ticket and notify Telegram
        const ticketRes = await fetch(`${BASE}/public/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `FIAT PAYMENT REQUEST - Order: ${fiatFlow.orderId} | Amount: ${fiatFlow.give} ${fiatFlow.fromSymbol} → ${fiatFlow.toSymbol} | Name: ${fiatFlow.name} | Phone: ${msg} | Email: ${fiatFlow.email}`
            }],
            email: fiatFlow.email,
            force_handoff: true,
          }),
        });
        const ticketData = await ticketRes.json();
        if (ticketData.ticket_id) {
          setTicketId(ticketData.ticket_id);
          setHandedOff(true);
          startPolling(ticketData.ticket_id);
          addMsg('assistant', `✅ Verified! Our agent has been notified and will send you the bank/card details shortly via this chat. Your ticket is **${ticketData.ticket_id}**.`);
          addMsg('system', `🔒 Payment details will appear here privately — never on the order page`);
        } else {
          addMsg('assistant', "Our agent has been notified. Please wait for the payment details.");
        }
        setLoading(false);
        return;
      }
      // step 'waiting': fall through to the forward-to-Telegram block below so the
      // operator sees the user's follow-up messages. Polling handles agent replies.
    }

    // Handle refund request flow — user enters their Order ID, we validate it
    // against a real order on the site and open a refund ticket.
    if (refundFlow?.step === 'order_id') {
      try {
        const res = await fetch(`${BASE}/public/chat/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: msg, email: user?.email }),
        });
        const data = await res.json();
        if (data.success && data.found && data.ticket_id) {
          setRefundFlow(null);
          setTicketId(data.ticket_id);
          setHandedOff(true);
          addMsg('assistant', data.data?.message || `Refund request opened. Ticket ${data.ticket_id}.`);
          addMsg('assistant', 'If you have a reason to add, type it here and it will reach our team.');
          startPolling(data.ticket_id);
        } else if (data.success && data.found === false) {
          addMsg('assistant', "I couldn't find an order with that ID. Please double-check it (you'll find it on your order confirmation or in your account history) and enter it again.");
        } else {
          addMsg('assistant', "Something went wrong opening the refund. Please try again, or say 'human agent' to reach support.");
        }
      } catch {
        addMsg('assistant', 'Connection error. Please try again in a moment.');
      }
      setLoading(false);
      return;
    }

    // If already handed off — forward message to Telegram
    if (handedOff && ticketId) {
      setLoading(false);
      // Send user's follow-up message to Telegram group
      try {
        await fetch(`${BASE}/public/chat`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            messages: [{ role:'user', content: msg }],
            ticket_id: ticketId,
            forward_only: true,
          }),
        });
      } catch {}
      return;
    }

    try {
      const history = msgs
        .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .concat({ role:'user', content: msg })
        .slice(-10);

      const res  = await fetch(`${BASE}/public/chat`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          messages: history,
          email: user?.email,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Clean up response — remove markdown bold **text**
        const clean = (data.data?.message || '').replace(/\*\*/g, '');
        addMsg('assistant', clean);

        if (data.handoff && data.ticket_id && !ticketId) {
          setTicketId(data.ticket_id);
          setHandedOff(true);
          addMsg('system', `🎫 Ticket ${data.ticket_id} opened — connecting you to an agent`);
          startPolling(data.ticket_id);
        }

        if (!open) setUnread(u => u+1);
      } else {
        addMsg('assistant', "I'm having trouble right now. Please contact us directly on Telegram @ZDFRXBOT");
      }
    } catch {
      addMsg('assistant', "Connection error. Please try again or message @ZDFRXBOT on Telegram.");
    }
    setLoading(false);
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setMsgs([{ role:'assistant', content:"Hi! I'm SwiftBot ⚡ How can I help you?" }]);
    setTicketId(null);
    setHandedOff(false);
    setLastReply(null);
    setInput('');
    clearState();
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed flex flex-col shadow-2xl overflow-hidden border border-border"
          style={{
            background: '#0B0E11',
            zIndex: 99999,
            borderRadius: '16px',
            // Mobile: near full width, sits above FAB
            bottom: '76px',
            // Align to the centered 1400px content edge on wide screens (matches FAB).
            right: 'max(12px, calc((100vw - 1400px) / 2 + 12px))',
            left: '12px',
            // Hug content; cap so it never gets lengthy or taller than the viewport
            maxHeight: 'min(70vh, 460px)',
            // Desktop: fixed width on right
            maxWidth: '340px',
            marginLeft: 'auto',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border shrink-0"
            style={{ background:'#1E2329' }}>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-yellow/10 border border-yellow/20 flex items-center justify-center text-[15px]">
                  {handedOff ? '👤' : '⚡'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green border-2 border-bg2" />
              </div>
              <div>
                <div className="font-bold text-[12px]">{handedOff ? 'Support Agent' : 'SwiftBot'}</div>
                <div className="text-[10px] text-muted">
                  {handedOff ? (lastReply ? '✅ Agent connected' : '⏳ Connecting...') : 'Online • AI Assistant'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {handedOff && (
                <button onClick={reset} className="text-[10px] text-muted hover:text-white cursor-pointer bg-transparent border-none">
                  New chat
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-bg3 text-muted hover:text-white cursor-pointer bg-transparent border-none">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {msgs.map((m, i) => {
              if (m.role === 'system') return (
                <div key={i} className="flex justify-center">
                  <span className="text-[10px] text-muted bg-bg3 px-3 py-1 rounded-full border border-border">{m.content}</span>
                </div>
              );
              const isUser  = m.role === 'user';
              const isAgent = m.role === 'agent';
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mr-2 mt-0.5 border
                      ${isAgent ? 'bg-blue-500/10 border-blue-500/20' : 'bg-yellow/10 border-yellow/20'}`}>
                      {isAgent ? '👤' : '⚡'}
                    </div>
                  )}
                  <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-[11.5px] leading-relaxed
                    ${isUser
                      ? 'bg-yellow text-black rounded-br-sm font-medium'
                      : isAgent
                        ? 'bg-blue-500/10 border border-blue-500/20 text-white rounded-bl-sm'
                        : 'bg-bg2 border border-border text-white rounded-bl-sm'}`}>
                    {isAgent && <div className="text-[9px] text-blue-400 font-semibold mb-1">Support Agent</div>}
                    {(m.content && typeof m.content === 'object' && m.content.type === 'image')
                      ? <img src={m.content.url} alt="screenshot"
                          className="rounded-lg max-w-full max-h-48 object-contain cursor-pointer"
                          onClick={() => window.open(m.content.url, '_blank')} />
                      : m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-yellow/10 border border-yellow/20 flex items-center justify-center text-[10px] shrink-0 mr-2 mt-0.5">⚡</div>
                <div className="bg-bg2 border border-border rounded-2xl rounded-bl-sm"><Dots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions - only on first message */}
          {msgs.length === 1 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK.map((q,i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-[10px] px-2.5 py-1 bg-bg2 border border-border rounded-full text-muted hover:border-yellow hover:text-yellow transition-colors cursor-pointer">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Request a refund — available when not already in a flow or handed off */}
          {!handedOff && !refundFlow && !fiatFlow && !loading && (
            <div className="px-3 pb-2 shrink-0">
              <button onClick={startRefund}
                className="text-[10px] px-2.5 py-1 bg-bg2 border border-border rounded-full text-muted hover:border-yellow hover:text-yellow transition-colors cursor-pointer">
                💸 Request a refund
              </button>
            </div>
          )}

          {/* Fiat: I have paid — appears once the operator shares payment details */}
          {fiatFlow?.orderId && (lastReply || msgs.some(m => m.role === 'agent')) && (
            <div className="px-3 pb-2 shrink-0">
              {!fiatPaid ? (
                <button onClick={markFiatPaid}
                  className="w-full py-2.5 bg-yellow text-black font-extrabold text-[12.5px] rounded-xl hover:bg-yellow-d transition-colors cursor-pointer border-none">
                  ✓ I have paid
                </button>
              ) : (
                <div className="w-full py-2 text-center text-[11px] text-green bg-green/10 border border-green/20 rounded-xl">
                  ✅ Payment submitted — under review
                </div>
              )}
            </div>
          )}

          {/* Active ticket badge */}
          {ticketId && (
            <div className="px-4 py-1.5 bg-blue-500/5 border-t border-blue-500/10 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-blue-400">Ticket: <strong>{ticketId}</strong></span>
              <span className="text-[9px] text-muted">Agent notified via Telegram</span>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2.5 shrink-0 border-t border-border" style={{ background:'#1E2329' }}>
            <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2 focus-within:border-yellow transition-colors">
              {/* Hidden file input for screenshots */}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                title="Send a screenshot"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-yellow cursor-pointer disabled:opacity-40 shrink-0 border-none bg-transparent text-[15px]">
                {uploading ? '⏳' : '📎'}
              </button>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
                placeholder={handedOff ? 'Message will be noted for agent...' : 'Ask SwiftBot...'}
                className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-muted" />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-yellow text-black cursor-pointer disabled:opacity-40 shrink-0 border-none text-[14px]">
                ↑
              </button>
            </div>
            <div className="text-[9px] text-muted text-center mt-1.5">
              Powered by Groq AI · <a href="/contacts" className="text-yellow hover:underline">Contact support</a>
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '16px',
          // Track the centered 1400px content edge on wide screens instead of the
          // viewport edge; stays 16px from the edge below 1400px (mobile/tablet).
          right: 'max(16px, calc((100vw - 1400px) / 2 + 16px))',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          zIndex: 99999,
          background: open ? '#2B3139' : '#F0B90B',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'transform 0.15s, background 0.15s',
        }}>
        <span style={{ fontSize: open ? '18px' : '22px', color: open ? 'white' : 'black' }}>
          {open ? '✕' : '💬'}
        </span>
        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#CF304A', color: 'white',
            fontSize: '10px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread}
          </div>
        )}
      </button>
    </>
  );
}