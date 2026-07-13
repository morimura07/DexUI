import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { adminCall } from '../api';
import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function Reviews() {
  const t = useT();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminCall('GET', 'admin/reviews').then(r => {
      if (r.success) setReviews(r.data.reviews || []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id, status) => {
    await adminCall('PUT', 'admin/reviews/update', { id, status });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: status === 'approved', status } : r));
  };

  if (loading) return <div className="text-muted text-[11px] shimmer py-8 text-center">{t('adminReviews.loading')}</div>;

  return (
    <div>
      <p className="text-muted text-[11px] mb-4">{t('adminReviews.intro')}</p>
      {reviews.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl py-12 text-center text-muted text-[11px]">
          {t('adminReviews.noReviews')}
        </div>
      ) : (
        <Reveal variant="fadeUp" className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="bg-bg2 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[12px]">{r.user_name || r.user_email || t('adminReviews.anonymous')}</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating || 5 }).map((_, s) => <Star key={s} className="h-3 w-3 fill-warn text-warn" />)}
                    </span>
                    <span className={`text-[10px] font-semibold ${r.is_approved ? 'text-green' : 'text-warn'}`}>
                      {r.is_approved ? t('adminReviews.approved') : t('adminReviews.pending')}
                    </span>
                  </div>
                  <p className="text-muted text-[11px] leading-relaxed">{r.comment}</p>
                  <div className="text-[10px] text-muted mt-2">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => updateStatus(r.id, 'approved')}
                    className="px-2 py-1 bg-green/10 text-green text-[10px] rounded border border-green/20 hover:bg-green/20 cursor-pointer">
                    {t('adminReviews.approve')}
                  </button>
                  <button onClick={() => updateStatus(r.id, 'rejected')}
                    className="px-2 py-1 bg-red/10 text-red text-[10px] rounded border border-red/20 hover:bg-red/20 cursor-pointer">
                    {t('adminReviews.reject')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      )}
    </div>
  );
}