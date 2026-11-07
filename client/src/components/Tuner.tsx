import { useEffect, useRef, useState } from 'react'

export type Station = {
  id: string
  label: string
  title: string
}

type TunerProps = {
  stations: Station[]
  index: number
  onChange: (index: number) => void
}

const GAP = 148
const MINOR_EVERY = 0.25
const WHEEL_STEP = 0.0028
const DRAG_STEP = 0.012

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const Tuner = ({ stations, index, onChange }: TunerProps) => {
  const max = stations.length - 1
  const [pos, setPos] = useState(index)
  const [animate, setAnimate] = useState(true)

  const posRef = useRef(pos)
  const indexRef = useRef(index)
  const onChangeRef = useRef(onChange)
  const interactingRef = useRef(false)
  const snapTimerRef = useRef<number | null>(null)
  const lastXRef = useRef(0)
  const draggingRef = useRef(false)

  posRef.current = pos
  indexRef.current = index
  onChangeRef.current = onChange

  const syncStation = (value: number) => {
    const nearest = clamp(Math.round(value), 0, max)
    if (nearest !== indexRef.current) onChangeRef.current(nearest)
    return nearest
  }

  const moveTo = (next: number, commit: boolean) => {
    const value = clamp(next, 0, max)
    posRef.current = value
    setAnimate(commit)
    setPos(value)
    const nearest = syncStation(value)
    if (commit) {
      posRef.current = nearest
      setPos(nearest)
      setAnimate(true)
    }
  }

  useEffect(() => {
    if (interactingRef.current) return
    setAnimate(true)
    setPos(index)
  }, [index])

  useEffect(() => {
    const clearSnap = () => {
      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current)
        snapTimerRef.current = null
      }
    }

    const endInteraction = () => {
      interactingRef.current = false
      draggingRef.current = false
      clearSnap()
      moveTo(posRef.current, true)
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      interactingRef.current = true
      moveTo(posRef.current + event.deltaY * WHEEL_STEP, false)
      clearSnap()
      snapTimerRef.current = window.setTimeout(endInteraction, 140)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return
      const dx = event.clientX - lastXRef.current
      lastXRef.current = event.clientX
      moveTo(posRef.current - dx * DRAG_STEP, false)
    }

    const onPointerUp = () => {
      if (!draggingRef.current) return
      endInteraction()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      clearSnap()
    }
  }, [max])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const marks: number[] = []
  for (let i = 0; i <= max + 0.0001; i += MINOR_EVERY) {
    marks.push(Number(i.toFixed(2)))
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 h-[min(22dvh,11rem)] border-t border-white/10 bg-[linear-gradient(180deg,#12141c_0%,#07080d_100%)] text-[var(--color-title)] select-none"
      role="group"
      aria-label="Page tuner"
    >
      <div className="relative flex h-full items-stretch">
        <button
          type="button"
          className="z-20 w-14 shrink-0 border-r border-white/10 text-2xl tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/40 disabled:opacity-30"
          aria-label="Previous station"
          disabled={index <= 0}
          onClick={() => moveTo(index - 1, true)}
        >
          ‹
        </button>

        <div
          className="relative min-w-0 flex-1 cursor-ew-resize overflow-hidden touch-none"
          onPointerDown={(event) => {
            event.preventDefault()
            interactingRef.current = true
            draggingRef.current = true
            lastXRef.current = event.clientX
            if (snapTimerRef.current !== null) {
              window.clearTimeout(snapTimerRef.current)
              snapTimerRef.current = null
            }
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-[#f4c56a]">
            <span className="absolute top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#f4c56a]" />
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-[linear-gradient(180deg,rgba(3,4,10,0.55),transparent)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-[linear-gradient(0deg,rgba(3,4,10,0.7),transparent)]"
            aria-hidden
          />

          <div
            className="absolute inset-y-0 left-0 flex items-end will-change-transform"
            style={{
              transform: `translate3d(calc(50% - ${pos * GAP}px), 0, 0)`,
              transition: animate
                ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
            }}
          >
            <div className="relative h-[72%]" style={{ width: `${stations.length * GAP}px` }}>
              {marks.map((mark) => {
                const station =
                  Math.abs(mark - Math.round(mark)) < 0.001
                    ? stations[Math.round(mark)]
                    : undefined

                return (
                  <div
                    key={mark}
                    className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                    style={{ left: `${mark * GAP}px` }}
                  >
                    {station ? (
                      <span
                        className="mb-2 text-[clamp(0.7rem,1.6vw,0.95rem)] font-medium tracking-[0.08em] text-[#f4c56a]"
                        style={{ fontFamily: 'var(--font-en)' }}
                      >
                        {station.label}
                      </span>
                    ) : null}
                    <span
                      className={station ? 'w-px bg-white/55' : 'w-px bg-white/20'}
                      style={{ height: station ? '2.1rem' : '1.1rem' }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span
              className="text-[0.65rem] tracking-[0.28em] text-white/35 uppercase"
              style={{ fontFamily: 'var(--font-en)' }}
            >
              {stations[index]?.title}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="z-20 w-14 shrink-0 border-l border-white/10 text-2xl tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/40 disabled:opacity-30"
          aria-label="Next station"
          disabled={index >= max}
          onClick={() => moveTo(index + 1, true)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
