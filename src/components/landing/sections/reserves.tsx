import { useMemo } from 'react'
import { Section, SectionHeader } from '../section'
import { TokenIcon } from '../token-icon'
import { fmtCompact, toNum } from '@/lib/format'
import { CountUp, motion } from '@/lib/motion'
import { useT } from '@/lib/i18n'
import type { RoutesState, Token } from '../use-routes'

const SHOWN = 6

/**
 * Reserves are per-route and denominated in the receive currency, so the honest
 * aggregate for a currency is the largest reserve any route offers in it — not a
 * sum, which would double-count the same pool across routes.
 */
export function Reserves({ routes, loading, failed }: RoutesState) {
  const t = useT()
  const bars = useMemo(() => {
    const best = new Map<string, { token: Token; reserve: number }>()
    for (const r of routes) {
      if (!r.to) continue
      const reserve = toNum(r.reserve)
      if (reserve <= 0) continue
      const cur = best.get(r.to.xml)
      if (!cur || reserve > cur.reserve) best.set(r.to.xml, { token: r.to, reserve })
    }
    const list = [...best.values()].sort((a, b) => b.reserve - a.reserve).slice(0, SHOWN)
    const max = list[0]?.reserve ?? 1
    return list.map((b) => ({ ...b, pct: Math.max(2, Math.round((b.reserve / max) * 100)) }))
  }, [routes])

  if (loading) {
    return (
      <Section id="reserves">
        <SectionHeader eyebrow={t('reserves.eyebrow')} title={t('reserves.title')} />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 shimmer rounded-xl border border-border bg-bg2" />
          ))}
        </div>
      </Section>
    )
  }

  if (failed || bars.length === 0) return null

  return (
    <Section id="reserves">
      <SectionHeader eyebrow={t('reserves.eyebrow')} title={t('reserves.title')} lede={t('reserves.lede')} />

      <div className="divide-y divide-border rounded-2xl border border-border bg-bg2">
        {bars.map((b) => (
          <div key={b.token.xml} className="flex items-center gap-6 p-5">
            <div className="flex w-40 shrink-0 items-center gap-3">
              <TokenIcon token={b.token} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-fg">{b.token.symbol}</div>
                <div className="truncate text-xs text-subtle">{b.token.name}</div>
              </div>
            </div>

            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg3">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                whileInView={{ width: `${b.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="w-28 shrink-0 text-right text-sm tabular-nums text-muted">
              <CountUp value={b.reserve} format={fmtCompact} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-subtle">{t('reserves.note')}</p>
    </Section>
  )
}
