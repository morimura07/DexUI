import { useNavigate } from 'react-router-dom'
import { CircleArrowRight } from 'lucide-react'
import { Section } from '../section'
import { Button } from '../ui/button'
import { RateLockRing } from '../rate-lock-ring'
import { useT } from '@/lib/i18n'

export function Cta() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <Section id="start" className="overflow-hidden">
      {/* An echo of the hero motif, not a repeat of it: same object, quieter. */}
      <RateLockRing
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 opacity-[0.14]"
      />

      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-light leading-[1.05] text-fg md:text-5xl lg:text-6xl">
          {t('cta.title')}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {t('cta.lede')}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/exchange')}
            className="group rounded-full bg-brand px-8 py-6 text-base text-white transition-all duration-500 hover:scale-[1.02] hover:bg-brand-h"
          >
            {t('cta.start')}
            <CircleArrowRight className="ml-2 h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/contacts')}
            className="rounded-full border-border bg-transparent px-8 py-6 text-base text-fg transition-all duration-300 hover:bg-fg/5"
          >
            {t('cta.support')}
          </Button>
        </div>

        <p className="mt-8 text-sm text-subtle">{t('cta.note')}</p>
      </div>
    </Section>
  )
}
