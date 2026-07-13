import { useState, useEffect, useRef } from 'react';
import { adminCall } from '../api';

const blankForm = { id: null, from_currency_id: '', to_currency_id: '', rate: '', min_amount: '', max_amount: '', fee_percent: '', reserve: '', is_active: true };

export default function Routes() {
  const [routes, setRoutes]         = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch]         = useState('');
  const [form, setForm]             = useState(null);   // null = closed; object = editing/creating
  const formRef                     = useRef(null);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  const load = () => {
    adminCall('GET', 'admin/routes').then(r => r.success && setRoutes(r.data.routes || []));
    adminCall('GET', 'admin/currencies').then(r => r.success && setCurrencies(r.data.currencies || []));
  };
  useEffect(() => { load(); }, []);

  // When the editor opens (Add or Edit), scroll it into view — otherwise it appears
  // at the top of the page, off-screen from a row further down, and looks unresponsive.
  useEffect(() => {
    if (form) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [form]);

  const curById = id => currencies.find(c => String(c.id) === String(id));

  const openNew  = () => { setMsg(''); setForm({ ...blankForm }); };
  const openEdit = (r) => {
    setMsg('');
    setForm({
      id: r.id, from_currency_id: r.from_currency_id, to_currency_id: r.to_currency_id,
      rate: r.rate, min_amount: r.min_amount, max_amount: r.max_amount,
      fee_percent: r.fee_percent, reserve: r.reserve, is_active: r.is_active,
      _fromSymbol: r.from_symbol, _toSymbol: r.to_symbol,
    });
  };

  const save = async () => {
    if (!form.from_currency_id || !form.to_currency_id) { setMsg('Pick both currencies'); return; }
    if (form.from_currency_id === form.to_currency_id)   { setMsg('From and To must differ'); return; }
    if (!(parseFloat(form.rate) > 0))                    { setMsg('Rate must be greater than 0'); return; }
    setSaving(true); setMsg('');
    const payload = {
      from_currency_id: form.from_currency_id, to_currency_id: form.to_currency_id,
      rate: parseFloat(form.rate), min_amount: parseFloat(form.min_amount) || 0,
      max_amount: parseFloat(form.max_amount) || 0, fee_percent: parseFloat(form.fee_percent) || 0, reserve: parseFloat(form.reserve) || 0,
      is_active: !!form.is_active,
    };
    const r = form.id
      ? await adminCall('PUT',  'admin/route/update', { id: form.id, ...payload })
      : await adminCall('POST', 'admin/route/create', payload);
    setSaving(false);
    if (r.success) { setForm(null); load(); }
    else setMsg(r.error?.message || 'Save failed');
  };

  const del = async (r) => {
    if (!window.confirm(`Delete route ${r.from_symbol} → ${r.to_symbol}?`)) return;
    const res = await adminCall('DELETE', 'admin/route/delete', { id: r.id });
    if (res.success) load();
  };

  const filtered = routes.filter(r => !search ||
    [r.from_symbol, r.to_symbol, r.from_name, r.to_name].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  // Live preview values for the form
  const fSym = form ? (form._fromSymbol || curById(form.from_currency_id)?.symbol || 'FROM') : '';
  const tSym = form ? (form._toSymbol   || curById(form.to_currency_id)?.symbol   || 'TO')   : '';
  const rateNum = form ? parseFloat(form.rate) : 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by currency…"
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-white outline-none focus:border-yellow flex-1 min-w-40" />
        <button onClick={openNew}
          className="px-3 py-1.5 bg-yellow text-black text-[11px] font-bold rounded-lg cursor-pointer">
          + Add Route
        </button>
        <span className="text-muted text-[11px] ml-auto">{filtered.length} routes</span>
      </div>

      {/* Editor form */}
      {form && (
        <div ref={formRef} className="bg-bg2 border border-yellow/30 rounded-xl p-4 mb-4">
          <div className="text-[12px] font-bold text-yellow mb-3">{form.id ? 'Edit route' : 'New route'}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="From currency">
              <select disabled={!!form.id} value={form.from_currency_id}
                onChange={e => setForm(f => ({ ...f, from_currency_id: e.target.value }))}
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow disabled:opacity-60">
                <option value="">Select…</option>
                {currencies.map(c => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}
              </select>
            </Field>
            <Field label="To currency">
              <select disabled={!!form.id} value={form.to_currency_id}
                onChange={e => setForm(f => ({ ...f, to_currency_id: e.target.value }))}
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow disabled:opacity-60">
                <option value="">Select…</option>
                {currencies.map(c => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}
              </select>
            </Field>
            <Field label={`Rate (1 ${fSym} = ? ${tSym})`}>
              <input type="number" step="any" value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow" />
            </Field>
            <Field label="Min amount (from)">
              <input type="number" step="any" value={form.min_amount}
                onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow" />
            </Field>
            <Field label="Max amount (from)">
              <input type="number" step="any" value={form.max_amount}
                onChange={e => setForm(f => ({ ...f, max_amount: e.target.value }))}
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow" />
            </Field>
            <Field label="Fee percent (%)">
              <input type="number" step="any" value={form.fee_percent}
                onChange={e => setForm(f => ({ ...f, fee_percent: e.target.value }))}
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow" />
            </Field>
            <Field label="Reserve (in TO currency)">
              <input type="number" step="any" value={form.reserve}
                onChange={e => setForm(f => ({ ...f, reserve: e.target.value }))}
                placeholder="0 = no limit"
                className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-[11px] text-white outline-none focus:border-yellow" />
            </Field>
          </div>

          {/* Rate direction preview — the safety check */}
          {rateNum > 0 && fSym !== 'FROM' && tSym !== 'TO' && (
            <div className="mt-3 bg-bg border border-border rounded-lg px-3 py-2 text-[11px]">
              <div className="text-green font-bold">1 {fSym} = {rateNum.toLocaleString(undefined,{maximumFractionDigits:8})} {tSym}</div>
              <div className="text-muted mt-0.5">Example: a customer sends <b className="text-white">100 {fSym}</b> → receives <b className="text-white">{(100*rateNum).toLocaleString(undefined,{maximumFractionDigits:2})} {tSym}</b></div>
              <div className="text-muted mt-0.5 text-[10px]">⚠ Check this direction is correct before saving.</div>
            </div>
          )}

          <label className="flex items-center gap-2 mt-3 text-[11px] cursor-pointer">
            <input type="checkbox" checked={!!form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            <span className="text-white">Active (visible to customers)</span>
          </label>

          {msg && <div className="text-red text-[11px] mt-2">{msg}</div>}

          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 bg-yellow text-black text-[11px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
              {saving ? 'Saving…' : (form.id ? 'Save changes' : 'Create route')}
            </button>
            <button onClick={() => setForm(null)}
              className="px-4 py-1.5 bg-bg3 text-muted text-[11px] rounded-lg cursor-pointer hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Routes table */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['From', 'To', 'Rate', 'Min', 'Max', 'Fee %', 'Status', ''].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-muted">No routes yet — add one.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap"><b className="text-white">{r.from_symbol}</b> <span className="text-muted">{r.from_name}</span></td>
                  <td className="py-2 px-3 whitespace-nowrap"><b className="text-white">{r.to_symbol}</b> <span className="text-muted">{r.to_name}</span></td>
                  <td className="py-2 px-3 whitespace-nowrap text-green">{parseFloat(r.rate).toLocaleString(undefined,{maximumFractionDigits:8})}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{parseFloat(r.min_amount)||'—'}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{parseFloat(r.max_amount)||'—'}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{parseFloat(r.fee_percent)||0}%</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${r.is_active ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
                      {r.is_active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-right">
                    <button onClick={() => openEdit(r)} className="text-yellow hover:underline cursor-pointer mr-3">Edit</button>
                    <button onClick={() => del(r)} className="text-red hover:underline cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] text-muted block mb-1">{label}</label>
      {children}
    </div>
  );
}