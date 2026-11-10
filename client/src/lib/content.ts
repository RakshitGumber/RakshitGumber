export type Project = {
  id: string
  title: string
  description: string
  longDescription?: string
  tags: string[]
  githubUrl: string | null
  repoUrl: string | null
  liveDemoUrl: string | null
  private: boolean
  featured: boolean
  timestamp: string
}

export type Blog = {
  id: string
  title: string
  description: string
  longDescription?: string
  tags: string[]
  readTime?: number
  featured: boolean
  timestamp: string
}

export type Content = {
  projects: Project[]
  blogs: Blog[]
}

/** Swap VITE_CONTENT_API_URL to the hosted API when it exists. */
const CONTENT_URL =
  import.meta.env.VITE_CONTENT_API_URL?.replace(/\/$/, '') ||
  '/data/content.json'

let cache: Promise<Content> | null = null

export function fetchContent(): Promise<Content> {
  if (!cache) {
    cache = fetch(CONTENT_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load content (${res.status})`)
        return res.json() as Promise<Content>
      })
      .catch((err) => {
        cache = null
        throw err
      })
  }
  return cache
}
