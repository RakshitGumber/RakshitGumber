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
    field: '#000000',
    ink: '#fffaf2',
    glow: ['#8b0000', '#ff0040'],
    wave: sine(0.9, 0.12),
    content: <HomePage />,
  },
  {
    id: 'projects',
    label: 'Projects',
    field: '#be123c',
    ink: '#fff1f2',
    glow: ['#881337', '#fb7185'],
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
    field: '#f59e0b',
    ink: '#1c1000',
    glow: ['#b45309', '#fde047'],
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
    field: '#0e7490',
    ink: '#ecfeff',
    glow: ['#155e75', '#22d3ee'],
    wave: (u) => Math.sin(u) * 0.7 + Math.sin(u * 5) * 0.25,
    content: (
      <PageShell
        title="Blogs"
        copy="Fragments, process, and writing — tuned in when this frequency locks."
      />
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    field: '#172554',
    ink: '#dbeafe',
    glow: ['#1e3a8a', '#38bdf8'],
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
