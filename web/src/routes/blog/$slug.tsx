import { useEffect, useMemo, useState } from 'react'

import { BlogMarkdown, getBlogPost, blogPosts } from '../../features/blog'

function useCurrentSlug() {
  const [pathname, setPathname] = useState(() =>
    typeof window === 'undefined' ? '/blog' : window.location.pathname,
  )

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return pathname.split('/').filter(Boolean).at(-1) ?? ''
}

export default function BlogDetailRoute() {
  const slug = useCurrentSlug()
  const post = useMemo(() => getBlogPost(slug), [slug])

  if (!post) {
    return (
      <main style={{ margin: '0 auto', maxWidth: 720, padding: '32px 20px 48px' }}>
        <p style={{ margin: 0 }}>
          <a href="/blog">Back to blog</a>
        </p>
        <h1 style={{ margin: '16px 0 8px' }}>Post not found</h1>
        <p style={{ margin: 0 }}>
          The slug <code>{slug || '(empty)'}</code> does not match any local blog post.
        </p>
        {blogPosts.length ? (
          <ul>
            {blogPosts.map((entry) => (
              <li key={entry.slug}>
                <a href={`/blog/${entry.slug}`}>{entry.title}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    )
  }

  return (
    <main style={{ margin: '0 auto', maxWidth: 720, padding: '32px 20px 48px' }}>
      <p style={{ margin: 0 }}>
        <a href="/blog">Back to blog</a>
      </p>

      <header style={{ marginTop: 16, marginBottom: 24 }}>
        <p style={{ margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          {post.featured ? 'Featured post' : 'Post'}
        </p>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{post.title}</h1>
        <p style={{ margin: '0 0 12px', maxWidth: 640, lineHeight: 1.6 }}>{post.description}</p>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>
          {post.publishedAtLabel} · {post.readingTimeMinutes} min read
        </p>
      </header>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {post.tags.map((tag) => (
          <span key={tag} style={{ border: '1px solid currentColor', borderRadius: 999, padding: '6px 10px' }}>
            {tag}
          </span>
        ))}
      </section>

      {post.projectName ? (
        <section style={{ border: '1px solid currentColor', borderRadius: 16, padding: 18, marginBottom: 24 }}>
          <p style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Project metadata
          </p>
          <h2 style={{ margin: '0 0 8px' }}>
            {post.projectUrl ? (
              <a href={post.projectUrl} rel="noreferrer">
                {post.projectName}
              </a>
            ) : (
              post.projectName
            )}
          </h2>
          {post.projectSummary ? <p style={{ margin: '0 0 10px' }}>{post.projectSummary}</p> : null}
          {post.projectStack?.length ? (
            <p style={{ margin: 0 }}>Stack: {post.projectStack.join(', ')}</p>
          ) : null}
        </section>
      ) : null}

      <article style={{ lineHeight: 1.75 }}>
        <BlogMarkdown body={post.body} />
      </article>
    </main>
  )
}
