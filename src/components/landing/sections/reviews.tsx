import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Section, SectionHeader } from '../section'
import { api } from '@/api/client'
import { useT } from '@/lib/i18n'

interface Review {
  user_name?: string
  rating?: number
  text?: string
  comment?: string
  created_at?: string
}

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-warn text-warn' : 'text-border'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function initialsOf(name?: string) {
  if (!name) return 'AN'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ReviewCard({ r }: { r: Review }) {
  const t = useT()
  const body = r.text ?? r.comment ?? ''
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-border bg-bg2 p-6">
      <Stars rating={r.rating} />
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-muted">{body}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand-fg">
          {initialsOf(r.user_name)}
        </span>
        <span className="truncate text-sm text-fg">{r.user_name || t('reviews.anonymous')}</span>
      </figcaption>
    </figure>
  )
}

export function Reviews() {
  const t = useT()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getReviews()
      .then((res: { success?: boolean; data?: { reviews?: Review[] } }) => {
        if (cancelled) return
        if (res?.success) setReviews(res.data?.reviews ?? [])
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  // Nothing to show is not worth a section. Say nothing rather than fake it.
  if (!loading && reviews.length === 0) return null

  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length : 0

  return (
    <Section id="reviews">
      <SectionHeader
        eyebrow={t('reviews.eyebrow')}
        title={t('reviews.title')}
        lede={
          reviews.length > 0
            ? t(reviews.length === 1 ? 'reviews.ledeOne' : 'reviews.ledeMany', {
                avg: avg.toFixed(1),
                count: reviews.length,
              })
            : undefined
        }
      />

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 shimmer rounded-2xl border border-border bg-bg2" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r, i) => (
            <ReviewCard key={i} r={r} />
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link to="/contacts" className="text-base text-muted underline underline-offset-4 hover:text-brand-fg">
          {t('reviews.cta')}
        </Link>
      </div>
    </Section>
  )
}
