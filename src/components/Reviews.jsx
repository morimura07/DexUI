import { useState, useEffect } from 'react';
import { Star, CheckCircle2, AlertTriangle, X, PenLine } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function Stars({ rating, size = 15, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => {
        const on = s <= (hover || rating);
        return (
          <button key={s} type="button" disabled={!interactive}
            onMouseEnter={() => interactive && setHover(s)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(s)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}>
            <Star style={{ width: size, height: size }} className={`transition-colors ${on ? 'fill-warn text-warn' : 'fill-transparent text-border'}`} />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = review.user_name
    ? review.user_name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()
    : 'AN';
  const date = new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="bg-bg2 border border-border rounded-xl p-4 hover:border-brand/20 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-fg font-bold text-[11px] shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-[12px]">{review.user_name || 'Anonymous'}</div>
            <div className="text-muted text-[10px]">{date}</div>
          </div>
        </div>
        <Stars rating={review.rating} size={14} />
      </div>
      <p className="text-muted text-[11.5px] leading-relaxed">{review.text}</p>
    </div>
  );
}

function ReviewForm({ onSubmitted }) {
  const { isLoggedIn } = useAuth();
  const [rating, setRating]   = useState(0);
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const submit = async () => {
    if (!rating) { setError('Please select a star rating'); return; }
    if (text.trim().length < 10) { setError('Review must be at least 10 characters'); return; }
    setSending(true); setError('');
    const res = await api.submitReview({ rating, text: text.trim() });
    setSending(false);
    if (res.success) { setDone(true); onSubmitted?.(); }
    else setError(res.error?.message || 'Failed to submit review');
  };

  if (!isLoggedIn) return (
    <div className="bg-bg2 border border-border rounded-xl p-5 text-center">
      <div className="text-[13px] font-semibold mb-1">Leave a Review</div>
      <p className="text-muted text-[11px] mb-3">You need to be logged in to submit a review</p>
      <a href="/login" className="px-4 py-2 bg-brand text-white text-[11px] font-bold rounded-lg inline-block hover:bg-brand-h transition-colors">
        Log In
      </a>
    </div>
  );

  if (done) return (
    <div className="bg-green/10 border border-green/20 rounded-xl p-5 text-center">
      <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-green" />
      <div className="font-bold text-[13px] text-green mb-1">Review Submitted!</div>
      <p className="text-muted text-[11px]">Your review is pending admin approval and will appear shortly.</p>
    </div>
  );

  return (
    <div className="bg-bg2 border border-border rounded-xl p-5">
      <div className="font-bold text-[13px] mb-4">Write a Review</div>
      <div className="mb-3">
        <div className="text-[10px] text-muted font-semibold uppercase tracking-wide mb-2">Your Rating *</div>
        <Stars rating={rating} size={28} interactive onChange={setRating} />
      </div>
      <div className="mb-3">
        <div className="text-[10px] text-muted font-semibold uppercase tracking-wide mb-1.5">Your Review *</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
          placeholder="Share your experience with SwiftSwap…"
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-fg outline-none focus:border-brand transition-colors resize-none" />
        <div className="text-[10px] text-muted mt-1">{text.length}/500 characters</div>
      </div>
      {error && <div className="flex items-center gap-1 text-red text-[11px] mb-3"><AlertTriangle className="h-3 w-3" /> {error}</div>}
      <button onClick={submit} disabled={sending}
        className="w-full py-2.5 bg-brand text-white font-bold text-[12px] rounded-lg cursor-pointer hover:bg-brand-h transition-colors disabled:opacity-50">
        {sending ? 'Submitting…' : 'Submit Review'}
      </button>
      <p className="text-[10px] text-muted text-center mt-2">Reviews are moderated before appearing publicly</p>
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoad]    = useState(true);
  const [showForm, setForm]   = useState(false);

  const load = () => {
    api.getReviews().then(r => { if (r.success) setReviews(r.data.reviews || []); setLoad(false); });
  };

  useEffect(() => { load(); }, []);

  const avg = reviews.length > 0 ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="px-4 md:px-8 py-10 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-extrabold">Customer Reviews</h2>
          {avg && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(avg)} size={15} />
              <span className="text-warn font-bold text-[13px]">{avg}</span>
              <span className="text-muted text-[11px]">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        <button onClick={() => setForm(f => !f)}
          className="flex items-center gap-1.5 px-4 py-2 border border-brand text-brand-fg text-[11px] font-bold rounded-lg hover:bg-brand hover:text-white transition-colors cursor-pointer bg-transparent">
          {showForm ? <><X className="h-3.5 w-3.5" /> Close</> : <><PenLine className="h-3.5 w-3.5" /> Write review</>}
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="mb-5 max-w-lg">
          <ReviewForm onSubmitted={() => { setForm(false); load(); }} />
        </div>
      )}

      {/* Reviews: marquee when there are enough, static grid when few */}
      {loading ? (
        <div className="text-muted text-[11px] animate-pulse py-6">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-muted">
          <Star className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <div className="text-[12px]">No reviews yet — be the first to share your experience!</div>
        </div>
      ) : reviews.length <= 3 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      ) : (
        <div className="ss-rev-wrap relative overflow-hidden">
          {/* edge fades */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10" style={{ background: 'linear-gradient(90deg,var(--surface-0),transparent)' }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10" style={{ background: 'linear-gradient(270deg,var(--surface-0),transparent)' }} />
          <div className="ss-rev-track flex gap-3 w-max py-1" style={{ animationDuration: `${Math.max(24, reviews.length * 6)}s` }}>
            {[...reviews, ...reviews].map((r, i) => (
              <div key={i} className="w-[300px] shrink-0"><ReviewCard review={r} /></div>
            ))}
          </div>
          <style>{`
            @keyframes ssRev { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            .ss-rev-track { animation-name: ssRev; animation-timing-function: linear; animation-iteration-count: infinite; }
            .ss-rev-wrap:hover .ss-rev-track { animation-play-state: paused; }
            @media (prefers-reduced-motion: reduce) { .ss-rev-track { animation: none; flex-wrap: wrap; } }
          `}</style>
        </div>
      )}
    </div>
  );
}