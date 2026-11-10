import { useEffect, type RefObject } from 'react'

/**
 * On devices without hover, mark the frame nearest the screen centre as
 * `.is-hot` so it picks up the same colour treatment as desktop hover.
 */
export const useHotFrame = (
  rootRef: RefObject<HTMLElement | null>,
  /** Re-pick when the comic page flips. */
  page = 0,
) => {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (!window.matchMedia('(hover: none)').matches) return

    const scroller = root.closest('.rg-page-body') ?? window
    let hot: Element | null = null
    let ticking = false

    const pick = () => {
      ticking = false
      const frames = root.querySelectorAll('.rg-frame')
      if (!frames.length) return

      const mid = window.innerHeight / 2
      let best: Element | null = null
      let bestDist = Infinity

      for (const frame of frames) {
        const r = frame.getBoundingClientRect()
        // Skip frames fully off-screen.
        if (r.bottom < 0 || r.top > window.innerHeight) continue
        const dist = Math.abs(r.top + r.height / 2 - mid)
        if (dist < bestDist) {
          bestDist = dist
          best = frame
        }
      }

      if (best === hot) return
      hot?.classList.remove('is-hot')
      best?.classList.add('is-hot')
      hot = best
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(pick)
    }

    // Wait a frame after page flip so layout has settled.
    const boot = requestAnimationFrame(pick)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(boot)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      hot?.classList.remove('is-hot')
    }
  }, [rootRef, page])
}
