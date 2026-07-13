import { useEffect, useRef, useState } from 'react'

export interface Coin {
  id: string
  rank: number
  symbol: string
  name: string
  image: string
  price: number
  change24h: number
  marketCap: number
  volume: number
  sparkline: number[]
}

export interface MarketsState {
  coins: Coin[]
  loading: boolean
  failed: boolean
  updatedAt: number | null
}

const ENDPOINT =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1&sparkline=true&price_change_percentage=24h'

const POLL_MS = 30_000

/**
 * Live top-market data from CoinGecko's public (keyless) API. Polls every 30s so
 * prices stay current. On a failed refresh it keeps the last good data on screen
 * rather than flashing an error — only a first-load failure surfaces `failed`.
 */
export function useMarkets(): MarketsState {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const hasData = useRef(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const res = await fetch(ENDPOINT, { headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data: unknown = await res.json()
        if (!alive || !Array.isArray(data)) throw new Error('bad payload')

        const mapped: Coin[] = data.map((c: Record<string, any>, i: number) => ({
          id: String(c.id ?? i),
          rank: c.market_cap_rank ?? i + 1,
          symbol: String(c.symbol ?? '').toUpperCase(),
          name: String(c.name ?? ''),
          image: String(c.image ?? ''),
          price: Number(c.current_price ?? 0),
          change24h: Number(c.price_change_percentage_24h ?? 0),
          marketCap: Number(c.market_cap ?? 0),
          volume: Number(c.total_volume ?? 0),
          sparkline: Array.isArray(c.sparkline_in_7d?.price) ? c.sparkline_in_7d.price : [],
        }))

        hasData.current = true
        setCoins(mapped)
        setFailed(false)
        setUpdatedAt(Date.now())
      } catch {
        // Keep showing the last good data; only fail loudly if we never loaded.
        if (alive && !hasData.current) setFailed(true)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { coins, loading, failed, updatedAt }
}
