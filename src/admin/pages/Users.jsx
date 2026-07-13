import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import Badge from '../components/Badge';
import Modal, { Field, Select, BtnRow } from '../components/Modal';

export default function Users() {
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
          placeholder="Search by email or name…"
          className="bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-white outline-none focus:border-yellow flex-1" />
        <button onClick={load} className="px-3 py-1.5 bg-yellow text-black text-[11px] font-bold rounded-lg cursor-pointer">Search</button>
        <span className="text-muted text-[11px] self-center ml-auto">{total} users</span>
      </div>

      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['ID', 'Email', 'Name', 'Role', 'Verified', 'Orders', 'Joined', ''].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-muted">No users found</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 text-muted">{u.id}</td>
                  <td className="py-2 px-3 text-white">{u.email}</td>
                  <td className="py-2 px-3 text-muted">{u.name || '—'}</td>
                  <td className="py-2 px-3"><Badge label={u.role} /></td>
                  <td className="py-2 px-3">{u.email_verified ? <span className="text-green text-[10px]">✓ Yes</span> : <span className="text-muted text-[10px]">✗ No</span>}</td>
                  <td className="py-2 px-3 text-muted">{u.order_count || 0}</td>
                  <td className="py-2 px-3 text-muted whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => openEdit(u)}
                      className="px-2 py-0.5 bg-yellow/10 text-yellow text-[10px] rounded border border-yellow/20 hover:bg-yellow/20 cursor-pointer">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <Modal title={`Edit: ${selected.email}`} onClose={() => setSel(null)} width="max-w-sm">
          <Field label="Role">
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