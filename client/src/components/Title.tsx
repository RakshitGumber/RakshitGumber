import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const ENGLISH_LEN = 7

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
  const rowRef = useRef<HTMLDivElement>(null)
  const locale = LOCALES[index]
  const trackWidth = `${(locale.chars.length / ENGLISH_LEN) * 100}%`

  useEffect(() => {
    const letters = rowRef.current?.querySelectorAll('[data-letter]')
    if (!letters?.length) return

    gsap.fromTo(
      letters,
      { opacity: 0, y: '0.35em' },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.05,
        ease: 'power3.out',
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
        y: '-0.25em',
        duration: 0.4,
        stagger: 0.03,
        ease: 'power2.in',
        onComplete: () => setIndex((i) => (i + 1) % LOCALES.length),
      })
    }, 5000)

    return () => window.clearInterval(id)
  }, [])

  return (
    <h1
      className="w-full px-[4vw] text-[clamp(2.5rem,11vw,9rem)] font-bold uppercase leading-none text-[var(--color-title)]"
      style={{ fontFamily: `"${locale.font}", sans-serif` }}
      aria-label="Rakshit"
    >
      <div
        ref={rowRef}
        className="mx-auto flex justify-between"
        style={{ width: trackWidth }}
        lang={locale.id}
      >
        {locale.chars.map((char, i) => (
          <span
            key={`${locale.id}-${i}`}
            data-letter
            className="inline-block will-change-transform"
          >
            {char}
          </span>
        ))}
      </div>
    </h1>
  )
}
