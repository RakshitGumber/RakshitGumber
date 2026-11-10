import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Stations, type StationSpec } from '@/components/Stations'
import { Title } from '@/components/Title'
import { PetalOverlay } from '@/components/petals/PetalOverlay'
import { ComicFx, type ComicFxVariant } from '@/components/ComicFx'
import { CursorRing } from '@/components/CursorRing'
import { BlogList, CaseList, ContactList, ProjectList } from '@/components/ContentList'
import {
  ArchivePage,
  BlogPost,
  ProjectPost,
  blogSlugOf,
  projectSlugOf,
  type ArchiveKind,
} from '@/components/ArchivePage'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { HomeCutouts, PageCutout, type CutoutKind } from '@/components/Cutouts'

type TitleAlign = 'left' | 'center' | 'right'
type TitleStyle = 'hero' | 'ink' | 'ghost' | 'solid'

const ARCHIVE_PATHS: Record<string, ArchiveKind> = {
  '/projects': 'projects',
  '/project': 'projects',
  '/blogs': 'blogs',
  '/cases': 'cases',
  '/casestudies': 'cases',
  '/case-studies': 'cases',
}

function pathOf() {
  return location.pathname.replace(/\/+$/, '') || '/'
}

const PageShell = ({
  title,
  fx,
  accents,
  align,
  titleStyle,
  cutout,
  children,
}: {
  title: string
  fx: ComicFxVariant
  accents: [string, string]
  align: TitleAlign
  titleStyle: TitleStyle
  cutout: CutoutKind
  children?: ReactNode
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useMouseParallax(titleRef, { duration: 0.22 })

  return (
    <div className={`rg-page rg-page--${titleStyle}`}>
      <ComicFx variant={fx} accents={accents} />
      <div className="rg-page-body det" data-own>
        <div className="rg-page-scroll">
          <PageCutout kind={cutout} />
          <h2
            ref={titleRef}
            className={`big rg-page-title rg-page-title--${align} rg-page-title--${titleStyle}`}
          >
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  )
}

const HomePage = () => (
  <div className="rg-home" data-own>
    <div className="rg-home-stage">
      <div className="rg-home-title">
        <Title />
      </div>
      <HomeCutouts />
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
        cutout="projects"
        fx="radial-burst"
        accents={['#0f766e', '#2dd4bf']}
        align="center"
        titleStyle="hero"
      >
        <ProjectList />
      </PageShell>
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
        cutout="cases"
        fx="edge-focus"
        accents={['#1d4ed8', '#60a5fa']}
        align="center"
        titleStyle="ink"
      >
        <CaseList />
      </PageShell>
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
        cutout="blogs"
        fx="corner-flare"
        accents={['#ea580c', '#fb923c']}
        align="center"
        titleStyle="ghost"
      >
        <BlogList />
      </PageShell>
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
        cutout="about"
        fx="speed-streaks"
        accents={['#ca8a04', '#facc15']}
        align="center"
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
        cutout="contact"
        fx="slash-burst"
        accents={['#c2410c', '#fb923c']}
        align="center"
        titleStyle="solid"
      >
        <ContactList />
      </PageShell>
    ),
  },
]

const DialApp = () => (
  <>
    <CursorRing />
    <Stations title="Rakshit Gumber" stations={STATIONS} />
  </>
)

const App = () => {
  const [path, setPath] = useState(pathOf)

  useEffect(() => {
    const onPop = () => setPath(pathOf())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const projectSlug = projectSlugOf(path)
  if (projectSlug) return <ProjectPost slug={projectSlug} />

  const archive = ARCHIVE_PATHS[path]
  if (archive) return <ArchivePage kind={archive} />

  const blogSlug = blogSlugOf(path)
  if (blogSlug) return <BlogPost slug={blogSlug} />

  return <DialApp />
}

export default App
