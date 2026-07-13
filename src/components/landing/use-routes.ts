import { useEffect, useState } from 'react'
import { fetchBeeSwapRoutes } from '@/api/client'

export interface TokenImage {
  type: string
  url: string
}

export interface Token {
  xml: string
  symbol: string
  name: string
  min?: string | number
  max?: string | number
  decimal?: number
  image?: { files?: TokenImage[] }
}

export interface Route {
  routeId?: string
  reserve?: string | number
  rate?: { in?: string | number; out?: string | number }
  from: Token
  to: Token
}

export interface RoutesState {
  routes: Route[]
  loading: boolean
  failed: boolean
}

/** Fetches the admin-managed exchange routes once. Same source Exchange.jsx uses. */
export function useRoutes(): RoutesState {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchBeeSwapRoutes()
      .then((r: Route[]) => {
        if (cancelled) return
        setRoutes(r ?? [])
        setFailed(!r || r.length === 0)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { routes, loading, failed }
}
