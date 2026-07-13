import { Section, SectionHeader } from '../section'
import { useT } from '@/lib/i18n'

export function HowItWorks() {
  const t = useT()
  const STEPS = [
    { n: '01', title: t('how.s1t'), body: t('how.s1b') },
    { n: '02', title: t('how.s2t'), body: t('how.s2b') },
    { n: '03', title: t('how.s3t'), body: t('how.s3b') },
    { n: '04', title: t('how.s4t'), body: t('how.s4b') },
  ]

  return (
    <Section id="how-it-works">
      <SectionHeader eyebrow={t('how.eyebrow')} title={t('how.title')} lede={t('how.lede')} />

      <ol className="relative grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* The connector: one hairline through every node, drawn only where the row exists. */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-[15px] hidden h-px bg-border lg:block"
          aria-hidden="true"
        />

        {STEPS.map((s) => (
          <li key={s.n} className="relative">
            <div className="mb-6 flex items-center gap-4">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-[11px] font-medium tabular-nums text-brand-fg">
                {s.n}
              </span>
              <span className="h-px flex-1 bg-border lg:hidden" aria-hidden="true" />
            </div>
            <h3 className="mb-3 text-xl font-normal text-fg">{s.title}</h3>
            <p className="text-base leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
