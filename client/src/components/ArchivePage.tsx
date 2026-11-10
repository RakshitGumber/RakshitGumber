import { useEffect, useState, type ReactNode } from 'react'
import { ProjectFlyer } from '@/components/ProjectFlyer'
import { useContent } from '@/hooks/useContent'
import type { Project } from '@/lib/content'

export type ArchiveKind = 'projects' | 'blogs' | 'cases'

export function blogSlugOf(path: string) {
  const m = path.match(/^\/blog\/([^/]+)$/)
  return m?.[1] ?? null
}

const COPY: Record<
  ArchiveKind,
  { title: string; empty: string; dial: string }
> = {
  projects: { title: 'Projects', empty: 'No projects yet.', dial: '/?s=projects' },
  blogs: { title: 'Blogs', empty: 'No blogs yet.', dial: '/?s=blogs' },
  cases: { title: 'Case Studies', empty: 'No case studies yet.', dial: '/?s=cases' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const ArchivePage = ({ kind }: { kind: ArchiveKind }) => {
  const content = useContent()
  const copy = COPY[kind]
  const [active, setActive] = useState<{ project: Project; index: number } | null>(
    null,
  )

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const prev = {
      htmlBg: html.style.background,
      bodyBg: body.style.background,
      bodyColor: body.style.color,
      overflow: body.style.overflow,
      theme: meta?.content ?? null,
    }
    html.style.background = '#fff'
    body.style.background = '#fff'
    body.style.color = '#111'
    body.style.overflow = ''
    if (meta) meta.content = '#ffffff'
    return () => {
      html.style.background = prev.htmlBg
      body.style.background = prev.bodyBg
      body.style.color = prev.bodyColor
      body.style.overflow = prev.overflow
      if (meta && prev.theme !== null) meta.content = prev.theme
    }
  }, [])

  let body: ReactNode
  if (content.status === 'loading') {
    body = <p className="rg-archive-note">Loading…</p>
  } else if (content.status === 'error') {
    body = <p className="rg-archive-note">{content.message}</p>
  } else if (kind === 'projects') {
    const items = content.data.projects
    body =
      items.length === 0 ? (
        <p className="rg-archive-note">{copy.empty}</p>
      ) : (
        <ul className="rg-archive-list">
          {items.map((p, i) => (
            <li key={p.id} className="rg-archive-item">
              <button
                type="button"
                className="rg-archive-open"
                onClick={() => setActive({ project: p, index: i })}
              >
                <h2 className="rg-archive-item-title">{p.title}</h2>
                <p className="rg-archive-item-copy">{p.longDescription || p.description}</p>
                {p.tags.length ? (
                  <p className="rg-archive-item-meta">{p.tags.join(' · ')}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )
  } else if (kind === 'blogs') {
    const items = content.data.blogs
    body =
      items.length === 0 ? (
        <p className="rg-archive-note">{copy.empty}</p>
      ) : (
        <ul className="rg-archive-list">
          {items.map((b) => (
            <li key={b.id} className="rg-archive-item">
              <a href={`/blog/${b.id}`}>
                <h2 className="rg-archive-item-title">{b.title}</h2>
                <p className="rg-archive-item-copy">{b.longDescription || b.description}</p>
                <p className="rg-archive-item-meta">
                  {[formatDate(b.timestamp), b.readTime != null ? `${b.readTime} min` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )
  } else {
    body = <p className="rg-archive-note">{copy.empty}</p>
  }

  return (
    <div className="rg-archive">
      <header className="rg-archive-head">
        <a className="rg-archive-back" href={copy.dial}>
          ← Back to dial
        </a>
        <h1 className="rg-archive-title">{copy.title}</h1>
      </header>
      {body}
      {active ? (
        <ProjectFlyer
          project={active.project}
          index={active.index}
          onClose={() => setActive(null)}
        />
      ) : null}
    </div>
  )
}

/** Single blog post — white reading page opened from the dial / archive. */
export const BlogPost = ({ slug }: { slug: string }) => {
  const content = useContent()

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const prev = {
      htmlBg: html.style.background,
      bodyBg: body.style.background,
      bodyColor: body.style.color,
      overflow: body.style.overflow,
      theme: meta?.content ?? null,
    }
    html.style.background = '#fff'
    body.style.background = '#fff'
    body.style.color = '#111'
    body.style.overflow = ''
    if (meta) meta.content = '#ffffff'
    return () => {
      html.style.background = prev.htmlBg
      body.style.background = prev.bodyBg
      body.style.color = prev.bodyColor
      body.style.overflow = prev.overflow
      if (meta && prev.theme !== null) meta.content = prev.theme
    }
  }, [])

  let body: ReactNode
  if (content.status === 'loading') {
    body = <p className="rg-archive-note">Loading…</p>
  } else if (content.status === 'error') {
    body = <p className="rg-archive-note">{content.message}</p>
  } else {
    const post = content.data.blogs.find((b) => b.id === slug)
    if (!post) {
      body = <p className="rg-archive-note">Blog not found.</p>
    } else {
      body = (
        <article className="rg-blog-post">
          <p className="rg-archive-item-meta">
            {[formatDate(post.timestamp), post.readTime != null ? `${post.readTime} min` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <h1 className="rg-archive-title">{post.title}</h1>
          <p className="rg-blog-lead">{post.description}</p>
          <div className="rg-blog-body">
            <p>{post.longDescription || post.description}</p>
          </div>
          {post.tags.length ? (
            <p className="rg-archive-item-meta">{post.tags.join(' · ')}</p>
          ) : null}
        </article>
      )
    }
  }

  return (
    <div className="rg-archive">
      <header className="rg-archive-head">
        <a className="rg-archive-back" href="/?s=blogs">
          ← Back to dial
        </a>
      </header>
      {body}
    </div>
  )
}
