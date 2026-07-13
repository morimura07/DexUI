import { useState, useEffect } from 'react';
import { adminCall } from '../api';
import { Reveal, RevealGroup, RevealItem, CountUp } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function Analytics() {
  const t = useT();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminCall('GET', 'admin/stats').then(r => r.success && setStats(r.data.stats));
  }, []);

  if (!stats) return <div className="text-muted text-[11px] shimmer py-8 text-center">{t('adminAnalytics.loading')}</div>;

  const statusData = [
    { label: t('adminAnalytics.statusCompleted'),      val: stats.completed_orders, color: 'bg-green',       pct: stats.total_orders ? Math.round(stats.completed_orders / stats.total_orders * 100) : 0 },
    { label: t('adminAnalytics.statusPendingPayment'), val: stats.pending_orders,  color: 'bg-warn',        pct: stats.total_orders ? Math.round(stats.pending_orders / stats.total_orders * 100) : 0 },
    { label: t('adminAnalytics.statusOther'),          val: stats.total_orders - stats.completed_orders - stats.pending_orders, color: 'bg-muted', pct: stats.total_orders ? Math.round((stats.total_orders - stats.completed_orders - stats.pending_orders) / stats.total_orders * 100) : 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <RevealGroup className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('adminAnalytics.totalVolume'), val: `$${parseFloat(stats.total_volume||0).toLocaleString()}`, color: 'text-green' },
          { label: t('adminAnalytics.totalOrders'), val: stats.total_orders,    color: 'text-fg' },
          { label: t('adminAnalytics.todaysOrders'),  val: stats.today_orders,    color: 'text-brand-fg' },
          { label: t('adminAnalytics.totalUsers'),     val: stats.total_users,     color: 'text-info' },
        ].map(s => (
          <RevealItem key={s.label} variant="scaleIn">
            <div className="bg-bg2 border border-border rounded-xl p-4">
              <div className={`text-[20px] font-extrabold ${s.color}`}>{typeof s.val === 'number' ? <CountUp value={s.val} /> : s.val}</div>
              <div className="text-muted text-[11px] mt-1">{s.label}</div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Order status breakdown */}
      <Reveal variant="fadeUp" className="bg-bg2 border border-border rounded-xl p-4">
        <div className="font-semibold text-[12px] mb-4">{t('adminAnalytics.breakdown')}</div>
        <div className="space-y-3">
          {statusData.map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted">{s.label}</span>
                <span className="text-fg font-semibold"><CountUp value={s.val} /> (<CountUp value={s.pct} suffix="%" />)</span>
              </div>
              <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Completion rate */}
      <Reveal variant="fadeUp" delay={0.08} className="bg-bg2 border border-border rounded-xl p-4">
        <div className="font-semibold text-[12px] mb-3">{t('adminAnalytics.completionRate')}</div>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#03A66D" strokeWidth="3"
                strokeDasharray={`${stats.total_orders ? Math.round(stats.completed_orders / stats.total_orders * 100) : 0} 100`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-green">
              <CountUp value={stats.total_orders ? Math.round(stats.completed_orders / stats.total_orders * 100) : 0} suffix="%" />
            </div>
          </div>
          <div>
            <div className="text-[12px] text-fg font-semibold mb-1"><CountUp value={stats.completed_orders} /> {t('adminAnalytics.completedSep')} <CountUp value={stats.total_orders} /> {t('adminAnalytics.completedSuffix')}</div>
            <div className="text-[11px] text-muted">{t('adminAnalytics.trackNote')}</div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}