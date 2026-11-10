import { useEffect, useRef } from 'react'

/** Thin ring that follows the pointer, stretches on travel, wraps hovered frames. */
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

    // Live under the station shell, before the deck, so morph can stack behind the tuner.
    const homeInShell = () => {
      const shell = document.querySelector('.d-stations .t')
      const deck = shell?.querySelector('.deck')
      if (!shell || !deck || el.parentElement === shell) return
      shell.insertBefore(el, deck)
    }
    homeInShell()
    const mo = new MutationObserver(homeInShell)
    mo.observe(document.body, { childList: true, subtree: true })

    const clearHot = () => {
      if (hot instanceof HTMLElement) hot.classList.remove('is-hot')
      hot = null
      el.classList.remove('is-morph')
      el.style.removeProperty('--cursor-glow')
      el.style.removeProperty('width')
      el.style.removeProperty('height')
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

      clearHot()
      hot = next

      if (next instanceof HTMLElement) {
        const glow = next.dataset.cursorGlow || getComputedStyle(next).getPropertyValue('--panel').trim()
        next.classList.add('is-hot')
        el.classList.add('is-morph')
        if (glow) el.style.setProperty('--cursor-glow', glow)
      }
    }

    const onLeave = () => {
      visible = false
      el.style.opacity = '0'
      clearHot()
    }

    const tick = () => {
      // On a frame, glide to its centre and take its size; otherwise trail the pointer.
      const box = hot instanceof HTMLElement ? hot.getBoundingClientRect() : null
      const gx = box ? box.left + box.width / 2 : tx
      const gy = box ? box.top + box.height / 2 : ty
      x += (gx - x) * 0.38
      y += (gy - y) * 0.38

      if (box) {
        el.style.width = `${box.width + 14}px`
        el.style.height = `${box.height + 14}px`
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      } else {
        const speed = Math.hypot(vx, vy)
        const angle = Math.atan2(vy, vx) * (180 / Math.PI)
        const stretch = Math.min(speed * 0.065, 0.9)
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.5})`
      }

      vx *= 0.82
      vy *= 0.82
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      mo.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.classList.remove('rg-cursor-on')
      clearHot()
    }
  }, [])

  return <div ref={ref} className="rg-cursor" aria-hidden />
}
