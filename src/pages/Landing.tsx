import { Navbar } from '@/components/landing/navbar'
import { LenisProvider } from '@/components/landing/lenis-provider'
import { useRoutes } from '@/components/landing/use-routes'
import { Hero } from '@/components/landing/sections/hero'
import { Ticker } from '@/components/landing/sections/ticker'
import { HowItWorks } from '@/components/landing/sections/how-it-works'
import { Markets } from '@/components/landing/sections/markets'
import { Directions } from '@/components/landing/sections/directions'
import { Why } from '@/components/landing/sections/why'
import { Reserves } from '@/components/landing/sections/reserves'
import { Reviews } from '@/components/landing/sections/reviews'
import { Faq } from '@/components/landing/sections/faq'
import { Cta } from '@/components/landing/sections/cta'
import { Footer } from '@/components/Common'
import ChatWidget from '@/components/ChatWidget'

export default function Landing() {
  // One fetch, shared by the hero stat, the ticker, the directions grid and reserves.
  const routeState = useRoutes()

  return (
    <LenisProvider>
      <main className="relative w-full overflow-hidden bg-bg text-fg">
        <Navbar />

        <Hero routeState={routeState} />
        <Ticker {...routeState} />
        <HowItWorks />
        <Markets />
        <Directions {...routeState} />
        <Why />
        <Reserves {...routeState} />
        <Reviews />
        <Faq />
        <Cta />

        <Footer />
        <ChatWidget />
      </main>
    </LenisProvider>
  )
}
