import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { PetalField } from '@/components/petals/PetalField'
import { PARALLAX_X, PARALLAX_Y, PETAL_COUNT } from '@/components/petals/petalMotion'

/** Mounts a PetalField on a host div and drives light mouse parallax. */
export const usePetalField = (count = PETAL_COUNT) => {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const xTo = gsap.quickTo(host, 'x', { duration: 0.55, ease: 'power3.out' })
    const yTo = gsap.quickTo(host, 'y', { duration: 0.55, ease: 'power3.out' })

    const onMove = (event: MouseEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5
      const ny = event.clientY / window.innerHeight - 0.5
      xTo(-nx * 2 * PARALLAX_X)
      yTo(-ny * 2 * PARALLAX_Y)
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const field = new PetalField(count)
    void field.mount(host)

    return () => {
      field.destroy()
      host.replaceChildren()
    }
  }, [count])

  return hostRef
}
