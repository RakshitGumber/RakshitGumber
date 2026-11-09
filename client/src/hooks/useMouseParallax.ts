import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'

export const PARALLAX_X = 24
export const PARALLAX_Y = 16

type ParallaxOpts = {
  /** GSAP follow duration — lower is snappier. */
  duration?: number
  amountX?: number
  amountY?: number
}

/** Soft opposite-direction drift from window mouse position. */
export const useMouseParallax = (
  ref: RefObject<HTMLElement | null>,
  { duration = 0.55, amountX = PARALLAX_X, amountY = PARALLAX_Y }: ParallaxOpts = {},
) => {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const xTo = gsap.quickTo(el, 'x', { duration, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration, ease: 'power3.out' })

    const onMove = (event: MouseEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5
      const ny = event.clientY / window.innerHeight - 0.5
      xTo(-nx * 2 * amountX)
      yTo(-ny * 2 * amountY)
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [ref, duration, amountX, amountY])
}
