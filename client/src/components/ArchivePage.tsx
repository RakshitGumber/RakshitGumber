import { useEffect, type ReactNode } from 'react'
import { useContent } from '@/hooks/useContent'
import type { Blog, Project } from '@/lib/content'

export type ArchiveKind = 'projects' | 'blogs' | 'cases'

export function blogSlugOf(path: string) {
  const m = path.match(/^\/blog\/([^/]+)$/)
  return m?.[1] ?? null
}

export function projectSlugOf(path: string) {
  const m = path.match(/^\/projects\/([^/]+)$/)
  return m?.[1] ?? null
}

const COPY: Record<
  ArchiveKind,
  { title: string; empty: string; dial: string }
> = {
  projects: {
    title: 'Projects',
    empty: 'No projects yet.',
    dial: '/?s=projects',
  },
  blogs: {
    title: 'Blogs',
    empty: 'No blogs yet.',
    dial: '/?s=blogs',
  },
  cases: {
    title: 'Case Studies',
    empty: 'No case studies yet.',
    dial: '/?s=cases',
  },
}

function formatDate(iso: string) {
  const date = new Date(iso)
  const month = date.toLocaleString('default', { month: 'short' })
  return `${month} ${date.getDate()}, ${date.getFullYear()}`
}

function githubOf(p: Project) {
  return p.githubUrl || p.repoUrl
}

function useSiteSurface() {
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
    html.style.background = '#11111b'
    body.style.background = '#11111b'
    body.style.color = '#898ba7'
    body.style.overflow = ''
    if (meta) meta.content = '#11111b'
    return () => {
      html.style.background = prev.htmlBg
      body.style.background = prev.bodyBg
      body.style.color = prev.bodyColor
      body.style.overflow = prev.overflow
      if (meta && prev.theme !== null) meta.content = prev.theme
    }
  }, [])
}

const BackLink = ({ href }: { href: string }) => (
  <a className="rg-site-back" href={href}>
    ← Back to dial
  </a>
)

const Breadcrumbs = ({ items }: { items: { name: string; href?: string }[] }) => (
  <nav className="rg-site-crumbs" aria-label="Breadcrumb">
    <ol>
      <li>
        <a href="/">Rakshit Gumber</a>
      </li>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <li key={item.name}>
            <span aria-hidden="true">/</span>
            {last || !item.href ? (
              <span aria-current={last ? 'page' : undefined}>{item.name}</span>
            ) : (
              <a href={item.href}>{item.name}</a>
            )}
          </li>
        )
      })}
    </ol>
  </nav>
)

export const ArchivePage = ({ kind }: { kind: ArchiveKind }) => {
  const content = useContent()
  const copy = COPY[kind]

  useSiteSurface()

  let body: ReactNode
  if (content.status === 'loading') {
    body = <p className="rg-site-note">Loading…</p>
  } else if (content.status === 'error') {
    body = <p className="rg-site-note">{content.message}</p>
  } else if (kind === 'projects') {
    const items = content.data.projects
    body =
      items.length === 0 ? (
        <p className="rg-site-note">{copy.empty}</p>
      ) : (
        <ul className="rg-site-list">
          {items.map((p) => {
            const github = githubOf(p)
            const live = p.liveDemoUrl
            return (
              <li key={p.id} className="rg-snippet">
                <div className="rg-snippet-top">
                  <a className="rg-snippet-title" href={`/projects/${p.id}`}>
                    {p.title}
                  </a>
                  {(github || live) && (
                    <div className="rg-snippet-actions">
                      {github ? (
                        <a href={github} target="_blank" rel="noreferrer">
                          GitHub
                        </a>
                      ) : null}
                      {live ? (
                        <a href={live} target="_blank" rel="noreferrer">
                          Live
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="rg-snippet-copy">{p.description}</p>
              </li>
            )
          })}
        </ul>
      )
  } else if (kind === 'blogs') {
    const items = content.data.blogs
    body =
      items.length === 0 ? (
        <p className="rg-site-note">{copy.empty}</p>
      ) : (
        <ul className="rg-site-list">
          {items.map((b) => (
            <li key={b.id} className="rg-snippet">
              <a className="rg-snippet-title" href={`/blog/${b.id}`}>
                {b.title}
              </a>
              <p className="rg-snippet-copy">{b.description}</p>
              <div className="rg-snippet-meta">
                <span>{formatDate(b.timestamp)}</span>
                {b.readTime != null ? <span>{b.readTime} min</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )
  } else {
    body = <p className="rg-site-note">{copy.empty}</p>
  }

  return (
    <div className="rg-site">
      <section className="rg-site-section">
        <BackLink href={copy.dial} />
        <div className="rg-site-heading">
          <h1>{copy.title}</h1>
        </div>
        {body}
      </section>
    </div>
  )
}

/** Single blog post — mirrors web BlogLayout. */
export const BlogPost = ({ slug }: { slug: string }) => {
  const content = useContent()
  useSiteSurface()

  let article: ReactNode
  if (content.status === 'loading') {
    article = <p className="rg-site-note">Loading…</p>
  } else if (content.status === 'error') {
    article = <p className="rg-site-note">{content.message}</p>
  } else {
    const post = content.data.blogs.find((b: Blog) => b.id === slug)
    if (!post) {
      article = <p className="rg-site-note">Blog not found.</p>
    } else {
      article = (
        <>
          <Breadcrumbs
            items={[
              { name: 'Blog', href: '/blogs' },
              { name: post.title },
            ]}
          />
          <header className="rg-post-head">
            <h1 className="rg-post-title">{post.title}</h1>
            <div className="rg-snippet-meta">
              <span>{formatDate(post.timestamp)}</span>
              {post.readTime != null ? <span>{post.readTime} min</span> : null}
            </div>
          </header>
          <article className="rg-prose">
            {(post.longDescription || post.description)
              .split(/\n\n+/)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </article>
          <p className="rg-post-sign">~Rakshit Gumber</p>
        </>
      )
    }
  }

  return (
    <div className="rg-site">
      <section className="rg-site-section">
        <BackLink href="/?s=blogs" />
        {article}
      </section>
    </div>
  )
}

/** Single project page — mirrors web ProjectLayout / blog reading layout. */
export const ProjectPost = ({ slug }: { slug: string }) => {
  const content = useContent()
  useSiteSurface()

  let article: ReactNode
  if (content.status === 'loading') {
    article = <p className="rg-site-note">Loading…</p>
  } else if (content.status === 'error') {
    article = <p className="rg-site-note">{content.message}</p>
  } else {
    const project = content.data.projects.find((p: Project) => p.id === slug)
    if (!project) {
      article = <p className="rg-site-note">Project not found.</p>
    } else {
      const github = githubOf(project)
      const live = project.liveDemoUrl
      article = (
        <>
          <Breadcrumbs
            items={[
              { name: 'Projects', href: '/projects' },
              { name: project.title },
            ]}
          />
          <header className="rg-post-head">
            <h1 className="rg-post-title">{project.title}</h1>
            {(github || live) && (
              <div className="rg-snippet-actions">
                {github ? (
                  <a href={github} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                ) : null}
                {live ? (
                  <a href={live} target="_blank" rel="noreferrer">
                    Demo
                  </a>
                ) : null}
              </div>
            )}
          </header>
          <article className="rg-prose">
            {(project.longDescription || project.description)
              .split(/\n\n+/)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </article>
        </>
      )
    }
  }

  return (
    <div className="rg-site">
      <section className="rg-site-section">
        <BackLink href="/?s=projects" />
        {article}
      </section>
    </div>
  )
}
