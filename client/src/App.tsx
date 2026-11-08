import { Stations, type StationSpec } from '@/components/Stations'
import { Title } from '@/components/Title'
import { PetalOverlay } from '@/components/petals/PetalOverlay'

const sine =
  (amp = 1, harm = 0.15): StationSpec['wave'] =>
  (u) =>
    Math.sin(u) * amp + Math.sin(u * 3) * harm

const PageShell = ({
  title,
  copy,
}: {
  title: string
  copy: string
}) => (
  <div className="rg-page">
    <h2 className="big">{title}</h2>
    <p className="lead det">{copy}</p>
  </div>
)

const HomePage = () => (
  <div className="rg-home" data-own>
    <div className="rg-home-stage">
      <div className="rg-home-title">
        <Title />
      </div>
      <PetalOverlay />
    </div>
  </div>
)

const STATIONS: StationSpec[] = [
  {
    id: 'home',
    label: 'Home',
    field: '#03040a',
    ink: '#fffaf2',
    glow: ['#8b0000', '#ff0040'],
    wave: sine(0.9, 0.12),
    content: <HomePage />,
  },
  {
    id: 'projects',
    label: 'Projects',
    field: '#12261c',
    ink: '#d9f2e0',
    glow: ['#004d1a', '#00e676'],
    wave: sine(1, 0.2),
    content: (
      <PageShell
        title="Projects"
        copy="Selected projects and experiments land here as this station settles."
      />
    ),
  },
  {
    id: 'cases',
    label: 'Cases',
    field: '#1a1528',
    ink: '#efe6ff',
    glow: ['#2a0066', '#b400ff'],
    wave: (u) => Math.tanh(3.2 * Math.sin(u)) * 0.85,
    content: (
      <PageShell
        title="Case Studies"
        copy="Deeper looks at how problems were framed, built, and shipped."
      />
    ),
  },
  {
    id: 'blogs',
    label: 'Blogs',
    field: '#24180c',
    ink: '#ffe8c7',
    glow: ['#7a1e00', '#ff6d00'],
    wave: (u) => Math.sin(u) * 0.7 + Math.sin(u * 5) * 0.25,
    content: (
      <PageShell
        title="Blogs"
        copy="Fragments, process, and writing — tuned in when this frequency locks."
      />
    ),
  },
  {
    id: 'about',
    label: 'About',
    field: '#0c1c2a',
    ink: '#d7ecff',
    glow: ['#003a66', '#00b7ff'],
    wave: (u) => Math.sin(u * 2) * 0.55 + Math.sin(u) * 0.35,
    content: (
      <PageShell
        title="About"
        copy="A short signal about who I am, how I build, and what I care about."
      />
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    field: '#2a120f',
    ink: '#ffd7cb',
    glow: ['#5c0000', '#ff2a00'],
    wave: (u) => {
      const t = ((u / (Math.PI * 2)) % 1) - 0.5
      return Math.exp(-(t * t) * 40) * 1.4 - 0.4
    },
    content: (
      <PageShell
        title="Contact"
        copy="Reach out on this channel when you want to start something together."
      />
    ),
  },
]

const App = () => <Stations title="Rakshit Gumber" stations={STATIONS} />

export default App
