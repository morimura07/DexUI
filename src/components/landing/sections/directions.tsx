import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Section, SectionHeader } from '../section'
import { TokenIcon } from '../token-icon'
import { fmtAmt, toNum } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { RoutesState } from '../use-routes'

const SHOWN = 12

export function Directions({ routes, loading, failed }: RoutesState) {
  const t = useT()
  const pairs = useMemo(() => {
    const seen = new Set<string>()
    return routes
      .filter((r) => {
        const k = `${r.from?.xml}->${r.to?.xml}`
        if (!r.from || !r.to || seen.has(k)) return false
        seen.add(k)
        return true
      })
      .slice(0, SHOWN)
  }, [routes])

  return (
    <Section id="directions">
      <SectionHeader eyebrow={t('directions.eyebrow')} title={t('directions.title')} lede={t('directions.lede')} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[92px] shimmer rounded-2xl border border-border bg-bg2" />
          ))}
        </div>
      ) : failed || pairs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg2 p-10 text-center">
          <p className="text-muted">
            {t('directions.unavailableBefore')}
            <Link to="/exchange" className="text-brand-fg underline underline-offset-4">
              {t('directions.openExchange')}
            </Link>
            {t('directions.unavailableAfter')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map((r) => (
              <Link
                key={`${r.from.xml}-${r.to.xml}`}
                to={`/exchange?from=${r.from.xml}&to=${r.to.xml}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-bg2 p-5 transition-colors hover:border-brand/40 hover:bg-bg3/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TokenIcon token={r.from} size="lg" />
                  <ArrowRight className="h-4 w-4 shrink-0 text-subtle transition-transform duration-300 group-hover:translate-x-0.5" />
                  <TokenIcon token={r.to} size="lg" />
                </div>
                <div className="min-w-0 text-right">
                  <div className="truncate text-sm font-medium text-fg">
                    {r.from.symbol} → {r.to.symbol}
                  </div>
                  {r.from.min != null && (
                    <div className="mt-1 text-xs tabular-nums text-subtle">
                      {t('directions.min')} {fmtAmt(toNum(r.from.min))} {r.from.symbol}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {routes.length > SHOWN && (
            <div className="mt-10">
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 text-base text-fg transition-colors hover:text-brand-fg"
              >
                <span className="underline underline-offset-4">
                  {t('directions.viewAll', { count: routes.length })}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </>
      )}
    </Section>
  )
}
