import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useMouseParallax } from '@/hooks/useMouseParallax'

const ENGLISH_LEN = 7
const HOLD_MS = 5000
const FLIP_OUT = 0.22
const FLIP_IN = 0.28

const LOCALES = [
  {
    id: 'en',
    chars: ['R', 'A', 'K', 'S', 'H', 'I', 'T'],
    font: 'DM Sans',
  },
  {
    id: 'hi',
    chars: ['र', 'क्षि', 'त'],
    font: 'Tiro Devanagari Marathi',
  },
  {
    id: 'ja',
    chars: ['ラ', 'ク', 'シ', 'ッ', 'ト'],
    font: 'UoqMunThenKhung',
  },
] as const

export const Title = () => {
  const [index, setIndex] = useState(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const locale = LOCALES[index]
  const trackWidth = `${(locale.chars.length / ENGLISH_LEN) * 100}%`

  useMouseParallax(titleRef)

  useEffect(() => {
    const letters = rowRef.current?.querySelectorAll('[data-letter]')
    if (!letters?.length) return

    gsap.fromTo(
      letters,
      { opacity: 0, rotationX: -90 },
      {
        opacity: 1,
        rotationX: 0,
        duration: FLIP_IN,
        stagger: 0.03,
        ease: 'power2.out',
      },
    )
  }, [index])

  useEffect(() => {
    const id = window.setInterval(() => {
      const letters = rowRef.current?.querySelectorAll('[data-letter]')
      if (!letters?.length) {
        setIndex((i) => (i + 1) % LOCALES.length)
        return
      }

      gsap.to(letters, {
        opacity: 0,
        rotationX: 90,
        duration: FLIP_OUT,
        stagger: 0.025,
        ease: 'power2.in',
        onComplete: () => setIndex((i) => (i + 1) % LOCALES.length),
      })
    }, HOLD_MS)

    return () => window.clearInterval(id)
  }, [])

  return (
    <h1
      ref={titleRef}
      className="w-full px-[1.5vw] text-[clamp(3.5rem,16vw,14rem)] font-bold uppercase leading-none text-[var(--color-title)] select-none will-change-transform"
      style={{
        fontFamily: `"${locale.font}", sans-serif`,
        perspective: '900px',
      }}
      aria-label="Rakshit"
    >
      <div
        ref={rowRef}
        className="mx-auto flex justify-between"
        style={{ width: trackWidth, transformStyle: 'preserve-3d' }}
        lang={locale.id}
      >
        {locale.chars.map((char, i) => (
          <span
            key={`${locale.id}-${i}`}
            data-letter
            className="inline-block will-change-transform"
            style={{ transformOrigin: '50% 50%', transformStyle: 'preserve-3d' }}
          >
            {char}
          </span>
        ))}
      </div>
    </h1>
  )
}
