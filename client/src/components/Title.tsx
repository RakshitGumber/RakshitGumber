import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const ENGLISH_LEN = 7

type FontOption = {
  name: string
  tag: 'sharp' | 'mono' | 'bold' | 'wide' | 'clean'
}

const ENGLISH_FONTS: FontOption[] = [
  { name: 'Montserrat', tag: 'clean' },
  { name: 'Lato', tag: 'clean' },
  { name: 'Poppins', tag: 'clean' },
  { name: 'Figtree', tag: 'clean' },
  { name: 'DM Sans', tag: 'clean' },
  { name: 'Oswald', tag: 'sharp' },
  { name: 'Anton', tag: 'bold' },
  { name: 'Archivo Black', tag: 'bold' },
  { name: 'Bebas Neue', tag: 'sharp' },
  { name: 'Space Grotesk', tag: 'sharp' },
  { name: 'League Spartan', tag: 'bold' },
  { name: 'Chakra Petch', tag: 'wide' },
  { name: 'Russo One', tag: 'wide' },
  { name: 'JetBrains Mono', tag: 'mono' },
  { name: 'Space Mono', tag: 'mono' },
  { name: 'IBM Plex Mono', tag: 'mono' },
]

const HINDI_FONTS: FontOption[] = [
  { name: 'Poppins', tag: 'clean' },
  { name: 'Mukta', tag: 'clean' },
  { name: 'Tiro Devanagari Marathi', tag: 'clean' },
  { name: 'Rhodium Libre', tag: 'clean' },
  { name: 'Teko', tag: 'bold' },
  { name: 'Khand', tag: 'sharp' },
  { name: 'Rajdhani', tag: 'sharp' },
  { name: 'Anek Devanagari', tag: 'wide' },
  { name: 'Yatra One', tag: 'bold' },
  { name: 'IBM Plex Sans Devanagari', tag: 'sharp' },
  { name: 'Noto Sans Devanagari', tag: 'bold' },
  { name: 'Hind', tag: 'wide' },
]

const JAPANESE_FONTS: FontOption[] = [
  { name: 'Shippori Mincho', tag: 'clean' },
  { name: 'UoqMunThenKhung', tag: 'clean' },
  { name: 'Noto Serif JP', tag: 'clean' },
  { name: 'Kaisei Opti', tag: 'clean' },
  { name: 'Dela Gothic One', tag: 'bold' },
  { name: 'Zen Kaku Gothic New', tag: 'sharp' },
  { name: 'Noto Sans JP', tag: 'bold' },
  { name: 'Stick', tag: 'sharp' },
  { name: 'Monomaniac One', tag: 'wide' },
  { name: 'RocknRoll One', tag: 'bold' },
  { name: 'M PLUS 1 Code', tag: 'mono' },
  { name: 'BIZ UDGothic', tag: 'mono' },
  { name: 'IBM Plex Sans JP', tag: 'sharp' },
]

const LOCALES = [
  { id: 'en', chars: ['R', 'A', 'K', 'S', 'H', 'I', 'T'] },
  { id: 'hi', chars: ['र', 'क्षि', 'त'] },
  { id: 'ja', chars: ['ラ', 'ク', 'シ', 'ッ', 'ト'] },
] as const

const pickerClass =
  'rounded border border-[#fffaf2]/25 bg-transparent px-3 py-2 text-sm text-[var(--color-title)] outline-none'

export const Title = () => {
  const [index, setIndex] = useState(0)
  const [englishFont, setEnglishFont] = useState('Oswald')
  const [hindiFont, setHindiFont] = useState('Teko')
  const [japaneseFont, setJapaneseFont] = useState('Dela Gothic One')
  const rowRef = useRef<HTMLDivElement>(null)

  const locale = LOCALES[index]
  const trackWidth = `${(locale.chars.length / ENGLISH_LEN) * 100}%`
  const activeFont =
    locale.id === 'en' ? englishFont : locale.id === 'hi' ? hindiFont : japaneseFont

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
  }, [index, activeFont])

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
    <div className="flex w-full flex-col gap-10 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-center gap-4">
        <label className="flex flex-col gap-1 text-xs tracking-wide text-[var(--color-title)]/60">
          English
          <select
            className={pickerClass}
            value={englishFont}
            onChange={(e) => setEnglishFont(e.target.value)}
          >
            {ENGLISH_FONTS.map((font) => (
              <option key={font.name} value={font.name} className="bg-[var(--color-bg)]">
                {font.name} · {font.tag}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs tracking-wide text-[var(--color-title)]/60">
          Hindi
          <select
            className={pickerClass}
            value={hindiFont}
            onChange={(e) => setHindiFont(e.target.value)}
          >
            {HINDI_FONTS.map((font) => (
              <option key={font.name} value={font.name} className="bg-[var(--color-bg)]">
                {font.name} · {font.tag}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs tracking-wide text-[var(--color-title)]/60">
          Japanese
          <select
            className={pickerClass}
            value={japaneseFont}
            onChange={(e) => setJapaneseFont(e.target.value)}
          >
            {JAPANESE_FONTS.map((font) => (
              <option key={font.name} value={font.name} className="bg-[var(--color-bg)]">
                {font.name} · {font.tag}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h1
        className="w-full px-[4vw] text-[clamp(2.5rem,11vw,9rem)] font-bold uppercase leading-none text-[var(--color-title)]"
        style={{ fontFamily: `"${activeFont}", sans-serif` }}
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

      <div className="flex flex-col items-center gap-6 px-[4vw] text-center">
        <p
          className="w-full text-[clamp(1.5rem,5vw,3.5rem)] font-bold leading-none tracking-[0.35em] text-[var(--color-title)]"
          style={{ fontFamily: `"${englishFont}", sans-serif` }}
        >
          RAKSHIT
        </p>
        <p
          className="w-full text-[clamp(1.5rem,5vw,3.5rem)] font-bold leading-none tracking-[0.35em] text-[var(--color-title)]"
          lang="hi"
          style={{ fontFamily: `"${hindiFont}", sans-serif` }}
        >
          रक्षित
        </p>
        <p
          className="w-full text-[clamp(1.5rem,5vw,3.5rem)] font-bold leading-none tracking-[0.35em] text-[var(--color-title)]"
          lang="ja"
          style={{ fontFamily: `"${japaneseFont}", sans-serif` }}
        >
          ラクシット
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 border-t border-[#fffaf2]/10 pt-8 md:grid-cols-3">
        <FontColumn
          label="English"
          sample="RAKSHIT"
          fonts={ENGLISH_FONTS}
          selected={englishFont}
          onSelect={setEnglishFont}
        />
        <FontColumn
          label="Hindi"
          sample="रक्षित"
          fonts={HINDI_FONTS}
          selected={hindiFont}
          onSelect={setHindiFont}
        />
        <FontColumn
          label="Japanese"
          sample="ラクシット"
          fonts={JAPANESE_FONTS}
          selected={japaneseFont}
          onSelect={setJapaneseFont}
        />
      </div>
    </div>
  )
}

type FontColumnProps = {
  label: string
  sample: string
  fonts: FontOption[]
  selected: string
  onSelect: (font: string) => void
}

const FontColumn = ({ label, sample, fonts, selected, onSelect }: FontColumnProps) => {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs tracking-[0.2em] text-[var(--color-title)]/50 uppercase">{label}</p>
      {fonts.map((font) => {
        const active = font.name === selected
        return (
          <button
            key={font.name}
            type="button"
            onClick={() => onSelect(font.name)}
            className={`rounded border px-3 py-3 text-left transition-colors ${
              active
                ? 'border-[#fffaf2]/50 bg-[#fffaf2]/5'
                : 'border-[#fffaf2]/15 hover:border-[#fffaf2]/30'
            }`}
          >
            <span className="mb-1 flex items-center justify-between gap-2 text-[10px] tracking-wide text-[var(--color-title)]/45">
              <span>{font.name}</span>
              <span className="rounded border border-[#fffaf2]/20 px-1.5 py-0.5 uppercase">
                {font.tag}
              </span>
            </span>
            <span
              className="block text-2xl leading-tight text-[var(--color-title)]"
              style={{ fontFamily: `"${font.name}", sans-serif` }}
            >
              {sample}
            </span>
          </button>
        )
      })}
    </div>
  )
}
