import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { SwapCard } from '../swap-card'
import { RateLockRing } from '../rate-lock-ring'
import { useT } from '@/lib/i18n'
import { CountUp } from '@/lib/motion'
import type { RoutesState } from '../use-routes'

/** The four background lines. Scroll-linked opacity/scale, as in the original. */
const LINE_PATHS = [
  'M510.086 0.543457L507.556 840.047C506.058 1337.18 318.091 1803.4 1.875 2094.29',
  'M929.828 0.543457L927.328 829.877C925.809 1334 737.028 1807.4 418.435 2106',
  'M1341.9 0.543457L1344.4 829.876C1345.92 1334 1534.7 1807.4 1853.29 2106',
  'M1758.96 0.543457L1761.49 840.047C1762.99 1337.18 1950.96 1803.4 2267.17 2094.29',
]

function BackgroundLines({ opacity, scale }: { opacity: number; scale: number }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen transition-all duration-100"
      style={{ opacity, transform: `scale(${scale})` }}
      aria-hidden="true"
    >
      <div className="bg-lines-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2269 2108"
          fill="none"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {LINE_PATHS.map((d, i) => (
            <path key={`static-${i}`} d={d} stroke="var(--fg)" strokeWidth="1" strokeMiterlimit="10" opacity="0.12" />
          ))}
          {LINE_PATHS.map((d, i) => (
            <path
              key={`race-${i}`}
              d={d}
              stroke="var(--brand)"
              strokeWidth="2"
              strokeMiterlimit="10"
              strokeDasharray="100px 99999px"
              className={`animate-line-race-${i + 1}`}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

export function Hero({ routeState }: { routeState: RoutesState }) {
  const navigate = useNavigate()
  const t = useT()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => setProgress(Math.min(window.scrollY / window.innerHeight, 1))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  // Only shown once we actually know it — never a placeholder number.
  const pairCount = routeState.routes.length
  const stats: { value?: string; num?: number; label: string }[] = [
    ...(pairCount > 0 ? [{ num: pairCount, label: t('hero.statPairs') }] : []),
    { value: '24/7', label: t('hero.statSupport') },
    { value: '5–60 min', label: t('hero.statSettlement') },
  ]

  return (
    <>
      <BackgroundLines opacity={1 - progress} scale={1 - progress * 0.3} />

      <section className="relative z-20 mx-auto flex min-h-screen w-full max-w-content items-center px-6 pb-24 pt-32 lg:px-8">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">
          <div className="max-w-2xl">
            <div className="animate-fade-in mb-10 inline-flex items-center gap-3 rounded-full border border-border bg-bg2/60 py-1.5 pl-1.5 pr-4">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-green/15">
                <span className="h-2 w-2 rounded-full bg-green" />
              </span>
              <span className="text-sm text-muted">{t('hero.badge')}</span>
            </div>

            <h1 className="animate-fade-in-up mb-8 text-balance text-6xl font-light leading-[1] text-fg md:text-7xl lg:text-8xl">
              {t('hero.title')}
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mb-12 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              {t('hero.subtitle')}
            </p>

            <div className="animate-fade-in-up animation-delay-400 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/exchange')}
                className="group rounded-full bg-brand px-8 py-6 text-base text-white transition-all duration-500 hover:scale-[1.02] hover:bg-brand-h"
              >
                {t('hero.start')}
                <CircleArrowRight className="ml-2 h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo('how-it-works')}
                className="rounded-full border-border bg-transparent px-8 py-6 text-base text-fg transition-all duration-300 hover:bg-fg/5"
              >
                {t('hero.how')}
              </Button>
            </div>

            <div className="animate-fade-in-up animation-delay-400 mt-16 flex max-w-lg flex-wrap gap-x-12 gap-y-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-light text-fg md:text-3xl">
                    {s.num != null ? <CountUp value={s.num} /> : s.value}
                  </div>
                  <div className="mt-1 text-sm text-subtle">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* The ring sits behind the card: the promise, then the instrument. */}
          <div className="animate-fade-in-up animation-delay-200 relative flex justify-center lg:justify-end">
            <RateLockRing className="pointer-events-none absolute -z-10 hidden h-[560px] w-[560px] -translate-y-6 opacity-90 lg:block" />
            <SwapCard {...routeState} />
          </div>
        </div>
      </section>
    </>
  )
}
