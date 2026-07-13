import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import Modal, { Field, Input, BtnRow } from '../components/Modal';
import { RevealGroup, RevealItem } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function Wallets() {
  const t = useT();
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
        <p className="text-muted text-[11px]">{t('adminWallets.manageNote')}</p>
        <button onClick={newWallet}
          className="px-3 py-1.5 bg-brand text-white text-[11px] font-bold rounded-lg cursor-pointer">
          + {t('adminWallets.addWallet')}
        </button>
      </div>

      <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {wallets.map((w, i) => (
          <RevealItem key={i} variant="scaleIn" className={`bg-bg2 border rounded-xl p-4 ${w.is_active ? 'border-brand/20' : 'border-border opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-[12px]">{w.label}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg3 text-muted">{w.network}</span>
                  <span className={`text-[10px] font-semibold ${w.is_active ? 'text-green' : 'text-muted'}`}>
                    ● {w.is_active ? t('adminWallets.active') : t('adminWallets.inactive')}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditing({ ...w })}
                className="px-2 py-0.5 bg-brand/10 text-brand-fg text-[10px] rounded border border-brand/20 cursor-pointer hover:bg-brand/20">
                {t('adminWallets.edit')}
              </button>
            </div>
            <div className="font-mono text-[10px] text-brand-fg break-all mb-2 bg-bg rounded px-2 py-1.5">{w.address}</div>
            <div className="text-[10px] text-muted">{t('adminWallets.currencies')} <span className="text-fg">{w.xml_codes}</span></div>
          </RevealItem>
        ))}
      </RevealGroup>

      {editing && (
        <Modal title={editing.id ? t('adminWallets.editWallet') : t('adminWallets.addWallet')} onClose={() => setEditing(null)}>
          {[
            { label: t('adminWallets.fieldNetwork'), key: 'network' },
            { label: t('adminWallets.fieldXmlCodes'), key: 'xml_codes' },
            { label: t('adminWallets.fieldAddress'), key: 'address' },
            { label: t('adminWallets.fieldLabel'), key: 'label' },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <Input value={editing[f.key] || ''} onChange={e => setEditing(v => ({ ...v, [f.key]: e.target.value }))} />
            </Field>
          ))}
          <label className="flex items-center gap-2 text-[11px] cursor-pointer mt-1">
            <input type="checkbox" checked={editing.is_active}
              onChange={e => setEditing(v => ({ ...v, is_active: e.target.checked }))}
              className="accent-brand w-3.5 h-3.5" />
            {t('adminWallets.activeCheckbox')}
          </label>
          <BtnRow onCancel={() => setEditing(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}