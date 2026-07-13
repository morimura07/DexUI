import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The geometry contract for the landing page.
 *
 * Every section shares one container width, one gutter, and one vertical rhythm,
 * so left edges and spacing line up by construction rather than by eye. Do not
 * add ad-hoc padding to a section's children — change it here or nowhere.
 *
 * Backgrounds span the full viewport; content is capped by the container. That
 * is what allows full-bleed dividers with aligned content.
 */
export function Section({
  id,
  children,
  className,
  bleed,
  divider = true,
}: {
  id?: string
  children: ReactNode
  /** Applied to the outer, full-bleed element. */
  className?: string
  /** Rendered edge-to-edge, outside the container (e.g. the ticker). */
  bleed?: ReactNode
  divider?: boolean
}) {
  return (
    <section
      id={id}
      className={cn('relative w-full py-24 md:py-32', divider && 'border-t border-border', className)}
    >
      {bleed}
      <div className="mx-auto w-full max-w-content px-6 lg:px-8">{children}</div>
    </section>
  )
}

/** Consistent eyebrow → heading → lede stack. `mb-12` is part of the rhythm. */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={cn('mb-12', align === 'center' && 'mx-auto max-w-3xl text-center', className)}>
      {eyebrow && (
        <div className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-brand-fg">{eyebrow}</div>
      )}
      <h2 className="text-balance text-4xl font-light leading-[1.05] text-fg md:text-5xl lg:text-6xl">{title}</h2>
      {lede && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">{lede}</p>}
    </div>
  )
}
