import { useState, type CSSProperties, type ReactNode } from 'react'
import { useContent } from '@/hooks/useContent'
import type { Blog, Project } from '@/lib/content'
import {
  BLOG_PALETTE,
  PANEL_CLIPS,
  PROJECT_PALETTE,
  type StripPalette,
} from '@/lib/stripPalette'

const PREVIEW_MAX = 5
const STRIP_MAX = 8

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function stripCount(length: number) {
  return Math.max(1, Math.min(STRIP_MAX, length))
}

function panelStyle(palette: StripPalette, index: number): CSSProperties {
  const color = palette.colors[index % palette.colors.length]
  return {
    ['--panel' as string]: color,
    ['--panel-ink' as string]: palette.ink,
  }
}

const ComicStrip = ({
  count,
  paper,
  footer,
  children,
}: {
  count: number
  paper: string
  footer: ReactNode
  children: ReactNode
}) => (
  <div className="rg-strip-page" style={{ ['--paper' as string]: paper }}>
    <ul className={`rg-strip rg-strip--${stripCount(count)}`}>{children}</ul>
    <div className="rg-strip-page-foot">{footer}</div>
  </div>
)

const TurnOver = ({
  flipped,
  onFlip,
  moreLabel,
}: {
  flipped: boolean
  onFlip: () => void
  moreLabel: string
}) => (
  <button type="button" className="rg-strip-turn" onClick={onFlip}>
    <span className="rg-strip-turn-label">
      {flipped ? 'Turn Back' : 'Please Turn Over'}
    </span>
    <span className="rg-strip-turn-hint" aria-hidden="true">
      {flipped ? '‹ preview' : `› ${moreLabel}`}
    </span>
  </button>
)

const ProjectPanel = ({
  project,
  index,
  palette,
}: {
  project: Project
  index: number
  palette: StripPalette
}) => {
  const href = project.liveDemoUrl || project.githubUrl || project.repoUrl
  const clip = PANEL_CLIPS[index % PANEL_CLIPS.length]
  const color = palette.colors[index % palette.colors.length]
  const className = 'rg-strip-panel'
  const morph = {
    'data-cursor-morph': '',
    'data-cursor-clip': clip,
    'data-cursor-glow': color,
  } as const

  const inner = (
    <>
      <span className="rg-strip-dither" aria-hidden="true" />
      <span className="rg-strip-dots" aria-hidden="true" />
      <h3 className="rg-strip-title">{project.title}</h3>
      <p className="rg-strip-copy">{project.description}</p>
    </>
  )

  if (href) {
    return (
      <li className={className} style={panelStyle(palette, index)} {...morph}>
        <a className="rg-strip-hit" href={href} target="_blank" rel="noreferrer">
          {inner}
        </a>
      </li>
    )
  }

  return (
    <li className={className} style={panelStyle(palette, index)} {...morph}>
      <button type="button" className="rg-strip-hit">
        {inner}
      </button>
    </li>
  )
}

const BlogPanel = ({
  blog,
  index,
  palette,
}: {
  blog: Blog
  index: number
  palette: StripPalette
}) => {
  const clip = PANEL_CLIPS[index % PANEL_CLIPS.length]
  const color = palette.colors[index % palette.colors.length]

  return (
    <li
      className="rg-strip-panel"
      style={panelStyle(palette, index)}
      data-cursor-morph=""
      data-cursor-clip={clip}
      data-cursor-glow={color}
    >
      <button type="button" className="rg-strip-hit">
        <span className="rg-strip-dither" aria-hidden="true" />
        <span className="rg-strip-dots" aria-hidden="true" />
        <h3 className="rg-strip-title">{blog.title}</h3>
        <p className="rg-strip-copy">{blog.description}</p>
        <div className="rg-strip-foot">
          <span className="rg-strip-meta">{formatDate(blog.timestamp)}</span>
          {blog.readTime != null ? (
            <span className="rg-strip-meta">{blog.readTime} min</span>
          ) : null}
        </div>
      </button>
    </li>
  )
}

const ProjectItems = ({
  projects,
  palette,
}: {
  projects: Project[]
  palette: StripPalette
}) => {
  const [flipped, setFlipped] = useState(false)
  const shown = flipped
    ? projects.slice(0, STRIP_MAX)
    : projects.slice(0, PREVIEW_MAX)

  return (
    <div className="rg-strip-stack">
      <ComicStrip
        count={shown.length}
        paper={palette.paper}
        footer={
          <TurnOver
            flipped={flipped}
            onFlip={() => setFlipped((v) => !v)}
            moreLabel="all projects"
          />
        }
      >
        {shown.map((project, i) => (
          <ProjectPanel
            key={project.id}
            project={project}
            index={i}
            palette={palette}
          />
        ))}
      </ComicStrip>
    </div>
  )
}

const BlogItems = ({
  blogs,
  palette,
}: {
  blogs: Blog[]
  palette: StripPalette
}) => {
  const [flipped, setFlipped] = useState(false)
  const shown = flipped ? blogs.slice(0, STRIP_MAX) : blogs.slice(0, PREVIEW_MAX)

  return (
    <div className="rg-strip-stack">
      <ComicStrip
        count={shown.length}
        paper={palette.paper}
        footer={
          <TurnOver
            flipped={flipped}
            onFlip={() => setFlipped((v) => !v)}
            moreLabel="all blogs"
          />
        }
      >
        {shown.map((blog, i) => (
          <BlogPanel key={blog.id} blog={blog} index={i} palette={palette} />
        ))}
      </ComicStrip>
    </div>
  )
}

export const ProjectList = () => {
  const content = useContent()

  if (content.status === 'loading') {
    return <p className="lead det">Loading projects…</p>
  }
  if (content.status === 'error') {
    return <p className="lead det">{content.message}</p>
  }
  if (content.data.projects.length === 0) {
    return <p className="lead det">No projects yet.</p>
  }

  return (
    <ProjectItems projects={content.data.projects} palette={PROJECT_PALETTE} />
  )
}

export const BlogList = () => {
  const content = useContent()

  if (content.status === 'loading') {
    return <p className="lead det">Loading blogs…</p>
  }
  if (content.status === 'error') {
    return <p className="lead det">{content.message}</p>
  }
  if (content.data.blogs.length === 0) {
    return <p className="lead det">No blogs yet.</p>
  }

  return <BlogItems blogs={content.data.blogs} palette={BLOG_PALETTE} />
}
