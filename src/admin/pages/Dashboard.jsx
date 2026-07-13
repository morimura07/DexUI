import { useState, useEffect } from 'react';
import { ClipboardList, Clock, Eye, CheckCircle2, Users, CalendarDays, DollarSign } from 'lucide-react';
import { adminCall } from '../api';
import StatsCard from '../components/StatsCard';
import Badge from '../components/Badge';
import { Reveal, RevealGroup, RevealItem } from '../../lib/motion';
import { useT } from '../../lib/i18n';

const ic = 'h-4 w-4';

export default function Dashboard() {
  const t = useT();
  const [data, setData] = useState(null);

  useEffect(() => {
    adminCall('GET', 'admin/stats').then(r => r.success && setData(r.data));
  }, []);

  if (!data) return <div className="shimmer py-16 text-center text-sm text-muted">{t('adminDash.loading')}</div>;

  // Tolerate a partial/empty stats payload rather than crashing on `.map`.
  const stats = data.stats || {};
  const recent_orders = data.recent_orders || [];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <RevealItem variant="scaleIn"><StatsCard icon={<ClipboardList className={ic} />} label={t('adminDash.totalOrders')}    value={stats.total_orders}    color="text-fg" /></RevealItem>
        <RevealItem variant="scaleIn"><StatsCard icon={<Clock className={ic} />}         label={t('adminDash.pending')}         value={stats.pending_orders}  color="text-warn" /></RevealItem>
        <RevealItem variant="scaleIn"><StatsCard icon={<Eye className={ic} />}           label={t('adminDash.awaitingReview')} value={stats.awaiting_release ?? 0} sub={(stats.awaiting_release ?? 0) > 0 ? t('adminDash.needsAction') : t('adminDash.allClear')} color="text-info" /></RevealItem>
        <RevealItem variant="scaleIn"><StatsCard icon={<CheckCircle2 className={ic} />}  label={t('adminDash.completed')}       value={stats.completed_orders} color="text-green" /></RevealItem>
        <RevealItem variant="scaleIn"><StatsCard icon={<Users className={ic} />}         label={t('adminDash.users')}           value={stats.total_users}     color="text-info" /></RevealItem>
        <RevealItem variant="scaleIn"><StatsCard icon={<CalendarDays className={ic} />}  label={t('adminDash.today')}           value={stats.today_orders}    color="text-brand-fg" /></RevealItem>
        <RevealItem variant="scaleIn"><StatsCard icon={<DollarSign className={ic} />}    label={t('adminDash.volume')}          value={`$${parseFloat(stats.total_volume||0).toLocaleString()}`} color="text-green" /></RevealItem>
      </RevealGroup>

      {/* Recent orders */}
      <Reveal variant="fadeUp" className="overflow-hidden rounded-xl border border-border bg-bg2">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-sm font-medium text-fg">{t('adminDash.recentOrders')}</span>
          <span className="text-xs text-subtle">{t('adminDash.last10')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-bg3/60">
                {['orderId', 'user', 'from', 'to', 'status', 'date'].map(h => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-subtle">{t(`adminDash.col.${h}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_orders.map((o, i) => (
                <tr key={i} className="border-b border-border text-fg last:border-0 transition-colors hover:bg-bg3/50">
                  <td className="px-4 py-3 font-medium text-brand-fg">{o.order_id}</td>
                  <td className="px-4 py-3 text-muted">{o.user_email || t('adminDash.guest')}</td>
                  <td className="px-4 py-3 tabular-nums">{parseFloat(o.from_amount||0).toFixed(2)} <span className="text-muted">{o.from_symbol}</span></td>
                  <td className="px-4 py-3 tabular-nums text-green">{parseFloat(o.to_amount||0).toFixed(2)} <span className="text-muted">{o.to_symbol}</span></td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}