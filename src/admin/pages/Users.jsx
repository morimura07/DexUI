import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { adminCall } from '../api';
import Badge from '../components/Badge';
import Modal, { Field, Select, BtnRow } from '../components/Modal';
import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function Users() {
  const t = useT();
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSel]  = useState(null);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    const p = { limit: 50 };
    if (search) p.search = search;
    adminCall('GET', 'admin/users', p).then(r => {
      if (r.success) { setUsers(r.data.users); setTotal(r.data.total); }
    });
  };

  useEffect(() => { load(); }, []);

  const openEdit = u => { setSel(u); setForm({ role: u.role }); };

  const save = async () => {
    setSaving(true);
    await adminCall('PUT', 'admin/users/update', { user_id: selected.id, role: form.role });
    setSaving(false); setSel(null); load();
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder={t('adminUsers.searchPlaceholder')}
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-fg outline-none focus:border-brand flex-1" />
        <button onClick={load} className="px-3 py-1.5 bg-brand text-white text-[11px] font-bold rounded-lg cursor-pointer">{t('adminUsers.search')}</button>
        <span className="text-muted text-[11px] self-center ml-auto">{t('adminUsers.count', { count: total })}</span>
      </div>

      <Reveal variant="fadeUp" className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['id', 'email', 'name', 'role', 'verified', 'orders', 'joined', ''].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h ? t(`adminUsers.col.${h}`) : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-muted">{t('adminUsers.noUsers')}</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 text-muted">{u.id}</td>
                  <td className="py-2 px-3 text-fg">{u.email}</td>
                  <td className="py-2 px-3 text-muted">{u.name || '—'}</td>
                  <td className="py-2 px-3"><Badge label={u.role} /></td>
                  <td className="py-2 px-3">{u.email_verified ? <span className="flex items-center gap-1 text-green text-[10px]"><Check className="h-3 w-3" /> {t('adminUsers.yes')}</span> : <span className="flex items-center gap-1 text-muted text-[10px]"><X className="h-3 w-3" /> {t('adminUsers.no')}</span>}</td>
                  <td className="py-2 px-3 text-muted">{u.order_count || 0}</td>
                  <td className="py-2 px-3 text-muted whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => openEdit(u)}
                      className="px-2 py-0.5 bg-brand/10 text-brand-fg text-[10px] rounded border border-brand/20 hover:bg-brand/20 cursor-pointer">
                      {t('adminUsers.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {selected && (
        <Modal title={t('adminUsers.editUser', { email: selected.email })} onClose={() => setSel(null)} width="max-w-sm">
          <Field label={t('adminUsers.roleLabel')}>
            <Select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </Select>
          </Field>
          <BtnRow onCancel={() => setSel(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}