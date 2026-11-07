import { useState, type ReactNode } from 'react'
import { PixiOverlay } from '@/components/PixiStage'
import { Title } from '@/components/Title'
import { Tuner, type Station } from '@/components/Tuner'

const STATIONS: Station[] = [
  { id: 'home', label: '88.1', title: 'Home' },
  { id: 'work', label: '92.5', title: 'Work' },
  { id: 'about', label: '96.3', title: 'About' },
  { id: 'notes', label: '100.1', title: 'Notes' },
  { id: 'contact', label: '104.7', title: 'Contact' },
]

const PageShell = ({
  title,
  copy,
}: {
  title: string
  copy: string
}) => (
  <section className="flex h-dvh items-end px-[1.5vw] pb-[calc(min(22dvh,11rem)+3rem)]">
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
    <div className="absolute inset-0 flex items-end pb-[calc(min(22dvh,11rem)+4rem)]">
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
  const station = STATIONS[stationIndex]
  const Page = PAGES[station.id]

  return (
    <main className="relative h-dvh overflow-hidden bg-[var(--color-bg)]">
      {Page?.()}
      <Tuner stations={STATIONS} index={stationIndex} onChange={setStationIndex} />
    </main>
  )
}

export default App
