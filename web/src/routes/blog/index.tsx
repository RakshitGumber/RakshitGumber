import { useEffect, useMemo, useState } from 'react'

import {
  blogPosts,
  paginateBlogPosts,
  searchBlogPosts,
  sortBlogPosts,
  type BlogSortOrder,
} from '../../features/blog'

const PAGE_SIZE = 6

function readInitialSearchState() {
  if (typeof window === 'undefined') {
    return {
      query: '',
      sortOrder: 'featured' as BlogSortOrder,
      page: 1,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const sortOrder = params.get('sort')
  const page = Number.parseInt(params.get('page') ?? '1', 10)

  return {
    query: params.get('q') ?? '',
    sortOrder:
      sortOrder === 'newest' || sortOrder === 'oldest' || sortOrder === 'title'
        ? sortOrder
        : 'featured',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

function updateSearchParams(query: string, sortOrder: BlogSortOrder, page: number) {
  const params = new URLSearchParams()

  if (query.trim()) {
    params.set('q', query.trim())
  }

  if (sortOrder !== 'featured') {
    params.set('sort', sortOrder)
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  const nextSearch = params.toString()
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${
    window.location.hash
  }`

  window.history.replaceState({}, '', nextUrl)
}

export default function BlogIndexRoute() {
  const initialState = useMemo(readInitialSearchState, [])
  const [query, setQuery] = useState(initialState.query)
  const [sortOrder, setSortOrder] = useState<BlogSortOrder>(initialState.sortOrder)
  const [page, setPage] = useState(initialState.page)

  const filteredPosts = useMemo(() => {
    const searchedPosts = searchBlogPosts(blogPosts, query)
    const sortedPosts = sortBlogPosts(searchedPosts, sortOrder)

    return paginateBlogPosts(sortedPosts, page, PAGE_SIZE)
  }, [page, query, sortOrder])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    updateSearchParams(query, sortOrder, filteredPosts.page)
  }, [filteredPosts.page, query, sortOrder])

  useEffect(() => {
    if (page !== filteredPosts.page) {
      setPage(filteredPosts.page)
    }
  }, [filteredPosts.page, page])

  const featuredPosts = filteredPosts.items.filter((post) => post.featured)
  const regularPosts = filteredPosts.items.filter((post) => !post.featured)

  return (
    <main style={{ margin: '0 auto', maxWidth: 960, padding: '32px 20px 48px' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Blog</p>
        <h1 style={{ margin: '8px 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          Notes, essays, and project write-ups.
        </h1>
        <p style={{ margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
          A small collection of posts that can be searched, sorted, and paginated without any
          content tooling beyond the local workspace.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'minmax(0, 1fr) minmax(180px, 220px)',
          marginBottom: 24,
        }}
      >
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search posts"
            style={{ padding: '12px 14px' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <span>Sort</span>
          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as BlogSortOrder)
              setPage(1)
            }}
            style={{ padding: '12px 14px' }}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </label>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ margin: 0 }}>
            Showing {filteredPosts.items.length} of {filteredPosts.totalItems} posts
          </p>
          <p style={{ margin: 0 }}>
            Page {filteredPosts.page} of {filteredPosts.totalPages}
          </p>
        </div>

        {featuredPosts.length > 0 ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {featuredPosts.map((post) => (
              <article
                key={post.slug}
                style={{
                  border: '1px solid currentColor',
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <p style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  Featured
                </p>
                <h2 style={{ margin: '0 0 8px' }}>
                  <a href={`/blog/${post.slug}`}>{post.title}</a>
                </h2>
                <p style={{ margin: '0 0 12px', lineHeight: 1.6 }}>{post.description}</p>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  {post.publishedAtLabel} · {post.readingTimeMinutes} min read
                </p>
              </article>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: 12 }}>
          {regularPosts.map((post) => (
            <article
              key={post.slug}
              style={{
                border: '1px solid currentColor',
                borderRadius: 16,
                padding: 18,
              }}
            >
              <h2 style={{ margin: '0 0 8px' }}>
                <a href={`/blog/${post.slug}`}>{post.title}</a>
              </h2>
              <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{post.description}</p>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                {post.publishedAtLabel} · {post.readingTimeMinutes} min read
              </p>
            </article>
          ))}
        </div>

        {!filteredPosts.items.length ? (
          <p style={{ margin: 0 }}>No posts match the current search.</p>
        ) : null}
      </section>
    </main>
  )
}
