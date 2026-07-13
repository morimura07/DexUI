import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { TokenIcon } from './token-icon'
import { fmtAmt, toNum } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { Route, RoutesState, Token } from './use-routes'

function TokenSelect({
  token,
  options,
  onChange,
}: {
  token?: Token
  options: Token[]
  onChange: (t: Token) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!token}
        className="flex items-center gap-2 rounded-full bg-bg3 py-1.5 pl-2 pr-3 transition-colors hover:bg-bg4 disabled:opacity-50"
      >
        <TokenIcon token={token} />
        <span className="font-medium text-fg">{token?.symbol ?? '—'}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 max-h-72 w-60 overflow-y-auto rounded-xl border border-border bg-bg2 p-1 shadow-xl">
            {options.map((t) => (
              <button
                key={t.xml}
                type="button"
                onClick={() => {
                  onChange(t)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg3"
              >
                <TokenIcon token={t} size="md" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-fg">{t.symbol}</span>
                  <span className="truncate text-xs text-subtle">{t.name}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const SHELL =
  'w-full max-w-md rounded-3xl border border-border bg-bg2/80 p-5 shadow-2xl backdrop-blur-xl'

export function SwapCard({ routes, loading, failed }: RoutesState) {
  const navigate = useNavigate()
  const t = useT()
  const [fromXml, setFromXml] = useState('CARDUAH')
  const [toXml, setToXml] = useState('USDTTRC20')
  const [give, setGive] = useState('')

  // Exchange.jsx defaults to CARDUAH -> USDTTRC20; fall back if that pair isn't offered.
  useEffect(() => {
    if (!routes.length) return
    const hasDefault = routes.some((r) => r.from?.xml === fromXml && r.to?.xml === toXml)
    if (!hasDefault) {
      setFromXml(routes[0].from.xml)
      setToXml(routes[0].to.xml)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes])

  const fromTokens = useMemo(() => {
    const seen = new Map<string, Token>()
    routes.forEach((r) => {
      if (r.from && !seen.has(r.from.xml)) seen.set(r.from.xml, r.from)
    })
    return [...seen.values()]
  }, [routes])

  const toTokens = useMemo(() => {
    const seen = new Map<string, Token>()
    routes
      .filter((r) => r.from?.xml === fromXml)
      .forEach((r) => {
        if (r.to && !seen.has(r.to.xml)) seen.set(r.to.xml, r.to)
      })
    return [...seen.values()]
  }, [routes, fromXml])

  const route: Route | null = useMemo(
    () => routes.find((r) => r.from?.xml === fromXml && r.to?.xml === toXml) ?? null,
    [routes, fromXml, toXml],
  )

  const canFlip = useMemo(
    () => routes.some((r) => r.from?.xml === toXml && r.to?.xml === fromXml),
    [routes, fromXml, toXml],
  )

  const F = route?.from
  const T = route?.to

  useEffect(() => {
    if (route && !give && F?.min != null) setGive(String(F.min))
  }, [route, give, F])

  const take = useMemo(() => {
    if (!route) return ''
    const amt = toNum(give)
    if (amt <= 0) return ''
    const rateIn = toNum(route.rate?.in ?? 1)
    const rateOut = toNum(route.rate?.out ?? 1)
    return fmtAmt(rateOut > 1 ? amt * rateOut : amt / rateIn)
  }, [give, route])

  const rateDisplay = useMemo(() => {
    if (!route || !F || !T) return null
    const rateIn = toNum(route.rate?.in)
    const rateOut = toNum(route.rate?.out)
    return rateOut > 1
      ? `1 ${F.symbol} = ${rateOut.toFixed(T.decimal ?? 2)} ${T.symbol}`
      : `1 ${T.symbol} = ${rateIn.toFixed(F.decimal ?? 2)} ${F.symbol}`
  }, [route, F, T])

  const handleFrom = (t: Token) => {
    setFromXml(t.xml)
    setGive('')
    if (!routes.some((r) => r.from?.xml === t.xml && r.to?.xml === toXml)) {
      const first = routes.find((r) => r.from?.xml === t.xml)
      if (first) setToXml(first.to.xml)
    }
  }

  const handleFlip = () => {
    if (!canFlip) return
    setFromXml(toXml)
    setToXml(fromXml)
    setGive('')
  }

  if (loading) {
    return (
      <div className={SHELL}>
        <div className="mb-4 h-6 w-24 shimmer rounded bg-bg3" />
        <div className="mb-2 h-28 shimmer rounded-2xl bg-bg3" />
        <div className="h-28 shimmer rounded-2xl bg-bg3" />
        <div className="mt-4 h-14 shimmer rounded-2xl bg-bg3" />
      </div>
    )
  }

  if (failed) {
    return (
      <div className={SHELL}>
        <h2 className="mb-2 text-lg font-medium text-fg">{t('swap.title')}</h2>
        <p className="mb-6 text-sm text-muted">
          {t('swap.unavailable')}
        </p>
        <Button
          onClick={() => navigate('/exchange')}
          className="w-full rounded-2xl bg-brand py-6 text-base font-medium text-white transition-colors hover:bg-brand-h"
        >
          {t('swap.goToExchange')}
        </Button>
      </div>
    )
  }

  return (
    <div className={SHELL}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-fg">{t('swap.title')}</h2>
        {route?.reserve != null && T && (
          <span className="text-xs text-subtle">
            {t('swap.reserve')}: {fmtAmt(toNum(route.reserve))} {T.symbol}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-bg/60 p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-subtle">
          <span>{t('swap.youSend')}</span>
          {F?.min != null && <span>{t('swap.min')}: {fmtAmt(toNum(F.min))}</span>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <input
            inputMode="decimal"
            value={give}
            onChange={(e) => setGive(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            aria-label={t('swap.amountToSend')}
            className="w-full min-w-0 bg-transparent text-3xl font-light text-fg outline-none placeholder:text-subtle"
          />
          <TokenSelect token={F} options={fromTokens} onChange={handleFrom} />
        </div>
      </div>

      <div className="relative z-10 flex justify-center">
        <button
          type="button"
          onClick={handleFlip}
          disabled={!canFlip}
          aria-label={t('swap.reverse')}
          title={canFlip ? t('swap.reverse') : t('swap.noReverse')}
          className="-my-3 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-bg2 bg-bg3 text-fg transition-colors hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-bg3 disabled:hover:text-fg"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-bg/60 p-4">
        <div className="mb-2 text-sm text-subtle">{t('swap.youReceive')}</div>
        <div className="flex items-center justify-between gap-3">
          <input
            readOnly
            value={take}
            placeholder="0"
            aria-label={t('swap.amountToReceive')}
            className="w-full min-w-0 bg-transparent text-3xl font-light text-fg outline-none placeholder:text-subtle"
          />
          <TokenSelect token={T} options={toTokens} onChange={(t) => setToXml(t.xml)} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1 text-sm text-subtle">
        <span>{t('swap.rate')}</span>
        <span className="text-muted">{rateDisplay ?? t('swap.routeUnavailable')}</span>
      </div>

      <Button
        disabled={!route}
        onClick={() => navigate(`/exchange?from=${fromXml}&to=${toXml}`)}
        className="mt-4 w-full rounded-2xl bg-brand py-6 text-base font-medium text-white transition-colors hover:bg-brand-h disabled:opacity-50"
      >
        {route ? t('swap.exchangeNow') : t('swap.routeUnavailable')}
      </Button>
    </div>
  )
}
