import { useState, useEffect } from 'react';
import { useT } from '../../lib/i18n';
import { adminCall } from '../api';

const TONE = {
  critical: 'bg-red/15 text-red',
  warning:  'bg-yellow/15 text-yellow',
  info:     'bg-green/15 text-green',
};

const FILTERS = [
  { key: '',         label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning',  label: 'Warning' },
  { key: 'info',     label: 'Info' },
];

export default function Logs() {
  const t = useT();
  const [logs, setLogs]     = useState([]);
  const [counts, setCounts] = useState({});
  const [sev, setSev]       = useState('');
  const [q, setQ]           = useState('');
  const [loading, setLoad]  = useState(true);

  const load = async (severity = sev, search = q) => {
    setLoad(true);
    const params = {};
    if (severity) params.severity = severity;
    if (search)   params.q = search;
    const r = await adminCall('GET', 'admin/audit-logs', Object.keys(params).length ? params : null);
    if (r.success) { setLogs(r.data.logs); setCounts(r.data.counts || {}); }
    setLoad(false);
  };
  useEffect(() => { load(); }, []);

  const pick = (s) => { setSev(s); load(s, q); };
  const when = (x) => x ? new Date(x.replace(' ', 'T')).toLocaleString() : '—';

  return (
    <div>
      <p className="text-muted text-[11px] mb-4">
        Every change to orders, routes, settings, wallets and users — who did it, and what changed.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => pick(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
              sev === f.key ? 'border-brand text-brand-fg bg-brand/10' : 'border-border text-muted hover:text-fg'}`}>
            {f.label}
            {f.key === 'critical' && counts.critical > 0 && <span className="ml-1.5 text-red">{counts.critical}</span>}
            {f.key === 'warning'  && counts.warning  > 0 && <span className="ml-1.5 text-yellow">{counts.warning}</span>}
          </button>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(sev, q)}
          placeholder="Search actions, users…"
          className="flex-1 min-w-[180px] bg-bg2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-fg outline-none focus:border-brand" />
      </div>

      {loading ? (
        <div className="text-[12px] text-muted">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl py-10 text-center text-[11.5px] text-muted">
          No activity recorded yet. Actions are logged from now on.
        </div>
      ) : (
        <div className="bg-bg2 border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-[12px] min-w-[720px]">
            <thead>
              <tr className="bg-bg text-muted text-[10px] uppercase tracking-wide">
                <th className="text-left py-2.5 px-4 font-semibold">Time</th>
                <th className="text-left py-2.5 px-4 font-semibold">Action</th>
                <th className="text-left py-2.5 px-4 font-semibold">What changed</th>
                <th className="text-left py-2.5 px-4 font-semibold">By</th>
                <th className="text-left py-2.5 px-4 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t border-border align-top">
                  <td className="py-2.5 px-4 text-muted text-[10.5px] whitespace-nowrap">{when(l.created_at)}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${TONE[l.severity] || TONE.info}`}>{l.action}</span>
                  </td>
                  <td className="py-2.5 px-4 max-w-[380px]">
                    <div className="text-fg">{l.description}</div>
                    {(l.before_val || l.after_val) && (
                      <div className="mt-1 text-[10px] font-mono text-muted break-all">
                        {l.before_val && <span className="text-red">{l.before_val}</span>}
                        {l.before_val && l.after_val && <span className="mx-1.5">→</span>}
                        {l.after_val && <span className="text-green">{l.after_val}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-muted text-[10.5px]">{l.actor_email || 'system'}</td>
                  <td className="py-2.5 px-4 text-muted font-mono text-[10px]">{l.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}