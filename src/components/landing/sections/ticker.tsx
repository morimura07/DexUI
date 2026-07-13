import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TokenIcon } from '../token-icon'
import { toNum } from '@/lib/format'
import type { RoutesState } from '../use-routes'

/**
 * Live rate marquee. Reuses `.animate-ticker` from index.css; the track is
 * duplicated so the -50% translate loops seamlessly.
 */
export function Ticker({ routes, loading }: RoutesState) {
  const items = useMemo(
    () =>
      routes.slice(0, 18).map((r) => {
        const rateIn = toNum(r.rate?.in)
        const rateOut = toNum(r.rate?.out)
        const display =
          rateOut > 1
            ? `1 ${r.from.symbol} = ${rateOut.toFixed(r.to.decimal ?? 2)} ${r.to.symbol}`
            : `1 ${r.to.symbol} = ${rateIn.toFixed(r.from.decimal ?? 2)} ${r.from.symbol}`
        return { key: `${r.from.xml}-${r.to.xml}`, from: r.from, to: r.to, display }
      }),
    [routes],
  )

  if (loading || items.length === 0) {
    return <div className="h-[73px] w-full border-y border-border" aria-hidden="true" />
  }

  const track = [...items, ...items]

  return (
    <div className="relative w-full overflow-hidden border-y border-border bg-bg2/40">
      {/* Edge fades resolve against the page background, so they survive a theme flip. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{ background: 'linear-gradient(90deg, var(--surface-0), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{ background: 'linear-gradient(270deg, var(--surface-0), transparent)' }}
      />

      <div className="flex w-max animate-ticker">
        {track.map((it, i) => (
          <Link
            key={`${it.key}-${i}`}
            to={`/exchange?from=${it.from.xml}&to=${it.to.xml}`}
            className="flex shrink-0 items-center gap-3 border-r border-border px-8 py-6 transition-colors hover:bg-bg3/40"
          >
            <span className="flex items-center -space-x-2">
              <TokenIcon token={it.from} />
              <TokenIcon token={it.to} />
            </span>
            <span className="whitespace-nowrap text-sm text-muted">{it.display}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
