import { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

import { API_BASE as BASE } from '../config';
const adminCall = (method, endpoint, data=null) => {
  const token = localStorage.getItem('ss_admin_token') || localStorage.getItem('ss_token');
  const headers = { 'Content-Type':'application/json', 'Accept':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const config = { method, headers };
  if (data && method !== 'GET') config.body = JSON.stringify(data);
  const url = data && method === 'GET'
    ? `${BASE}/${endpoint}?${new URLSearchParams(data)}`
    : `${BASE}/${endpoint}`;
  return fetch(url, config).then(r=>r.json()).catch(e=>({success:false,error:{message:e.message}}));
};

const badgeColors = {
  WAIT_PAYMENT:'bg-yellow/20 text-yellow', PAYMENT_RECEIVED:'bg-blue-500/20 text-blue-400',
  PROCESSING:'bg-blue-500/20 text-blue-400', COMPLETED:'bg-green/20 text-green',
  EXPIRED:'bg-red/20 text-red', CANCELLED:'bg-red/20 text-red', AML_HOLD:'bg-orange-400/20 text-orange-400',
};
const Badge = ({s}) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColors[s]||'bg-bg3 text-muted'}`}>{s?.replace(/_/g,' ')}</span>;

// ── LOGIN ──
function AdminLogin({ onLogin }) {
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);

  const handleLogin = async () => {
    setLoad(true); setError('');
    const res = await apiCall('POST', 'admin/auth/sign-in', { email, password: pass });
    setLoad(false);
    if (res.success) {
      localStorage.setItem('ss_admin_token', res.data.token);
      onLogin(res.data.user);
    } else setError(res.error?.message || 'Invalid credentials');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0B0E11'}}>
      <div className="bg-bg2 border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-yellow text-2xl font-extrabold mb-1">⚡ SwiftSwap</div>
          <div className="text-muted text-sm">Admin Panel</div>
        </div>
        <div className="flex flex-col gap-3">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="Admin email" onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            className="bg-bg border border-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-yellow transition-colors" />
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
            placeholder="Password" onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            className="bg-bg border border-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-yellow transition-colors" />
          {error && <div className="text-red text-xs text-center">{error}</div>}
          <button onClick={handleLogin} disabled={loading}
            className="py-3 bg-yellow text-black font-bold rounded-lg hover:bg-yellow-d transition-colors cursor-pointer text-sm">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { adminCall('GET','admin/stats').then(r=>r.success&&setData(r.data)); }, []);

  if (!data) return <div className="text-muted text-sm animate-pulse p-6">Loading dashboard…</div>;
  const { stats, recent_orders } = data;
  const statCards = [
    { label:'Total Orders',     val:stats.total_orders,     color:'text-yellow', icon:'📋' },
    { label:'Pending Payment',  val:stats.pending_orders,   color:'text-yellow', icon:'⏳' },
    { label:'Completed',        val:stats.completed_orders, color:'text-green',  icon:'✅' },
    { label:'Total Users',      val:stats.total_users,      color:'text-blue-400',icon:'👥' },
    { label:"Today's Orders",   val:stats.today_orders,     color:'text-yellow', icon:'📅' },
    { label:'Total Volume',     val:`$${parseFloat(stats.total_volume||0).toLocaleString()}`, color:'text-green', icon:'💰' },
  ];
  return (
    <div>
      <h2 className="text-[18px] font-extrabold mb-5">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map(c=>(
          <div key={c.label} className="bg-bg2 border border-border rounded-xl p-4">
            <div className="text-xl mb-2">{c.icon}</div>
            <div className={`text-[22px] font-extrabold ${c.color}`}>{c.val}</div>
            <div className="text-[11px] text-muted mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-[14px] font-bold mb-3">Recent Orders</h3>
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-[12px]">
          <thead><tr className="border-b border-border">
            {['Order ID','User','From','To','Status','Date'].map(h=>(
              <th key={h} className="text-muted font-medium py-2.5 px-3 text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {recent_orders.map((o,i)=>(
              <tr key={i} className="border-b border-border hover:bg-bg3 transition-colors">
                <td className="py-2.5 px-3 text-yellow font-bold">{o.order_id}</td>
                <td className="py-2.5 px-3 text-muted">{o.user_email||'Guest'}</td>
                <td className="py-2.5 px-3">{parseFloat(o.from_amount||0).toFixed(2)} {o.from_symbol}</td>
                <td className="py-2.5 px-3 text-green">{parseFloat(o.to_amount||0).toFixed(2)} {o.to_symbol}</td>
                <td className="py-2.5 px-3"><Badge s={o.status}/></td>
                <td className="py-2.5 px-3 text-muted">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ORDERS ──
function Orders() {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [status, setStatus]   = useState('');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpd]    = useState(false);
  const [editAddr, setEditAddr] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTxIn, setEditTxIn] = useState('');
  const [editTxOut, setEditTxOut] = useState('');

  const load = () => {
    const params = { limit:50, offset:0 };
    if (status) params.status = status;
    if (search) params.search = search;
    adminCall('GET','admin/orders',params).then(r=>{
      if(r.success){setOrders(r.data.orders);setTotal(r.data.total);}
    });
  };
  useEffect(() => { load(); }, [status]);

  const openOrder = (o) => {
    setSelected(o);
    setEditAddr(o.payment_address||'');
    setEditStatus(o.status||'');
    setEditTxIn(o.tx_hash_in||'');
    setEditTxOut(o.tx_hash_out||'');
  };

  const saveOrder = async () => {
    setUpd(true);
    await adminCall('PUT','admin/orders/update',{
      order_id: selected.order_id,
      payment_address: editAddr,
      status: editStatus,
      tx_hash_in: editTxIn,
      tx_hash_out: editTxOut,
    });
    setUpd(false); setSelected(null); load();
  };

  const STATUSES = ['','WAIT_PAYMENT','PAYMENT_RECEIVED','PROCESSING','COMPLETED','EXPIRED','CANCELLED','AML_HOLD'];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-[18px] font-extrabold">Orders <span className="text-muted text-sm font-normal">({total})</span></h2>
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
            placeholder="Search order ID or email…"
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:border-yellow w-48" />
          <select value={status} onChange={e=>setStatus(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:border-yellow cursor-pointer">
            {STATUSES.map(s=><option key={s} value={s}>{s||'All Status'}</option>)}
          </select>
          <button onClick={load} className="px-3 py-1.5 bg-yellow text-black text-[12px] font-bold rounded-lg cursor-pointer">Refresh</button>
        </div>
      </div>

      <div className="bg-bg2 border border-border rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead><tr className="border-b border-border">
            {['Order ID','User','Send','Receive','Payment Address','Status','Expires','Action'].map(h=>(
              <th key={h} className="text-muted font-medium py-2.5 px-3 text-left whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {orders.map((o,i)=>(
              <tr key={i} className="border-b border-border hover:bg-bg3 transition-colors">
                <td className="py-2.5 px-3 text-yellow font-bold whitespace-nowrap">{o.order_id}</td>
                <td className="py-2.5 px-3 text-muted text-[11px]">{o.user_email||'—'}</td>
                <td className="py-2.5 px-3 whitespace-nowrap">{parseFloat(o.from_amount||0).toFixed(2)} <span className="text-muted">{o.from_symbol}</span></td>
                <td className="py-2.5 px-3 text-green whitespace-nowrap">{parseFloat(o.to_amount||0).toFixed(2)} <span className="text-muted">{o.to_symbol}</span></td>
                <td className="py-2.5 px-3 font-mono text-[10px] text-muted max-w-[120px] truncate">{o.payment_address}</td>
                <td className="py-2.5 px-3"><Badge s={o.status}/></td>
                <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap">
                  {o.expires_at ? new Date(o.expires_at).toLocaleTimeString() : '—'}
                </td>
                <td className="py-2.5 px-3">
                  <button onClick={()=>openOrder(o)}
                    className="px-2.5 py-1 bg-yellow/10 text-yellow text-[11px] rounded-lg hover:bg-yellow/20 cursor-pointer border border-yellow/30">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Order Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg2 border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-[15px]">Edit Order <span className="text-yellow">{selected.order_id}</span></h3>
              <button onClick={()=>setSelected(null)} className="text-muted hover:text-white cursor-pointer text-lg bg-transparent border-none">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] text-muted mb-1.5">Order Details</div>
                <div className="bg-bg rounded-lg p-3 text-[12px] text-muted">
                  <div>Send: <span className="text-white">{parseFloat(selected.from_amount||0).toFixed(2)} {selected.from_symbol}</span></div>
                  <div>Receive: <span className="text-green">{parseFloat(selected.to_amount||0).toFixed(2)} {selected.to_symbol}</span></div>
                  <div>Destination: <span className="text-white font-mono text-[10px]">{selected.destination_address}</span></div>
                  <div>Email: <span className="text-white">{selected.email}</span></div>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted mb-1.5 block">Payment Address (wallet to receive funds)</label>
                <input value={editAddr} onChange={e=>setEditAddr(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-yellow font-mono" />
              </div>
              <div>
                <label className="text-[11px] text-muted mb-1.5 block">Status</label>
                <select value={editStatus} onChange={e=>setEditStatus(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-yellow cursor-pointer">
                  {['WAIT_PAYMENT','PAYMENT_RECEIVED','PROCESSING','COMPLETED','EXPIRED','CANCELLED','AML_HOLD'].map(s=>(
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted mb-1.5 block">TX Hash In (received)</label>
                  <input value={editTxIn} onChange={e=>setEditTxIn(e.target.value)}
                    placeholder="0x…"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[11px] text-white outline-none focus:border-yellow font-mono" />
                </div>
                <div>
                  <label className="text-[11px] text-muted mb-1.5 block">TX Hash Out (sent)</label>
                  <input value={editTxOut} onChange={e=>setEditTxOut(e.target.value)}
                    placeholder="0x…"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[11px] text-white outline-none focus:border-yellow font-mono" />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={()=>setSelected(null)} className="flex-1 py-2.5 border border-border text-muted rounded-lg cursor-pointer bg-transparent hover:border-red hover:text-red transition-colors text-[12px]">Cancel</button>
                <button onClick={saveOrder} disabled={updating}
                  className="flex-1 py-2.5 bg-yellow text-black font-bold rounded-lg cursor-pointer text-[12px] hover:bg-yellow-d transition-colors">
                  {updating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── USERS ──
function Users() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSel]  = useState(null);
  const [editRole, setRole] = useState('user');

  const load = () => {
    const p = {limit:50}; if(search) p.search=search;
    adminCall('GET','admin/users',p).then(r=>{if(r.success){setUsers(r.data.users);setTotal(r.data.total);}});
  };
  useEffect(() => { load(); }, []);

  const saveUser = async () => {
    await adminCall('PUT','admin/users/update',{user_id:selected.id,role:editRole});
    setSel(null); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-[18px] font-extrabold">Users <span className="text-muted text-sm font-normal">({total})</span></h2>
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
            placeholder="Search by email or name…"
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:border-yellow w-52" />
          <button onClick={load} className="px-3 py-1.5 bg-yellow text-black text-[12px] font-bold rounded-lg cursor-pointer">Search</button>
        </div>
      </div>
      <div className="bg-bg2 border border-border rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead><tr className="border-b border-border">
            {['ID','Email','Name','Role','Verified','Orders','Joined','Action'].map(h=>(
              <th key={h} className="text-muted font-medium py-2.5 px-3 text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={i} className="border-b border-border hover:bg-bg3 transition-colors">
                <td className="py-2.5 px-3 text-muted">{u.id}</td>
                <td className="py-2.5 px-3 text-white">{u.email}</td>
                <td className="py-2.5 px-3 text-muted">{u.name||'—'}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role==='admin'?'bg-yellow/20 text-yellow':'bg-bg3 text-muted'}`}>{u.role}</span>
                </td>
                <td className="py-2.5 px-3">{u.email_verified?'✅':'❌'}</td>
                <td className="py-2.5 px-3 text-muted">{u.order_count||0}</td>
                <td className="py-2.5 px-3 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="py-2.5 px-3">
                  <button onClick={()=>{setSel(u);setRole(u.role);}}
                    className="px-2.5 py-1 bg-yellow/10 text-yellow text-[11px] rounded-lg hover:bg-yellow/20 cursor-pointer border border-yellow/30">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg2 border border-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-extrabold mb-4">Edit User: <span className="text-yellow">{selected.email}</span></h3>
            <div className="mb-4">
              <label className="text-[11px] text-muted mb-1.5 block">Role</label>
              <select value={editRole} onChange={e=>setRole(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-yellow cursor-pointer">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setSel(null)} className="flex-1 py-2.5 border border-border text-muted rounded-lg cursor-pointer bg-transparent text-[12px]">Cancel</button>
              <button onClick={saveUser} className="flex-1 py-2.5 bg-yellow text-black font-bold rounded-lg cursor-pointer text-[12px]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WALLETS ──
function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    adminCall('GET','admin/wallets').then(r => r.success && setWallets(r.data.wallets));
  };
  useEffect(() => { load(); }, []);

  const newWallet = () => setEditing({network:'',xml_codes:'',address:'',label:'',is_active:true});

  const save = async () => {
    setSaving(true);
    await adminCall('PUT','admin/wallets/update',editing);
    setSaving(false); setEditing(null); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-extrabold">Payment Wallets</h2>
        <button onClick={newWallet} className="px-4 py-2 bg-yellow text-black text-[12px] font-bold rounded-lg cursor-pointer">+ Add Wallet</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {wallets.map((w,i)=>(
          <div key={i} className={`bg-bg2 border rounded-xl p-4 ${w.is_active?'border-yellow/30':'border-border opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[13px]">{w.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-bg3 text-muted">{w.network}</span>
                {w.is_active ? <span className="text-[10px] text-green">● Active</span> : <span className="text-[10px] text-muted">● Inactive</span>}
              </div>
              <button onClick={()=>setEditing({...w})}
                className="px-3 py-1 bg-yellow/10 text-yellow text-[11px] rounded-lg cursor-pointer border border-yellow/30">Edit</button>
            </div>
            <div className="font-mono text-[11px] text-muted break-all mb-1">{w.address}</div>
            <div className="text-[10px] text-muted">Currencies: <span className="text-white">{w.xml_codes}</span></div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg2 border border-border rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-extrabold mb-4">{editing.id ? 'Edit Wallet' : 'Add Wallet'}</h3>
            <div className="flex flex-col gap-3">
              {[
                {label:'Network (e.g. TRC20)',key:'network'},
                {label:'XML Codes (comma separated, e.g. USDTTRC20,TRX)',key:'xml_codes'},
                {label:'Wallet Address',key:'address'},
                {label:'Label',key:'label'},
              ].map(f=>(
                <div key={f.key}>
                  <label className="text-[11px] text-muted mb-1.5 block">{f.label}</label>
                  <input value={editing[f.key]||''} onChange={e=>setEditing(v=>({...v,[f.key]:e.target.value}))}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[12px] text-white outline-none focus:border-yellow" />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                <input type="checkbox" checked={editing.is_active} onChange={e=>setEditing(v=>({...v,is_active:e.target.checked}))} className="accent-yellow" />
                Active
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setEditing(null)} className="flex-1 py-2.5 border border-border text-muted rounded-lg cursor-pointer bg-transparent text-[12px]">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-yellow text-black font-bold rounded-lg cursor-pointer text-[12px]">
                {saving?'Saving…':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ADMIN PANEL ──
export default function AdminPanel() {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('ss_admin_token') || localStorage.getItem('ss_token');
    return token ? { email: 'Admin' } : null;
  });
  const [tab, setTab]       = useState('dashboard');
  const [sidebarOpen, setSidebar] = useState(false);

  const logout = () => { localStorage.removeItem('ss_admin_token'); localStorage.removeItem('ss_token'); setAdmin(null); };

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const TABS = [
    { key:'dashboard', label:'📊 Dashboard' },
    { key:'orders',    label:'📋 Orders' },
    { key:'users',     label:'👥 Users' },
    { key:'wallets',   label:'💳 Wallets' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{background:'#0B0E11'}}>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-bg2 border-b border-border">
        <div>
          <div className="text-yellow font-extrabold text-[14px]">⚡ SwiftSwap</div>
          <div className="text-muted text-[10px]">Admin Panel</div>
        </div>
        <button onClick={()=>setSidebar(!sidebarOpen)}
          className="w-9 h-9 bg-bg3 border border-border rounded-lg flex items-center justify-center cursor-pointer text-white text-lg">
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile tab bar — bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg2 border-t border-border flex z-50">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-3 text-[10px] font-semibold flex flex-col items-center gap-0.5 cursor-pointer border-none transition-colors
              ${tab===t.key?'text-yellow bg-yellow/5':'text-muted bg-transparent hover:text-white'}`}>
            <span className="text-[16px]">{t.label.split(' ')[0]}</span>
            <span>{t.label.split(' ').slice(1).join(' ')}</span>
          </button>
        ))}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 bg-bg2 border-r border-border flex-col shrink-0 min-h-screen">
        <div className="px-5 py-5 border-b border-border">
          <div className="text-yellow font-extrabold text-[15px]">⚡ SwiftSwap</div>
          <div className="text-muted text-[11px]">Admin Panel</div>
        </div>
        <nav className="flex-1 py-4 px-3">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[12.5px] font-medium mb-1 cursor-pointer border-none transition-all
                ${tab===t.key?'bg-yellow/10 text-yellow border border-yellow/20':'text-muted hover:text-white hover:bg-bg3 bg-transparent'}`}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <button onClick={()=>window.location.href='/'} className="w-full text-left px-3 py-2 text-muted text-[12px] hover:text-white cursor-pointer bg-transparent border-none mb-1">
            ← Back to site
          </button>
          <button onClick={logout} className="w-full text-left px-3 py-2 text-red text-[12px] cursor-pointer bg-transparent border-none">
            ⏻ Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Mobile header for current tab */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border">
          <h1 className="font-bold text-[15px]">{TABS.find(t=>t.key===tab)?.label}</h1>
          <div className="flex gap-2">
            <button onClick={()=>window.location.href='/'} className="text-muted text-[11px] cursor-pointer bg-transparent border-none">← Site</button>
            <button onClick={logout} className="text-red text-[11px] cursor-pointer bg-transparent border-none">Logout</button>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-6">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'orders'    && <Orders />}
          {tab === 'users'     && <Users />}
          {tab === 'wallets'   && <Wallets />}
        </div>
      </div>
    </div>
  );
}