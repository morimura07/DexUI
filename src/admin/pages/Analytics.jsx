import { useState, useEffect } from 'react';
import { adminCall } from '../api';

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminCall('GET', 'admin/stats').then(r => r.success && setStats(r.data.stats));
  }, []);

  if (!stats) return <div className="text-muted text-[11px] animate-pulse py-8 text-center">Loading analytics…</div>;

  const statusData = [
    { label: 'Completed',        val: stats.completed_orders, color: 'bg-green',       pct: stats.total_orders ? Math.round(stats.completed_orders / stats.total_orders * 100) : 0 },
    { label: 'Pending Payment',  val: stats.pending_orders,  color: 'bg-yellow',       pct: stats.total_orders ? Math.round(stats.pending_orders / stats.total_orders * 100) : 0 },
    { label: 'Other',            val: stats.total_orders - stats.completed_orders - stats.pending_orders, color: 'bg-muted', pct: stats.total_orders ? Math.round((stats.total_orders - stats.completed_orders - stats.pending_orders) / stats.total_orders * 100) : 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Volume',    val: `$${parseFloat(stats.total_volume||0).toLocaleString()}`, color: 'text-green' },
          { label: 'Total Orders',    val: stats.total_orders,    color: 'text-white' },
          { label: "Today's Orders",  val: stats.today_orders,    color: 'text-yellow' },
          { label: 'Total Users',     val: stats.total_users,     color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-bg2 border border-border rounded-xl p-4">
            <div className={`text-[20px] font-extrabold ${s.color}`}>{s.val}</div>
            <div className="text-muted text-[11px] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="font-semibold text-[12px] mb-4">Order Status Breakdown</div>
        <div className="space-y-3">
          {statusData.map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted">{s.label}</span>
                <span className="text-white font-semibold">{s.val} ({s.pct}%)</span>
              </div>
              <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion rate */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="font-semibold text-[12px] mb-3">Completion Rate</div>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2B3139" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#03A66D" strokeWidth="3"
                strokeDasharray={`${stats.total_orders ? Math.round(stats.completed_orders / stats.total_orders * 100) : 0} 100`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-green">
              {stats.total_orders ? Math.round(stats.completed_orders / stats.total_orders * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="text-[12px] text-white font-semibold mb-1">{stats.completed_orders} of {stats.total_orders} orders completed</div>
            <div className="text-[11px] text-muted">Track your exchange success rate here</div>
          </div>
        </div>
      </div>
    </div>
  );
}