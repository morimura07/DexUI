import { useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Section, SectionHeader } from '../section'
import { Reveal } from '@/lib/motion'
import { useT } from '@/lib/i18n'
import { useMarkets, type Coin } from '../use-markets'

/* ── formatting ─────────────────────────────────────────────────────────────── */

function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const dp = n >= 1 ? 2 : n >= 0.01 ? 4 : 6
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: dp === 2 ? 2 : 0, maximumFractionDigits: dp })
}

function fmtBig(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '—'
  const a = Math.abs(n)
  if (a >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  return '$' + Math.round(n).toLocaleString()
}

/* ── cells ──────────────────────────────────────────────────────────────────── */

/** Price that briefly flashes green/red when its value changes on a refresh. */
function Price({ value }: { value: number }) {
  const prev = useRef(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (value > prev.current) setFlash('up')
    else if (value < prev.current) setFlash('down')
    prev.current = value
    const id = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(id)
  }, [value])

  return (
    <span
      className={`tabular-nums font-medium transition-colors duration-700 ${
        flash === 'up' ? 'text-green' : flash === 'down' ? 'text-red' : 'text-fg'
      }`}
    >
      {fmtPrice(value)}
    </span>
  )
}

/** Minimal 7-day sparkline; colour follows the 24h direction. */
function Spark({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null
  const w = 96
  const h = 30
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)
  const pts = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className={up ? 'text-green' : 'text-red'} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function Change({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={`inline-flex items-center justify-end gap-0.5 tabular-nums ${up ? 'text-green' : 'text-red'}`}>
      {up ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  )
}

/* ── section ────────────────────────────────────────────────────────────────── */

const TH = 'px-2 py-3.5 text-[11px] font-medium uppercase tracking-wide text-subtle'
const TD = 'px-2 py-4 align-middle'

export function Markets() {
  const t = useT()
  const { coins, loading, failed, updatedAt } = useMarkets()

  // Tick once a second so the "updated Xs ago" label stays live.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const secs = updatedAt != null ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null
  const ago = secs == null ? '' : secs < 3 ? t('markets.updatedNow') : t('markets.updatedAgo', { s: secs })

  return (
    <Section id="markets">
      <SectionHeader eyebrow={t('markets.eyebrow')} title={t('markets.title')} lede={t('markets.lede')} />

      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-green/25 px-3 py-1 text-xs font-medium text-green">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
          </span>
          {t('markets.live')}
        </span>
        {ago && <span className="text-xs tabular-nums text-subtle">{ago}</span>}
      </div>

      {failed && coins.length === 0 ? (
        <div className="rounded-2xl border border-border p-10 text-center text-muted">{t('markets.error')}</div>
      ) : (
        <Reveal variant="fadeUp" className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className={`${TH} pl-5`}>{t('markets.col.rank')}</th>
                <th className={TH}>{t('markets.col.coin')}</th>
                <th className={`${TH} text-right`}>{t('markets.col.price')}</th>
                <th className={`${TH} text-right`}>{t('markets.col.change')}</th>
                <th className={`${TH} hidden text-right md:table-cell`}>{t('markets.col.marketCap')}</th>
                <th className={`${TH} hidden text-right lg:table-cell`}>{t('markets.col.volume')}</th>
                <th className={`${TH} hidden pr-5 text-right sm:table-cell`}>{t('markets.col.chart')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && coins.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className={`${TD} pl-5`} colSpan={7}>
                        <div className="shimmer h-6 w-full rounded" />
                      </td>
                    </tr>
                  ))
                : coins.map((c: Coin) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className={`${TD} pl-5 tabular-nums text-subtle`}>{c.rank}</td>
                      <td className={TD}>
                        <div className="flex items-center gap-2.5">
                          {c.image && <img src={c.image} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 rounded-full" />}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-fg">{c.name}</div>
                            <div className="text-xs text-subtle">{c.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`${TD} text-right`}>
                        <Price value={c.price} />
                      </td>
                      <td className={`${TD} text-right`}>
                        <Change value={c.change24h} />
                      </td>
                      <td className={`${TD} hidden text-right tabular-nums text-muted md:table-cell`}>{fmtBig(c.marketCap)}</td>
                      <td className={`${TD} hidden text-right tabular-nums text-muted lg:table-cell`}>{fmtBig(c.volume)}</td>
                      <td className={`${TD} hidden pr-5 sm:table-cell`}>
                        <div className="flex justify-end">
                          <Spark data={c.sparkline} up={c.change24h >= 0} />
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </Reveal>
      )}

      <p className="mt-4 text-xs text-subtle">{t('markets.attribution')}</p>
    </Section>
  )
}
