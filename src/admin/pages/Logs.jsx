import { useState, useEffect } from 'react';
import { adminCall } from '../api';

const ACTION_COLOR = {
  'order.created':   'text-green',
  'order.completed': 'text-green',
  'order.cancelled': 'text-red',
  'order.expired':   'text-muted',
  'user.login':      'text-blue-400',
  'user.register':   'text-blue-400',
  'admin.update':    'text-yellow',
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Derive logs from recent orders as a proxy until real audit log table exists
    adminCall('GET', 'admin/orders', { limit: 100 }).then(r => {
      if (r.success) {
        const derived = r.data.orders.map(o => ({
          action: o.status === 'COMPLETED' ? 'order.completed'
               : o.status === 'CANCELLED' ? 'order.cancelled'
               : o.status === 'EXPIRED'   ? 'order.expired'
               : 'order.created',
          description: `Order ${o.order_id} — ${parseFloat(o.from_amount||0).toFixed(2)} ${o.from_symbol} → ${parseFloat(o.to_amount||0).toFixed(2)} ${o.to_symbol}`,
          user: o.user_email || 'Guest',
          created_at: o.created_at,
        }));
        setLogs(derived);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-muted text-[11px] animate-pulse py-8 text-center">Loading logs…</div>;

  return (
    <div>
      <p className="text-muted text-[11px] mb-4">Activity log derived from order events.</p>
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['Time', 'Action', 'Description', 'User'].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-muted">No logs available</td></tr>
              ) : logs.map((l, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 text-muted whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <span className={`font-semibold ${ACTION_COLOR[l.action] || 'text-muted'}`}>{l.action}</span>
                  </td>
                  <td className="py-2 px-3 text-white">{l.description}</td>
                  <td className="py-2 px-3 text-muted">{l.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}