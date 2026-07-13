import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Section, SectionHeader } from '../section'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { GlowingEffect } from '../ui/glowing-effect'
import { useT } from '@/lib/i18n'

function FeatureCard({ title, body, to }: { title: string; body: string; to: string }) {
  const t = useT()
  return (
    <div className="relative rounded-2xl border border-border p-3">
      <GlowingEffect blur={0} borderWidth={2} spread={80} glow disabled={false} proximity={64} inactiveZone={0.01} />
      <div className="relative rounded-xl bg-bg2 p-8">
        <h3 className="mb-4 text-2xl font-light text-fg">{title}</h3>
        <p className="mb-6 leading-relaxed text-muted">{body}</p>
        <Link to={to} className="group inline-flex items-center text-fg transition-colors hover:text-brand-fg">
          <span className="underline underline-offset-4">{t('why.learnMore')}</span>
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

const TRIGGER =
  'rounded-full px-8 py-3 text-muted transition-all data-[state=active]:bg-brand data-[state=active]:text-white'

export function Why() {
  const t = useT()
  const FEATURES = {
    exchange: [
      { title: t('why.f1t'), body: t('why.f1b'), to: '/rules' },
      { title: t('why.f2t'), body: t('why.f2b'), to: '/about' },
    ],
    security: [
      { title: t('why.f3t'), body: t('why.f3b'), to: '/kyc' },
      { title: t('why.f4t'), body: t('why.f4b'), to: '/rules' },
    ],
  }

  return (
    <Section id="why">
      <SectionHeader eyebrow={t('why.eyebrow')} title={t('why.title')} lede={t('why.lede')} />

      <Tabs defaultValue="exchange" className="w-full">
        <TabsList className="mb-8 h-auto w-fit rounded-full border border-border bg-bg2 p-1">
          <TabsTrigger value="exchange" className={TRIGGER}>
            {t('why.tabExchange')}
          </TabsTrigger>
          <TabsTrigger value="security" className={TRIGGER}>
            {t('why.tabSecurity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exchange" className="mt-8">
          <div className="grid gap-8 md:grid-cols-2">
            {FEATURES.exchange.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-8">
          <div className="grid gap-8 md:grid-cols-2">
            {FEATURES.security.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Section>
  )
}
