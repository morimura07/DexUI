import { useState } from 'react'
import { API_BASE } from '@/config'
import type { Token } from './use-routes'

/** Currency images arrive as paths, not URLs, and are served through the backend proxy. */
export function beeswapImg(t?: Token): string | null {
  const path = t?.image?.files?.find((f) => f.type === 'small')?.url
  return path ? `${API_BASE}/public/beeswap/image?path=${encodeURIComponent(path)}` : null
}

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-[10px]',
  lg: 'h-10 w-10 text-xs',
} as const

export function TokenIcon({ token, size = 'sm' }: { token?: Token; size?: keyof typeof SIZES }) {
  const [broken, setBroken] = useState(false)
  const src = beeswapImg(token)
  const dim = SIZES[size]

  if (!src || broken) {
    return (
      <span
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-brand font-medium text-white`}
        aria-hidden="true"
      >
        {token?.symbol?.slice(0, 2) ?? '??'}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      className={`${dim} shrink-0 rounded-full object-contain`}
    />
  )
}
