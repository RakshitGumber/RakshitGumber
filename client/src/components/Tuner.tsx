import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export type Station = {
  id: string
  title: string
}

type TunerProps = {
  stations: Station[]
  index: number
  onChange: (index: number) => void
}

const GAP = 148
const MINOR_EVERY = 0.25
const WHEEL_GAIN = 0.0018
const FRICTION = 0.92
const STOP_VEL = 0.002
const MAX_VEL = 0.085
const FLIP_OUT = 0.16
const FLIP_IN = 0.22

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const Tuner = ({ stations, index, onChange }: TunerProps) => {
  const max = stations.length - 1
  const channel = index + 1
  const [pos, setPos] = useState(index)
  const [displayChannel, setDisplayChannel] = useState(channel)

  const posRef = useRef(index)
  const indexRef = useRef(index)
  const onChangeRef = useRef(onChange)
  const maxRef = useRef(max)
  const trackRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<HTMLSpanElement>(null)
  const channelShownRef = useRef(channel)

  const velRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const interactingRef = useRef(false)
  const tweenProxyRef = useRef({ v: index })

  posRef.current = pos
  indexRef.current = index
  onChangeRef.current = onChange
  maxRef.current = max

  const paint = (value: number) => {
    const el = trackRef.current
    if (el) el.style.transform = `translate3d(${-value * GAP}px, 0, 0)`
    setPos(value)
  }

  const stopInertia = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    gsap.killTweensOf(tweenProxyRef.current)
    velRef.current = 0
  }

  const commitNearest = () => {
    interactingRef.current = false
    const nearest = clamp(Math.round(posRef.current), 0, maxRef.current)
    const distance = Math.abs(nearest - posRef.current)

    if (distance < 0.001) {
      posRef.current = nearest
      paint(nearest)
      if (nearest !== indexRef.current) onChangeRef.current(nearest)
      return
    }

    const proxy = tweenProxyRef.current
    proxy.v = posRef.current
    gsap.to(proxy, {
      v: nearest,
      duration: Math.min(0.28 + distance * 0.12, 0.42),
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        posRef.current = proxy.v
        paint(proxy.v)
      },
      onComplete: () => {
        posRef.current = nearest
        paint(nearest)
        if (nearest !== indexRef.current) onChangeRef.current(nearest)
      },
    })
  }

  const tickInertia = () => {
    rafRef.current = null

    let next = posRef.current + velRef.current
    if (next <= 0 || next >= maxRef.current) {
      next = clamp(next, 0, maxRef.current)
      velRef.current = 0
    }

    posRef.current = next
    paint(next)
    velRef.current *= FRICTION

    if (Math.abs(velRef.current) > STOP_VEL) {
      rafRef.current = requestAnimationFrame(tickInertia)
      return
    }

    velRef.current = 0
    commitNearest()
  }

  const startInertia = () => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(tickInertia)
  }

  const moveBy = (delta: number, velocity?: number) => {
    gsap.killTweensOf(tweenProxyRef.current)
    interactingRef.current = true
    const next = clamp(posRef.current + delta, 0, maxRef.current)
    posRef.current = next
    paint(next)
    if (velocity !== undefined) {
      velRef.current = clamp(velocity, -MAX_VEL, MAX_VEL)
    }
  }

  const moveToIndex = (nextIndex: number) => {
    stopInertia()
    interactingRef.current = true
    const target = clamp(nextIndex, 0, maxRef.current)
    const proxy = tweenProxyRef.current
    proxy.v = posRef.current
    gsap.to(proxy, {
      v: target,
      duration: 0.34,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        posRef.current = proxy.v
        paint(proxy.v)
      },
      onComplete: () => {
        posRef.current = target
        paint(target)
        interactingRef.current = false
        if (target !== indexRef.current) onChangeRef.current(target)
      },
    })
  }

  useEffect(() => {
    if (interactingRef.current) return
    stopInertia()
    posRef.current = index
    paint(index)
  }, [index])

  useEffect(() => {
    if (channel === channelShownRef.current) return

    const el = channelRef.current
    if (!el) {
      channelShownRef.current = channel
      setDisplayChannel(channel)
      return
    }

    const from = channelShownRef.current
    const direction = channel > from ? 1 : -1
    const target = channel

    gsap.killTweensOf(el)
    gsap.to(el, {
      opacity: 0,
      rotationX: direction * 90,
      duration: FLIP_OUT,
      ease: 'power2.in',
      onComplete: () => {
        channelShownRef.current = target
        setDisplayChannel(target)
        gsap.fromTo(
          el,
          { opacity: 0, rotationX: direction * -90 },
          {
            opacity: 1,
            rotationX: 0,
            duration: FLIP_IN,
            ease: 'power2.out',
          },
        )
      },
    })
  }, [channel])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      stopInertia()
      const delta = event.deltaY * WHEEL_GAIN
      moveBy(delta, delta * 0.55)
      startInertia()
    }

    window.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
      stopInertia()
    }
  }, [])

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
      className="fixed inset-x-0 bottom-0 z-50 h-[100px] border-t border-white/15 bg-[#141414] text-white select-none"
      role="group"
      aria-label="Page tuner"
    >
      <div className="relative flex h-full items-stretch">
        <div className="z-20 flex w-16 shrink-0 flex-col items-center justify-center border-r border-white/10">
          <span
            className="text-[0.55rem] tracking-[0.22em] text-white/35 uppercase"
            style={{ fontFamily: 'var(--font-en)' }}
          >
            CH
          </span>
          <span
            className="mt-0.5 block h-[2rem] overflow-hidden"
            style={{ perspective: '420px' }}
            aria-live="polite"
            aria-label={`Channel ${channel}`}
          >
            <span
              ref={channelRef}
              className="block text-[2rem] leading-none font-bold text-white will-change-transform"
              style={{
                fontFamily: 'var(--font-en)',
                transformOrigin: '50% 50%',
                transformStyle: 'preserve-3d',
              }}
            >
              {displayChannel}
            </span>
          </span>
        </div>

        <button
          type="button"
          className="z-20 w-11 shrink-0 border-r border-white/10 text-xl leading-none text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/40 disabled:opacity-30"
          aria-label="Previous channel"
          disabled={index <= 0}
          onClick={() => moveToIndex(index - 1)}
        >
          ‹
        </button>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white">
            <span className="absolute top-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
          </div>

          <div
            ref={trackRef}
            className="absolute inset-y-0 left-1/2 flex items-end pb-3 will-change-transform"
            style={{ transform: `translate3d(${-pos * GAP}px, 0, 0)` }}
          >
            <div className="relative h-[4.25rem]" style={{ width: `${max * GAP}px` }}>
              {marks.map((mark) => {
                const stationIndex = Math.round(mark)
                const isStation = Math.abs(mark - stationIndex) < 0.001
                const title = isStation ? stations[stationIndex]?.title : null
                const distance = Math.abs(mark - pos)
                const blur = Math.min(distance * 0.7, 1.6)
                const opacity = Math.max(1 - distance * 0.28, 0.4)
                const isSelected = distance < 0.35

                return (
                  <div
                    key={mark}
                    className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                    style={{
                      left: `${mark * GAP}px`,
                      filter: blur > 0.04 ? `blur(${blur}px)` : 'none',
                      opacity,
                    }}
                  >
                    <span
                      className={isStation ? 'w-px bg-white/70' : 'w-px bg-white/25'}
                      style={{ height: isStation ? '1.5rem' : '0.75rem' }}
                    />
                    {title ? (
                      <span
                        className={`mt-1.5 text-[0.8rem] leading-none font-medium tracking-[0.14em] uppercase ${
                          isSelected ? 'text-white' : 'text-white/55'
                        }`}
                        style={{ fontFamily: 'var(--font-en)' }}
                      >
                        {title}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="z-20 w-11 shrink-0 border-l border-white/10 text-xl leading-none text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/40 disabled:opacity-30"
          aria-label="Next channel"
          disabled={index >= max}
          onClick={() => moveToIndex(index + 1)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
