import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PixiOverlay, PixiStage } from '@/components/PixiStage'
import { Title } from '@/components/Title'

gsap.registerPlugin(ScrollTrigger)

const App = () => {
  const heroRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    const scene = sceneRef.current
    if (!hero || !scene) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        scene,
        {
          x: 0,
          y: 0,
          scale: 1,
          rotateY: 0,
          rotateZ: 0,
          transformOrigin: '60% 40%',
        },
        {
          // Turn left while the whole scene drifts out top-right.
          x: () => window.innerWidth * 0.42,
          y: () => -window.innerHeight * 0.55,
          scale: 0.88,
          rotateY: -38,
          rotateZ: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: '+=100%',
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
          },
        },
      )
    }, hero)

    return () => ctx.revert()
  }, [])

  return (
    <main className="relative bg-[var(--color-bg)]">
      <section
        ref={heroRef}
        className="relative h-dvh overflow-hidden"
        style={{ perspective: '1400px' }}
      >
        <div
          ref={sceneRef}
          className="absolute inset-0 flex items-end pb-[30dvh] will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <PixiStage />
          <div className="relative z-10 w-full">
            <Title />
          </div>
          <PixiOverlay />
        </div>
      </section>

      <section className="relative h-dvh bg-[var(--color-bg)]" aria-hidden />
    </main>
  )
}

export default App
