import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PixiOverlay } from '@/components/PixiStage'
import { Title } from '@/components/Title'
import { Tuner, type Station } from '@/components/Tuner'

const STATIONS: Station[] = [
  { id: 'home', title: 'Home' },
  { id: 'work', title: 'Work' },
  { id: 'about', title: 'About' },
  { id: 'notes', title: 'Notes' },
  { id: 'contact', title: 'Contact' },
]

const GLITCH_MS = 480

const PageShell = ({
  title,
  copy,
}: {
  title: string
  copy: string
}) => (
  <section className="flex h-dvh items-end px-[1.5vw] pb-[calc(3rem+100px)]">
    <div className="max-w-3xl">
      <p
        className="mb-3 text-[0.7rem] tracking-[0.32em] text-white/35 uppercase"
        style={{ fontFamily: 'var(--font-en)' }}
      >
        Tuned in
      </p>
      <h2
        className="text-[clamp(2.5rem,8vw,6rem)] leading-none font-bold text-[var(--color-title)]"
        style={{ fontFamily: 'var(--font-en)' }}
      >
        {title}
      </h2>
      <p
        className="mt-5 max-w-xl text-[clamp(1rem,2.2vw,1.25rem)] leading-relaxed text-white/55"
        style={{ fontFamily: 'var(--font-en)' }}
      >
        {copy}
      </p>
    </div>
  </section>
)

const HomePage = () => (
  <section className="relative h-dvh overflow-hidden">
    <div className="absolute inset-0 flex items-center">
      <div className="relative z-10 w-full">
        <Title />
      </div>
      <PixiOverlay />
    </div>
  </section>
)

const PAGES: Record<string, () => ReactNode> = {
  home: () => <HomePage />,
  work: () => (
    <PageShell
      title="Work"
      copy="Selected projects and experiments land here as this station settles."
    />
  ),
  about: () => (
    <PageShell
      title="About"
      copy="A short signal about who I am, how I build, and what I care about."
    />
  ),
  notes: () => (
    <PageShell
      title="Notes"
      copy="Fragments, process, and writing — tuned in when this frequency locks."
    />
  ),
  contact: () => (
    <PageShell
      title="Contact"
      copy="Reach out on this channel when you want to start something together."
    />
  ),
}

const App = () => {
  const [stationIndex, setStationIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [glitchKey, setGlitchKey] = useState(0)
  const [glitching, setGlitching] = useState(false)
  const timersRef = useRef<number[]>([])
  const pageRef = useRef<HTMLDivElement>(null)

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }

  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    const el = pageRef.current
    if (!glitching || !el) return
    el.classList.remove('page-glitch')
    void el.offsetWidth
    el.classList.add('page-glitch')
  }, [glitchKey, glitching])

  const handleStationChange = (next: number) => {
    if (next === stationIndex) return
    setStationIndex(next)
    clearTimers()
    setGlitching(true)
    setGlitchKey((key) => key + 1)

    timersRef.current.push(
      window.setTimeout(() => {
        setDisplayIndex(next)
      }, Math.floor(GLITCH_MS * 0.35)),
    )
    timersRef.current.push(
      window.setTimeout(() => {
        setGlitching(false)
        pageRef.current?.classList.remove('page-glitch')
      }, GLITCH_MS),
    )
  }

  const station = STATIONS[displayIndex]
  const Page = PAGES[station.id]

  return (
    <main className="relative h-dvh overflow-hidden bg-[var(--color-bg)]">
      <div ref={pageRef} className="absolute inset-0">
        {Page?.()}
      </div>

      {glitching ? (
        <>
          <div key={`overlay-${glitchKey}`} className="page-glitch-overlay" aria-hidden />
          <div key={`static-${glitchKey}`} className="page-glitch-static" aria-hidden />
        </>
      ) : null}

      <Tuner
        stations={STATIONS}
        index={stationIndex}
        onChange={handleStationChange}
      />
    </main>
  )
}

export default App
