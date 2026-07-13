import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { adminCall } from '../api';
import Badge from '../components/Badge';
import Modal, { Field, Input, Select, BtnRow } from '../components/Modal';
import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';

const STATUSES = ['', 'WAIT_PAYMENT', 'UNDER_REVIEW', 'PAYMENT_RECEIVED', 'PROCESSING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'AML_HOLD'];

export default function Orders() {
  const t = useT();
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
    if (!window.confirm(t('adminOrders.confirmReceived', { orderId: o.order_id }))) return;
    await adminCall('PUT', 'admin/orders/update', { order_id: o.order_id, status: 'COMPLETED' });
    load();
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder={t('adminOrders.searchPlaceholder')}
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-fg outline-none focus:border-brand flex-1 min-w-40" />
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-fg outline-none focus:border-brand cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s || t('adminOrders.allStatus')}</option>)}
        </select>
        <button onClick={load} className="px-3 py-1.5 bg-brand text-white text-[11px] font-bold rounded-lg cursor-pointer">
          {t('adminOrders.search')}
        </button>
        <span className="text-muted text-[11px] self-center ml-auto">{t('adminOrders.count', { count: total })}</span>
      </div>

      {/* Table */}
      <Reveal variant="fadeUp" className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['orderId', 'user', 'send', 'receive', 'wallet', 'status', 'time', ''].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h ? t(`adminOrders.col.${h}`) : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-muted">{t('adminOrders.noOrders')}</td></tr>
              ) : orders.map((o, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 text-brand-fg font-bold whitespace-nowrap">{o.order_id}</td>
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
                          className="flex items-center gap-1 px-2 py-0.5 bg-green/10 text-green text-[10px] rounded border border-green/20 hover:bg-green/20 cursor-pointer whitespace-nowrap">
                          <Check className="h-3 w-3" /> {t('adminOrders.confirm')}
                        </button>
                      )}
                      <button onClick={() => openEdit(o)}
                        className="px-2 py-0.5 bg-brand/10 text-brand-fg text-[10px] rounded border border-brand/20 hover:bg-brand/20 cursor-pointer">
                        {t('adminOrders.edit')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* Edit modal */}
      {selected && (
        <Modal title={t('adminOrders.editOrder', { orderId: selected.order_id })} onClose={() => setSel(null)}>
          <div className="bg-bg rounded-lg p-3 mb-4 text-[11px] text-muted space-y-1">
            <div>{t('adminOrders.col.send')}: <span className="text-fg">{parseFloat(selected.from_amount||0).toFixed(2)} {selected.from_symbol}</span></div>
            <div>{t('adminOrders.col.receive')}: <span className="text-green">{parseFloat(selected.to_amount||0).toFixed(2)} {selected.to_symbol}</span></div>
            <div>{t('adminOrders.destination')}: <span className="text-fg font-mono text-[10px]">{selected.destination_address}</span></div>
            <div>{t('adminOrders.email')}: <span className="text-fg">{selected.email}</span></div>
          </div>
          <Field label={t('adminOrders.paymentAddress')}>
            <Input value={form.payment_address} onChange={e => setForm(f => ({...f, payment_address: e.target.value}))} placeholder={t('adminOrders.walletPlaceholder')} />
          </Field>
          <Field label={t('adminOrders.statusLabel')}>
            <Select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
              {STATUSES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('adminOrders.txHashIn')}>
              <Input value={form.tx_hash_in} onChange={e => setForm(f => ({...f, tx_hash_in: e.target.value}))} placeholder="0x…" />
            </Field>
            <Field label={t('adminOrders.txHashOut')}>
              <Input value={form.tx_hash_out} onChange={e => setForm(f => ({...f, tx_hash_out: e.target.value}))} placeholder="0x…" />
            </Field>
          </div>
          <BtnRow onCancel={() => setSel(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}