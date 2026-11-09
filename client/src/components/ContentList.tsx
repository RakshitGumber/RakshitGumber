import { useContent } from '@/hooks/useContent'
import type { Blog, Project } from '@/lib/content'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const ProjectItems = ({ projects }: { projects: Project[] }) => (
  <ul className="rg-grid">
    {projects.map((project) => (
      <li key={project.id} className="rg-square">
        <h3 className="rg-square-title">{project.title}</h3>
        <p className="rg-square-copy">{project.description}</p>
        <div className="rg-square-foot">
          <div className="rg-square-links">
            {project.liveDemoUrl ? (
              <a href={project.liveDemoUrl} target="_blank" rel="noreferrer">
                Live
              </a>
            ) : null}
            {project.githubUrl ? (
              <a href={project.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : null}
          </div>
          {project.private ? <span className="rg-square-meta">private</span> : null}
        </div>
      </li>
    ))}
  </ul>
)

const BlogItems = ({ blogs }: { blogs: Blog[] }) => (
  <ul className="rg-grid">
    {blogs.map((blog) => (
      <li key={blog.id} className="rg-square">
        <h3 className="rg-square-title">{blog.title}</h3>
        <p className="rg-square-copy">{blog.description}</p>
        <div className="rg-square-foot">
          <span className="rg-square-meta">{formatDate(blog.timestamp)}</span>
          {blog.readTime != null ? (
            <span className="rg-square-meta">{blog.readTime} min</span>
          ) : null}
        </div>
      </li>
    ))}
  </ul>
)

export const ProjectList = () => {
  const content = useContent()

  if (content.status === 'loading') {
    return <p className="lead det">Loading projects…</p>
  }
  if (content.status === 'error') {
    return <p className="lead det">{content.message}</p>
  }

  return <ProjectItems projects={content.data.projects} />
}

export const BlogList = () => {
  const content = useContent()

  if (content.status === 'loading') {
    return <p className="lead det">Loading blogs…</p>
  }
  if (content.status === 'error') {
    return <p className="lead det">{content.message}</p>
  }

  return <BlogItems blogs={content.data.blogs} />
}
