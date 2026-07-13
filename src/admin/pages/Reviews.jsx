import { useState, useEffect } from 'react';
import { adminCall } from '../api';

export default function Reviews() {
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

  if (loading) return <div className="text-muted text-[11px] animate-pulse py-8 text-center">Loading reviews…</div>;

  return (
    <div>
      <p className="text-muted text-[11px] mb-4">Moderate user reviews before they appear publicly on the site.</p>
      {reviews.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl py-12 text-center text-muted text-[11px]">
          No reviews yet
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="bg-bg2 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[12px]">{r.user_name || r.user_email || 'Anonymous'}</span>
                    <span className="text-yellow text-[11px]">{'★'.repeat(r.rating || 5)}</span>
                    <span className={`text-[10px] font-semibold ${r.is_approved ? 'text-green' : 'text-yellow'}`}>
                      {r.is_approved ? 'approved' : 'pending'}
                    </span>
                  </div>
                  <p className="text-muted text-[11px] leading-relaxed">{r.comment}</p>
                  <div className="text-[10px] text-muted mt-2">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => updateStatus(r.id, 'approved')}
                    className="px-2 py-1 bg-green/10 text-green text-[10px] rounded border border-green/20 hover:bg-green/20 cursor-pointer">
                    Approve
                  </button>
                  <button onClick={() => updateStatus(r.id, 'rejected')}
                    className="px-2 py-1 bg-red/10 text-red text-[10px] rounded border border-red/20 hover:bg-red/20 cursor-pointer">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}