import { useEffect, useRef } from 'react'

/** Thin ~40px ring that follows the pointer and stretches along travel. */
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
    }

    const onLeave = () => {
      visible = false
      el.style.opacity = '0'
    }

    const tick = () => {
      x += (tx - x) * 0.38
      y += (ty - y) * 0.38

      const speed = Math.hypot(vx, vy)
      const angle = Math.atan2(vy, vx) * (180 / Math.PI)
      const stretch = Math.min(speed * 0.065, 0.9)

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
    }
  }, [])

  return <div ref={ref} className="rg-cursor" aria-hidden />
}
