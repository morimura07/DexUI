import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import Badge from '../components/Badge';
import Modal, { Field, Input, Select, BtnRow } from '../components/Modal';

const STATUSES = ['', 'WAIT_PAYMENT', 'UNDER_REVIEW', 'PAYMENT_RECEIVED', 'PROCESSING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'AML_HOLD'];

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [status, setStatus]   = useState('');
  const [search, setSearch]   = useState('');
  const [selected, setSel]    = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  const load = () => {
    const p = { limit: 50, offset: 0 };
    if (status) p.status = status;
    if (search) p.search = search;
    adminCall('GET', 'admin/orders', p).then(r => {
      if (r.success) { setOrders(r.data.orders); setTotal(r.data.total); }
    });
  };

  useEffect(() => { load(); }, [status]);

  const openEdit = o => { setSel(o); setForm({ payment_address: o.payment_address||'', status: o.status, tx_hash_in: o.tx_hash_in||'', tx_hash_out: o.tx_hash_out||'' }); };

  const save = async () => {
    setSaving(true);
    await adminCall('PUT', 'admin/orders/update', { order_id: selected.order_id, ...form });
    setSaving(false); setSel(null); load();
  };

  // Quick "funds received → release" for the review queue
  const confirmReceived = async (o) => {
    if (!window.confirm(`Confirm funds received for ${o.order_id} and release the crypto? This marks the order COMPLETED.`)) return;
    await adminCall('PUT', 'admin/orders/update', { order_id: o.order_id, status: 'COMPLETED' });
    load();
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search order ID or email…"
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-white outline-none focus:border-yellow flex-1 min-w-40" />
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-white outline-none focus:border-yellow cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <button onClick={load} className="px-3 py-1.5 bg-yellow text-black text-[11px] font-bold rounded-lg cursor-pointer">
          Search
        </button>
        <span className="text-muted text-[11px] self-center ml-auto">{total} orders</span>
      </div>

      {/* Table */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['Order ID', 'User', 'Send', 'Receive', 'Wallet', 'Status', 'Time', ''].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-muted">No orders found</td></tr>
              ) : orders.map((o, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 text-yellow font-bold whitespace-nowrap">{o.order_id}</td>
                  <td className="py-2 px-3 text-muted max-w-[100px] truncate">{o.user_email || '—'}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{parseFloat(o.from_amount||0).toFixed(2)} <span className="text-muted">{o.from_symbol}</span></td>
                  <td className="py-2 px-3 text-green whitespace-nowrap">{parseFloat(o.to_amount||0).toFixed(2)} <span className="text-muted">{o.to_symbol}</span></td>
                  <td className="py-2 px-3 font-mono text-[10px] text-muted max-w-[100px] truncate">{o.payment_address}</td>
                  <td className="py-2 px-3"><Badge label={o.status} /></td>
                  <td className="py-2 px-3 text-muted whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      {['UNDER_REVIEW','PAYMENT_RECEIVED'].includes(o.status) && (
                        <button onClick={() => confirmReceived(o)}
                          className="px-2 py-0.5 bg-green/10 text-green text-[10px] rounded border border-green/20 hover:bg-green/20 cursor-pointer whitespace-nowrap">
                          ✓ Confirm
                        </button>
                      )}
                      <button onClick={() => openEdit(o)}
                        className="px-2 py-0.5 bg-yellow/10 text-yellow text-[10px] rounded border border-yellow/20 hover:bg-yellow/20 cursor-pointer">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {selected && (
        <Modal title={`Edit Order ${selected.order_id}`} onClose={() => setSel(null)}>
          <div className="bg-bg rounded-lg p-3 mb-4 text-[11px] text-muted space-y-1">
            <div>Send: <span className="text-white">{parseFloat(selected.from_amount||0).toFixed(2)} {selected.from_symbol}</span></div>
            <div>Receive: <span className="text-green">{parseFloat(selected.to_amount||0).toFixed(2)} {selected.to_symbol}</span></div>
            <div>Destination: <span className="text-white font-mono text-[10px]">{selected.destination_address}</span></div>
            <div>Email: <span className="text-white">{selected.email}</span></div>
          </div>
          <Field label="Payment Address">
            <Input value={form.payment_address} onChange={e => setForm(f => ({...f, payment_address: e.target.value}))} placeholder="Wallet address…" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
              {STATUSES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="TX Hash In (received)">
              <Input value={form.tx_hash_in} onChange={e => setForm(f => ({...f, tx_hash_in: e.target.value}))} placeholder="0x…" />
            </Field>
            <Field label="TX Hash Out (sent)">
              <Input value={form.tx_hash_out} onChange={e => setForm(f => ({...f, tx_hash_out: e.target.value}))} placeholder="0x…" />
            </Field>
          </div>
          <BtnRow onCancel={() => setSel(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}