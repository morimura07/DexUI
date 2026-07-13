import type { CSSProperties } from 'react'

/**
 * The hero object. It encodes the product's central promise: your rate is locked
 * for 60 minutes.
 *
 *  - 60 radial ticks, one per minute; every fifth is brighter.
 *  - An outer arc that DRAINS over one loop, reading as a countdown.
 *  - Concentric hairlines for depth, a lock glyph at centre.
 *
 * Every colour is a theme var, so it flips with `.dark` and costs no assets,
 * no external script, and no 3D runtime.
 */

const SIZE = 400
const C = SIZE / 2 // centre
const R_ARC = 170
const CIRCUMFERENCE = 2 * Math.PI * R_ARC // ≈ 1068.14

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const angle = (i * 6 - 90) * (Math.PI / 180) // 6° per minute, 0 at 12 o'clock
  const isFive = i % 5 === 0
  const rOuter = 152
  const rInner = isFive ? 138 : 145
  return {
    i,
    isFive,
    x1: C + rInner * Math.cos(angle),
    y1: C + rInner * Math.sin(angle),
    x2: C + rOuter * Math.cos(angle),
    y2: C + rOuter * Math.sin(angle),
  }
})

export function RateLockRing({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Brand halo */}
      <circle cx={C} cy={C} r={96} fill="var(--brand)" opacity={0.07} />

      {/* Concentric hairlines */}
      <circle cx={C} cy={C} r={128} stroke="var(--line)" strokeWidth={1} />
      <circle cx={C} cy={C} r={96} stroke="var(--line)" strokeWidth={1} />

      {/* Minute ticks */}
      <g>
        {TICKS.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isFive ? 'var(--brand-fg)' : 'var(--line)'}
            strokeWidth={t.isFive ? 1.5 : 1}
            strokeLinecap="round"
            opacity={t.isFive ? 0.9 : 0.55}
          />
        ))}
      </g>

      {/* Track + draining countdown arc. Rotated so it starts at 12 o'clock. */}
      <g transform={`rotate(-90 ${C} ${C})`}>
        <circle cx={C} cy={C} r={R_ARC} stroke="var(--line)" strokeWidth={2} />
        <circle
          cx={C}
          cy={C}
          r={R_ARC}
          stroke="var(--brand)"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="animate-lock-sweep"
          style={
            {
              '--ring-circumference': `${CIRCUMFERENCE}px`,
              strokeDasharray: CIRCUMFERENCE,
              // Static pose under prefers-reduced-motion: ~45 minutes left.
              strokeDashoffset: CIRCUMFERENCE * 0.25,
            } as CSSProperties
          }
        />
      </g>

      {/* Lock glyph */}
      <g transform={`translate(${C - 18} ${C - 22})`} stroke="var(--brand-fg)" strokeWidth={2.2} strokeLinecap="round">
        <rect x={4} y={16} width={28} height={22} rx={5} stroke="var(--brand-fg)" />
        <path d="M11 16v-5a7 7 0 0 1 14 0v5" />
        <circle cx={18} cy={27} r={2.4} fill="var(--brand-fg)" stroke="none" />
      </g>

      <text
        x={C}
        y={C + 58}
        textAnchor="middle"
        className="fill-subtle text-[11px] font-medium uppercase tracking-[0.28em]"
        style={{ fontSize: 11, letterSpacing: '0.28em' }}
      >
        60 min lock
      </text>
    </svg>
  )
}
