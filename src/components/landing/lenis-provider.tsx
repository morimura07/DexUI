import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Smooth scroll is motion. Respect the user's preference and stay out of the way.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    // The rAF handle must be tracked so StrictMode's double-mount doesn't leave a
    // second loop ticking a destroyed Lenis instance.
    let frame = 0
    function raf(time: number) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
