import { useRef, type CSSProperties } from 'react'
import { useContent } from '@/hooks/useContent'
import { useHotFrame } from '@/hooks/useHotFrame'
import { CONTACT } from '@/lib/contact'
import {
  BLOG_PALETTE,
  CONTACT_PALETTE,
  PROJECT_PALETTE,
  type StripPalette,
} from '@/lib/stripPalette'

const PAGE_SIZE = 8

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

function layoutOf(count: number) {
  if (count < PAGE_SIZE) return String(Math.max(1, count))
  return `8-1`
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

  const external = item.href?.startsWith('http')

  return (
    <li className="rg-frame" style={style} data-cursor-morph="" data-cursor-glow={color}>
      {item.href ? (
        <a
          className="rg-frame-hit"
          href={item.href}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
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
  moreHref,
}: {
  items: FrameItem[]
  palette: StripPalette
  moreHref: string
}) => {
  const bookRef = useRef<HTMLDivElement>(null)
  const shown = items.slice(0, PAGE_SIZE)

  useHotFrame(bookRef, 0)

  return (
    <div className="rg-book-stack">
      <SketchFilter />
      <div
        ref={bookRef}
        className="rg-book"
        style={{ ['--paper' as string]: palette.paper }}
      >
        <article className="rg-sheet">
          <ul className={`rg-frames rg-frames--${layoutOf(shown.length)}`}>
            {shown.map((item, i) => (
              <Frame key={item.id} item={item} index={i} palette={palette} />
            ))}
          </ul>
          <span className="rg-folio">1 / 1</span>
        </article>
        <a className="rg-sticker" href={moreHref}>
          <span className="rg-sticker-label">Next Page!</span>
          <span className="rg-sticker-arrow">→</span>
        </a>
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
  return <ComicBook items={items} palette={PROJECT_PALETTE} moreHref="/projects" />
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
  return <ComicBook items={items} palette={BLOG_PALETTE} moreHref="/blogs" />
}

/** Cases dial preview — sticker opens the white archive. */
export const CaseList = () => (
  <div className="rg-book-stack">
    <div className="rg-book" style={{ ['--paper' as string]: '#ffffff' }}>
      <article className="rg-sheet">
        <p className="lead det" style={{ margin: 'auto', textAlign: 'center' }}>
          Case studies live on the next page.
        </p>
        <span className="rg-folio">1 / 1</span>
      </article>
      <a className="rg-sticker" href="/cases">
        <span className="rg-sticker-label">Next Page!</span>
        <span className="rg-sticker-arrow">→</span>
      </a>
    </div>
  </div>
)

/** Four-panel contact strip — email, X, LinkedIn, mobile. */
export const ContactList = () => {
  const bookRef = useRef<HTMLDivElement>(null)
  useHotFrame(bookRef, 0)

  const items: FrameItem[] = [
    {
      id: 'email',
      title: 'Email',
      description: CONTACT.email,
      tags: ['Write'],
      meta: [],
      href: `mailto:${CONTACT.email}`,
    },
    {
      id: 'twitter',
      title: 'Twitter',
      description: CONTACT.twitter.handle,
      tags: ['Yell'],
      meta: [],
      href: CONTACT.twitter.url,
    },
    {
      id: 'linkedin',
      title: 'LinkedIn',
      description: CONTACT.linkedin.handle,
      tags: ['Connect'],
      meta: [],
      href: CONTACT.linkedin.url,
    },
    {
      id: 'mobile',
      title: 'Mobile',
      description: CONTACT.mobile,
      tags: ['Call'],
      meta: [],
      href: `tel:${CONTACT.mobile.replace(/\s+/g, '')}`,
    },
  ]

  return (
    <div className="rg-book-stack">
      <SketchFilter />
      <div
        ref={bookRef}
        className="rg-book"
        style={{ ['--paper' as string]: CONTACT_PALETTE.paper }}
      >
        <article className="rg-sheet">
          <ul className="rg-frames rg-frames--4">
            {items.map((item, i) => (
              <Frame key={item.id} item={item} index={i} palette={CONTACT_PALETTE} />
            ))}
          </ul>
          <span className="rg-folio">1 / 1</span>
        </article>
      </div>
    </div>
  )
}
