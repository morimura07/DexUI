import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import Modal, { Field, Input, BtnRow } from '../components/Modal';

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    adminCall('GET', 'admin/wallets').then(r => r.success && setWallets(r.data.wallets));
  };
  useEffect(() => { load(); }, []);

  const newWallet = () => setEditing({ network: '', xml_codes: '', address: '', label: '', is_active: true });

  const save = async () => {
    setSaving(true);
    await adminCall('PUT', 'admin/wallets/update', editing);
    setSaving(false); setEditing(null); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-[11px]">Manage crypto wallet addresses used for receiving payments</p>
        <button onClick={newWallet}
          className="px-3 py-1.5 bg-yellow text-black text-[11px] font-bold rounded-lg cursor-pointer">
          + Add Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {wallets.map((w, i) => (
          <div key={i} className={`bg-bg2 border rounded-xl p-4 ${w.is_active ? 'border-yellow/20' : 'border-border opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-[12px]">{w.label}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg3 text-muted">{w.network}</span>
                  <span className={`text-[10px] font-semibold ${w.is_active ? 'text-green' : 'text-muted'}`}>
                    {w.is_active ? '● Active' : '● Inactive'}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditing({ ...w })}
                className="px-2 py-0.5 bg-yellow/10 text-yellow text-[10px] rounded border border-yellow/20 cursor-pointer hover:bg-yellow/20">
                Edit
              </button>
            </div>
            <div className="font-mono text-[10px] text-yellow break-all mb-2 bg-bg rounded px-2 py-1.5">{w.address}</div>
            <div className="text-[10px] text-muted">Currencies: <span className="text-white">{w.xml_codes}</span></div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Wallet' : 'Add Wallet'} onClose={() => setEditing(null)}>
          {[
            { label: 'Network (e.g. TRC20, ERC20, BTC)', key: 'network' },
            { label: 'XML Codes (comma separated, e.g. USDTTRC20,TRX)', key: 'xml_codes' },
            { label: 'Wallet Address', key: 'address' },
            { label: 'Label (display name)', key: 'label' },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <Input value={editing[f.key] || ''} onChange={e => setEditing(v => ({ ...v, [f.key]: e.target.value }))} />
            </Field>
          ))}
          <label className="flex items-center gap-2 text-[11px] cursor-pointer mt-1">
            <input type="checkbox" checked={editing.is_active}
              onChange={e => setEditing(v => ({ ...v, is_active: e.target.checked }))}
              className="accent-yellow w-3.5 h-3.5" />
            Active (wallet will be used for new orders)
          </label>
          <BtnRow onCancel={() => setEditing(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}