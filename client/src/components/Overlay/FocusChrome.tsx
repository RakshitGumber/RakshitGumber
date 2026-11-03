import { useEffect, useState } from 'react'
import type { GadgetDef } from '../Objects/RetroGadget'

export type FocusInfo = Pick<GadgetDef, 'accent' | 'ink' | 'title' | 'detail'>

type FocusChromeProps = {
  focus: FocusInfo | null
}

export function FocusChrome({ focus }: FocusChromeProps) {
  const [shown, setShown] = useState<FocusInfo | null>(focus)
  const active = focus !== null

  useEffect(() => {
    if (focus) {
      setShown(focus)
      return
    }
    const id = window.setTimeout(() => setShown(null), 720)
    return () => window.clearTimeout(id)
  }, [focus])

  const tone = shown ?? focus
  if (!tone) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden={!active}
    >
      <p
        className={[
          'absolute left-0 right-0 top-[7%] px-6 text-center text-[clamp(2rem,6vw,4.5rem)] leading-none tracking-tight',
          'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          active ? 'translate-y-0' : '-translate-y-[120vh]',
        ].join(' ')}
        style={{ color: tone.ink, fontFamily: "'Archivo Black', Impact, sans-serif" }}
      >
        {tone.title}
      </p>
      <p
        className={[
          'absolute bottom-[8%] left-0 right-0 px-6 text-center text-[clamp(0.95rem,2.4vw,1.35rem)] font-medium tracking-[0.18em] uppercase',
          'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          active ? 'translate-y-0' : 'translate-y-[120vh]',
        ].join(' ')}
        style={{ color: tone.ink, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
      >
        {tone.detail}
      </p>
    </div>
  )
}
