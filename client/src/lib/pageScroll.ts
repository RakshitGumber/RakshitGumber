import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const map = new WeakMap<HTMLElement, Lenis>()

/** Attach Lenis to a `.rg-page-body`. Dial owns wheel; Lenis only smooths. */
export function bindPageScroll(body: HTMLElement) {
  const existing = map.get(body)
  if (existing) return existing

  const content = body.querySelector<HTMLElement>(':scope > .rg-page-scroll')
  if (!content) return null

  const lenis = new Lenis({
    wrapper: body,
    content,
    autoRaf: true,
    // Dial captures wheel/touch edge cases; feed scroll via scrollTo.
    virtualScroll: () => false,
  })
  map.set(body, lenis)
  return lenis
}

export function pageLenis(host: HTMLElement | null | undefined) {
  return host ? map.get(host) : undefined
}

export function unbindPageScroll(body: HTMLElement) {
  const lenis = map.get(body)
  if (!lenis) return
  lenis.destroy()
  map.delete(body)
}

/** Smooth-scroll content by a wheel/touch delta (px). */
export function scrollPageBy(host: HTMLElement, delta: number) {
  const lenis = map.get(host)
  if (!lenis) {
    host.scrollTop += delta
    return
  }
  lenis.scrollTo(lenis.targetScroll + delta)
}

/** Jump or ease to an absolute scroll offset. */
export function scrollPageTo(
  host: HTMLElement,
  target: number | Element,
  opts?: { immediate?: boolean },
) {
  const lenis = map.get(host)
  if (!lenis) {
    if (typeof target === 'number') host.scrollTop = target
    else target.scrollIntoView({ behavior: opts?.immediate ? 'auto' : 'smooth', block: 'start' })
    return
  }
  lenis.scrollTo(target, { immediate: opts?.immediate })
}
