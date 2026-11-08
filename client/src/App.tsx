import { Stations, type StationSpec } from '@/components/Stations'
import { Title } from '@/components/Title'
import { PetalOverlay } from '@/components/petals/PetalOverlay'
import { ComicFx, type ComicFxVariant } from '@/components/ComicFx'

type TitleAlign = 'left' | 'center' | 'right'
type TitleStyle = 'hero' | 'ink' | 'ghost' | 'solid'

const PageShell = ({
  title,
  copy,
  fx,
  accents,
  align,
  titleStyle,
}: {
  title: string
  copy: string
  fx: ComicFxVariant
  accents: [string, string]
  align: TitleAlign
  titleStyle: TitleStyle
}) => (
  <div className={`rg-page rg-page--${titleStyle}`}>
    <ComicFx variant={fx} accents={accents} />
    <h2 className={`big rg-page-title rg-page-title--${align} rg-page-title--${titleStyle}`}>
      {title}
    </h2>
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
        fx="radial-burst"
        accents={['#0f766e', '#2dd4bf']}
        align="left"
        titleStyle="hero"
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
        title="Research"
        copy="Deeper looks at how problems were framed, built, and shipped."
        fx="edge-focus"
        accents={['#1d4ed8', '#60a5fa']}
        align="center"
        titleStyle="ink"
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
        fx="corner-flare"
        accents={['#ea580c', '#fb923c']}
        align="right"
        titleStyle="ghost"
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
        fx="speed-streaks"
        accents={['#ca8a04', '#facc15']}
        align="left"
        titleStyle="hero"
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
        fx="slash-burst"
        accents={['#c2410c', '#fb923c']}
        align="right"
        titleStyle="solid"
      />
    ),
  },
]

const App = () => <Stations title="Rakshit Gumber" stations={STATIONS} />

export default App
