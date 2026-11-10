import { useRef, useState, type CSSProperties } from 'react'
import { useContent } from '@/hooks/useContent'
import { useHotFrame } from '@/hooks/useHotFrame'
import { scrollPageTo } from '@/lib/pageScroll'
import { BLOG_PALETTE, PROJECT_PALETTE, type StripPalette } from '@/lib/stripPalette'

const PAGE_SIZE = 8
/** Full pages rotate through three splash layouts. */
const FULL_PAGE_LAYOUTS = 3

type FrameItem = {
  id: string
  title: string
  description: string
  tags: string[]
  meta: string[]
  href: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function layoutOf(count: number, page: number) {
  if (count < PAGE_SIZE) return String(Math.max(1, count))
  return `8-${(page % FULL_PAGE_LAYOUTS) + 1}`
}

/** Wobbly-ink filter shared by every frame border. */
const SketchFilter = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <filter id="rg-sketch">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="4" />
    </filter>
  </svg>
)

const Frame = ({
  item,
  index,
  palette,
}: {
  item: FrameItem
  index: number
  palette: StripPalette
}) => {
  const color = palette.colors[index % palette.colors.length]
  const style = {
    '--panel': color,
    '--panel-ink': palette.ink,
    // Each frame gets its own burst origin so the page doesn't look stamped.
    '--burst-x': `${20 + ((index * 37) % 60)}%`,
    '--burst-y': `${15 + ((index * 53) % 55)}%`,
  } as CSSProperties

  const inner = (
    <>
      <span className="rg-frame-art" aria-hidden="true" />
      <span className="rg-frame-num">#{String(index + 1).padStart(2, '0')}</span>
      <span className="rg-frame-text">
        <h3 className="rg-frame-title">{item.title}</h3>
        <p className="rg-frame-copy">{item.description}</p>
        {item.meta.length || item.tags.length ? (
          <span className="rg-frame-foot">
            {item.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rg-frame-tag">
                {tag}
              </span>
            ))}
            {item.meta.map((m) => (
              <span key={m} className="rg-frame-meta">
                {m}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <li className="rg-frame" style={style} data-cursor-morph="" data-cursor-glow={color}>
      {item.href ? (
        <a className="rg-frame-hit" href={item.href} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        <button type="button" className="rg-frame-hit">
          {inner}
        </button>
      )}
    </li>
  )
}

const ComicBook = ({
  items,
  palette,
}: {
  items: FrameItem[]
  palette: StripPalette
}) => {
  const [page, setPage] = useState(0)
  const bookRef = useRef<HTMLDivElement>(null)
  const pages = Math.ceil(items.length / PAGE_SIZE)
  const shown = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const last = page === pages - 1

  useHotFrame(bookRef, page)

  return (
    <div className="rg-book-stack">
      <SketchFilter />
      <div
        ref={bookRef}
        className="rg-book"
        style={{ ['--paper' as string]: palette.paper }}
      >
        <article key={page} className="rg-sheet">
          <ul className={`rg-frames rg-frames--${layoutOf(shown.length, page)}`}>
            {shown.map((item, i) => (
              <Frame
                key={item.id}
                item={item}
                index={page * PAGE_SIZE + i}
                palette={palette}
              />
            ))}
          </ul>
          <span className="rg-folio">
            {page + 1} / {pages}
          </span>
        </article>
        <button
          type="button"
          className="rg-sticker"
          onClick={(e) => {
            setPage((p) => (last ? 0 : p + 1))
            // Land on the top of the fresh page, not its bottom edge.
            const stack = e.currentTarget.parentElement
            const body = stack?.closest('.rg-page-body')
            if (stack && body instanceof HTMLElement) scrollPageTo(body, stack)
            else stack?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          disabled={pages < 2}
        >
          <span className="rg-sticker-label">
            {pages < 2 ? 'The End!' : last ? 'Back to #1' : 'Next Page!'}
          </span>
          {pages > 1 ? <span className="rg-sticker-arrow">{last ? '↺' : '→'}</span> : null}
        </button>
      </div>
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

  const items = content.data.projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tags: p.tags,
    meta: [],
    href: p.liveDemoUrl || p.githubUrl || p.repoUrl,
  }))
  return <ComicBook items={items} palette={PROJECT_PALETTE} />
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

  const items = content.data.blogs.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    tags: b.tags,
    meta: [formatDate(b.timestamp), ...(b.readTime != null ? [`${b.readTime} min`] : [])],
    href: null,
  }))
  return <ComicBook items={items} palette={BLOG_PALETTE} />
}
