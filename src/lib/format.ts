/**
 * Number formatting.
 *
 * This is the seam for i18n: today everything runs on the browser's default
 * locale. When react-i18next lands, thread the active locale through here
 * instead of chasing ~60 ad-hoc `toLocaleString` / `toFixed` calls.
 */

/** Matches Exchange.jsx: values below 1 get 8dp, everything else 2dp. */
export function fmtAmt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const dp = n !== 0 && Math.abs(n) < 1 ? 8 : 2
  return n.toLocaleString(undefined, { maximumFractionDigits: dp })
}

/** 1.2M / 4.5K, for reserve bars and stat tiles. */
export function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`
  return fmtAmt(n)
}

export function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}
