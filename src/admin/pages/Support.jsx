import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import Modal, { Field, BtnRow } from '../components/Modal';

const STATUS_COLOR = {
  open:        'text-yellow bg-yellow/10 border-yellow/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  resolved:    'text-green bg-green/10 border-green/20',
  closed:      'text-muted bg-bg3 border-border',
};

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState('');
  const [selected, setSel]    = useState(null);
  const [reply, setReply]     = useState('');
  const [saving, setSaving]   = useState(false);

  const load = () => {
    const p = { limit: 50 };
    if (filter) p.status = filter;
    adminCall('GET', 'admin/support/tickets', p).then(r => {
      if (r.success) { setTickets(r.data.tickets || []); setTotal(r.data.total || 0); }
    });
  };

  useEffect(() => { load(); }, [filter]);

  const updateTicket = async (id, status) => {
    await adminCall('PUT', 'admin/support/tickets/update', { id, status });
    load();
    if (selected?.id === id) setSel(prev => ({ ...prev, status }));
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    await adminCall('POST', 'admin/support/tickets/reply', { ticket_id: selected.id, message: reply });
    setSaving(false);
    setReply('');
    load();
  };

  const FILTERS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-white outline-none focus:border-yellow cursor-pointer">
          {FILTERS.map(f => <option key={f} value={f}>{f || 'All Tickets'}</option>)}
        </select>
        <button onClick={load} className="px-3 py-1.5 bg-yellow text-black text-[11px] font-bold rounded-lg cursor-pointer">Refresh</button>
        <span className="text-muted text-[11px] ml-auto">{total} tickets</span>
      </div>

      {/* Tickets list */}
      {tickets.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl py-12 text-center text-muted text-[11px]">
          No support tickets yet
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t, i) => (
            <div key={i} onClick={() => setSel(t)}
              className="bg-bg2 border border-border rounded-xl p-4 cursor-pointer hover:border-yellow/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-yellow text-[11px]">#{t.id}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_COLOR[t.status] || STATUS_COLOR.open}`}>
                    {t.status?.replace('_', ' ') || 'OPEN'}
                  </span>
                  <span className="text-white text-[11px] font-semibold">{t.subject}</span>
                </div>
                <span className="text-muted text-[10px] whitespace-nowrap shrink-0">
                  {new Date(t.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted">
                <span>👤 {t.name} — {t.email}</span>
                {t.order_id && <span>📋 {t.order_id}</span>}
              </div>
              <p className="text-muted text-[11px] mt-2 line-clamp-2 leading-relaxed">{t.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ticket detail modal */}
      {selected && (
        <Modal title={`Ticket #${selected.id} — ${selected.subject}`} onClose={() => setSel(null)} width="max-w-2xl">
          {/* Info */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
            {[
              ['Name', selected.name],
              ['Email', selected.email],
              ['Order ID', selected.order_id || '—'],
              ['Received', new Date(selected.created_at).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} className="bg-bg rounded-lg px-3 py-2">
                <div className="text-muted text-[10px] mb-0.5">{k}</div>
                <div className="text-white font-medium">{v}</div>
              </div>
            ))}
          </div>

          {/* Message */}
          <div className="bg-bg rounded-lg p-3 mb-4">
            <div className="text-muted text-[10px] mb-1.5">Message</div>
            <p className="text-white text-[11px] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
          </div>

          {/* Status actions */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
              <button key={s} onClick={() => updateTicket(selected.id, s)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded border cursor-pointer transition-colors
                  ${selected.status === s ? STATUS_COLOR[s] : 'bg-transparent text-muted border-border hover:border-yellow hover:text-yellow'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Reply */}
          <Field label="Reply to user">
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
              placeholder="Type your reply…"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-yellow resize-none" />
          </Field>
          <BtnRow onCancel={() => setSel(null)} onSave={sendReply} saving={saving} saveLabel="Send Reply" />
        </Modal>
      )}
    </div>
  );
}