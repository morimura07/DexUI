import { forwardRef, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { motion, animate, useInView, useReducedMotion, type Variants, type Transition } from 'motion/react'

/**
 * Motion foundation — a small, shared vocabulary so animation across the app is
 * consistent in feel (refined, subtle) but varied in expression. Components pick
 * the variant that suits their location and state rather than all using one.
 *
 * Reduced motion is honoured globally via <MotionConfig reducedMotion="user">
 * in main.jsx, so these presets don't each need to guard for it.
 */

/** Easing curves. `out` = expo-out (fast start, soft landing) is the house curve. */
export const EASE = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  soft: [0.25, 0.46, 0.45, 0.94],
} as const

export const DUR = { fast: 0.22, base: 0.42, slow: 0.62 } as const

const t = (d: number = DUR.base, ease: readonly number[] = EASE.out, delay = 0): Transition => ({
  duration: d,
  ease: [...ease],
  delay,
})

/* ── Entrance variants — same soul, different direction/quality ─────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: t() },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: t() },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t(DUR.slow) },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: t() },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: t() },
}

/** For cards / media: a whisper of scale + lift reads as "settling into place". */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: t() },
}

/** For hero words / focal text: rises through a soft blur. */
export const blurUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: t(DUR.slow) },
}

export const VARIANTS = { fadeUp, fadeDown, fadeIn, fadeLeft, fadeRight, scaleIn, blurUp } as const
export type VariantName = keyof typeof VARIANTS

/** Container that reveals its children one after another. */
export function staggerContainer(stagger = 0.08, delayChildren = 0): Variants {
  return { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren } } }
}

/* ── Interaction presets — spread onto any motion element ───────────────────── */

/** Subtle rise + settle on hover; gentle push on press. For cards / tiles. */
export const lift = {
  whileHover: { y: -4, transition: t(DUR.fast) },
  whileTap: { scale: 0.985, transition: t(DUR.fast) },
} as const

/** Just a press response. For buttons / controls that shouldn't move on hover. */
export const pressable = {
  whileTap: { scale: 0.96, transition: t(DUR.fast) },
} as const

/** Icon / affordance nudge on hover of a parent (use with group patterns). */
export const nudge = {
  whileHover: { x: 2, transition: t(DUR.fast) },
} as const

/* ── Reveal — scroll-triggered entrance, once, reduced-motion-safe ──────────── */

type RevealProps = {
  children: ReactNode
  variant?: VariantName
  /** seconds */
  delay?: number
  /** re-animate every time it enters the viewport */
  repeat?: boolean
  /** fraction visible before it fires */
  amount?: number
} & Omit<ComponentPropsWithoutRef<typeof motion.div>, 'variants' | 'initial' | 'whileInView' | 'children'>

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { children, variant = 'fadeUp', delay = 0, repeat = false, amount = 0.3, transition, ...rest },
  ref,
) {
  const base = VARIANTS[variant]
  const v: Variants = delay
    ? { hidden: base.hidden, show: { ...(base.show as object), transition: { ...t(), delay } } }
    : base
  return (
    <motion.div
      ref={ref}
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once: !repeat, amount, margin: '0px 0px -10% 0px' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
})

/** Reveal a list with a stagger. Wrap items in <RevealItem>. */
export function RevealGroup({
  children,
  stagger = 0.08,
  delayChildren = 0,
  amount = 0.2,
  className,
}: {
  children: ReactNode
  stagger?: number
  delayChildren?: number
  amount?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  variant = 'fadeUp',
  className,
}: {
  children: ReactNode
  variant?: VariantName
  className?: string
}) {
  return (
    <motion.div className={className} variants={VARIANTS[variant]}>
      {children}
    </motion.div>
  )
}

/* ── Page transition — a refined enter on every route change ────────────────── */

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: [...EASE.out] }}
    >
      {children}
    </motion.div>
  )
}

/* ── CountUp — a number that tallies up the first time it scrolls into view ──── */

export function CountUp({
  value,
  duration = 1.1,
  decimals = 0,
  format,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  duration?: number
  decimals?: number
  /** Custom formatter, e.g. `fmtCompact`. Overrides `decimals`. */
  format?: (n: number) => string
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce || !Number.isFinite(value)) {
      setN(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [...EASE.out],
      onUpdate: setN,
    })
    return () => controls.stop()
  }, [inView, value, reduce, duration])

  const body = format ? format(n) : n.toFixed(decimals)
  return (
    <span ref={ref} className={className}>
      {prefix}
      {body}
      {suffix}
    </span>
  )
}

/* ── SuccessCheck — a ring + tick that draw themselves in on mount ──────────── */

export function SuccessCheck({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      className={className}
      initial="hidden"
      animate="show"
      aria-hidden="true"
    >
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: { pathLength: 1, opacity: 1, transition: { duration: 0.55, ease: [...EASE.out] } },
        }}
      />
      <motion.path
        d="M15 27l7.5 7.5L38 19"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0 },
          show: { pathLength: 1, transition: { duration: 0.4, delay: 0.3, ease: [...EASE.out] } },
        }}
      />
    </motion.svg>
  )
}

export { motion }
