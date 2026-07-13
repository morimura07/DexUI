import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import StatsCard from '../components/StatsCard';
import Badge from '../components/Badge';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminCall('GET', 'admin/stats').then(r => r.success && setData(r.data));
  }, []);

  if (!data) return <div className="text-muted text-[11px] animate-pulse py-8 text-center">Loading dashboard…</div>;

  const { stats, recent_orders } = data;

  return (
    <div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 mb-5">
        <StatsCard icon="📋" label="Total Orders"    value={stats.total_orders}    color="text-white" />
        <StatsCard icon="⏳" label="Pending"         value={stats.pending_orders}  color="text-yellow" />
        <StatsCard icon="🔎" label="Awaiting Review" value={stats.awaiting_release ?? 0} sub={(stats.awaiting_release ?? 0) > 0 ? 'needs action' : 'all clear'} color="text-blue-400" />
        <StatsCard icon="✅" label="Completed"       value={stats.completed_orders} color="text-green" />
        <StatsCard icon="👥" label="Users"           value={stats.total_users}     color="text-blue-400" />
        <StatsCard icon="📅" label="Today"           value={stats.today_orders}    color="text-yellow" />
        <StatsCard icon="💰" label="Volume"          value={`$${parseFloat(stats.total_volume||0).toLocaleString()}`} color="text-green" />
      </div>

      {/* Recent orders */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-[12px]">Recent Orders</span>
          <span className="text-muted text-[10px]">Last 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-bg3">
                {['Order ID', 'User', 'From', 'To', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_orders.map((o, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                  <td className="py-2 px-3 text-yellow font-bold">{o.order_id}</td>
                  <td className="py-2 px-3 text-muted">{o.user_email || 'Guest'}</td>
                  <td className="py-2 px-3">{parseFloat(o.from_amount||0).toFixed(2)} <span className="text-muted">{o.from_symbol}</span></td>
                  <td className="py-2 px-3 text-green">{parseFloat(o.to_amount||0).toFixed(2)} <span className="text-muted">{o.to_symbol}</span></td>
                  <td className="py-2 px-3"><Badge label={o.status} /></td>
                  <td className="py-2 px-3 text-muted">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}