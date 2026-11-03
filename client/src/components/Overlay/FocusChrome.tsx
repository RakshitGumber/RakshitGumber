import { useEffect, useState } from 'react'
import type { GadgetDef } from '../Objects/RetroGadget'

export type FocusInfo = Pick<GadgetDef, 'accent' | 'ink' | 'title' | 'detail'>

type FocusChromeProps = {
  focus: FocusInfo | null
}

const EXIT_MS = 1100

export function FocusChrome({ focus }: FocusChromeProps) {
  const [shown, setShown] = useState<FocusInfo | null>(focus)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (focus) {
      setShown(focus)
      setEntered(false)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true))
      })
      return () => cancelAnimationFrame(id)
    }

    setEntered(false)
    const id = window.setTimeout(() => setShown(null), EXIT_MS)
    return () => window.clearTimeout(id)
  }, [focus])

  const tone = shown ?? focus
  if (!tone) return null

  const active = entered

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden={!active}
    >
      <p
        className={[
          'absolute left-0 right-0 top-[7%] px-6 text-center text-[clamp(2rem,6vw,4.5rem)] leading-none tracking-tight',
          'transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          active
            ? 'translate-x-0 translate-y-0 opacity-100'
            : '-translate-x-[40vw] -translate-y-[30vh] opacity-0',
        ].join(' ')}
        style={{ color: tone.ink, fontFamily: "'Archivo Black', Impact, sans-serif" }}
      >
        {tone.title}
      </p>
      <p
        className={[
          'absolute bottom-[8%] left-0 right-0 px-6 text-center text-[clamp(0.95rem,2.4vw,1.35rem)] font-medium tracking-[0.18em] uppercase',
          'transition-[transform,opacity] duration-[900ms] delay-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
          active
            ? 'translate-x-0 translate-y-0 opacity-100'
            : 'translate-x-[40vw] translate-y-[30vh] opacity-0',
        ].join(' ')}
        style={{ color: tone.ink, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
      >
        {tone.detail}
      </p>
    </div>
  )
}
