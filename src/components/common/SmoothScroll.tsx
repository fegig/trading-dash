import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import Lenis from 'lenis'

export default function SmoothScroll() {
  const location = useLocation()
  const lenisRef = useRef<Lenis | null>(null)
  const useSmoothScroll = !location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!useSmoothScroll || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lenisRef.current?.destroy()
      lenisRef.current = null
      return
    }

    const lenis = new Lenis({
      autoRaf: true,
      anchors: { offset: 96 },
      allowNestedScroll: true,
      lerp: 0.08,
      smoothWheel: true,
      stopInertiaOnNavigate: true,
    })

    lenisRef.current = lenis

    return () => {
      lenis.destroy()
      if (lenisRef.current === lenis) {
        lenisRef.current = null
      }
    }
  }, [useSmoothScroll])

  useEffect(() => {
    if (typeof window === 'undefined' || location.hash) return

    const frameId = window.requestAnimationFrame(() => {
      if (lenisRef.current) {
        lenisRef.current.resize()
        lenisRef.current.scrollTo(0, { immediate: true, force: true })
        return
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [location.hash, location.pathname, location.search])

  return null
}
