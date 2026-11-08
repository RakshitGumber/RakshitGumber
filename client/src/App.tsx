import { Stations, type StationSpec } from '@/components/Stations'
import { Title } from '@/components/Title'
import { PetalOverlay } from '@/components/petals/PetalOverlay'

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
    content: <HomePage />,
  },
  {
    id: 'projects',
    label: 'Projects',
    field: '#ff4d6d',
    ink: '#fff1f2',
    glow: ['#0f766e', '#2dd4bf'],
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
    field: '#ffb703',
    ink: '#1c1000',
    glow: ['#1d4ed8', '#60a5fa'],
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
    field: '#00d4ff',
    ink: '#042f2e',
    glow: ['#ea580c', '#fb923c'],
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
    field: '#7c3aed',
    ink: '#f3e8ff',
    glow: ['#ca8a04', '#facc15'],
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
    field: '#93c5fd',
    ink: '#0c1a3a',
    glow: ['#c2410c', '#fb923c'],
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
