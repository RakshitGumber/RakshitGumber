import { useEffect, useRef } from 'react'

/** Thin ring that follows the pointer, stretches on travel, morphs on panels. */
export const CursorRing = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    document.documentElement.classList.add('rg-cursor-on')

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let tx = x
    let ty = y
    let vx = 0
    let vy = 0
    let raf = 0
    let visible = false
    let hot: Element | null = null

    const clearHot = () => {
      if (hot instanceof HTMLElement) hot.classList.remove('is-hot')
      hot = null
      el.classList.remove('is-morph')
      el.style.removeProperty('--cursor-clip')
      el.style.removeProperty('--cursor-glow')
    }

    const onMove = (event: MouseEvent) => {
      vx = event.clientX - tx
      vy = event.clientY - ty
      tx = event.clientX
      ty = event.clientY
      if (!visible) {
        visible = true
        x = tx
        y = ty
        el.style.opacity = '1'
      }

      const hit = document.elementFromPoint(event.clientX, event.clientY)
      const next = hit?.closest?.('[data-cursor-morph]') ?? null
      if (next === hot) return

      if (hot instanceof HTMLElement) hot.classList.remove('is-hot')
      hot = next

      if (next instanceof HTMLElement) {
        const clip = next.dataset.cursorClip
        const glow = next.dataset.cursorGlow || getComputedStyle(next).getPropertyValue('--panel').trim()
        next.classList.add('is-hot')
        el.classList.add('is-morph')
        if (clip) el.style.setProperty('--cursor-clip', clip)
        if (glow) el.style.setProperty('--cursor-glow', glow)
      } else {
        el.classList.remove('is-morph')
        el.style.removeProperty('--cursor-clip')
        el.style.removeProperty('--cursor-glow')
      }
    }

    const onLeave = () => {
      visible = false
      el.style.opacity = '0'
      clearHot()
    }

    const tick = () => {
      x += (tx - x) * 0.38
      y += (ty - y) * 0.38

      const speed = Math.hypot(vx, vy)
      const angle = Math.atan2(vy, vx) * (180 / Math.PI)
      const stretch = el.classList.contains('is-morph')
        ? Math.min(speed * 0.03, 0.25)
        : Math.min(speed * 0.065, 0.9)

      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.5})`

      vx *= 0.82
      vy *= 0.82
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.classList.remove('rg-cursor-on')
      clearHot()
    }
  }, [])

  return <div ref={ref} className="rg-cursor" aria-hidden />
}
