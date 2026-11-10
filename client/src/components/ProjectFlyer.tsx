import { useEffect, useId, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '@/lib/content'
import { PROJECT_PALETTE } from '@/lib/stripPalette'

type Props = {
  project: Project
  index?: number
  onClose: () => void
}

function githubOf(p: Project) {
  return p.githubUrl || p.repoUrl
}

export const ProjectFlyer = ({ project, index = 0, onClose }: Props) => {
  const titleId = useId()
  const color = PROJECT_PALETTE.colors[index % PROJECT_PALETTE.colors.length]
  const github = githubOf(project)
  const live = project.liveDemoUrl
  const copy = project.longDescription || project.description

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const style = {
    '--panel': color,
    '--panel-ink': PROJECT_PALETTE.ink,
    '--burst-x': '72%',
    '--burst-y': '18%',
  } as CSSProperties

  const flyer = (
    <div
      className="rg-flyer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="rg-flyer-scrim"
        aria-label="Close project flyer"
        onClick={onClose}
      />
      <div className="rg-flyer-page" style={style}>
        <span className="rg-flyer-art" aria-hidden="true" />
        <div className="rg-flyer-inner">
          <header className="rg-flyer-head">
            <span className="rg-flyer-kicker">Now Showing</span>
            <span className="rg-flyer-num">#{String(index + 1).padStart(2, '0')}</span>
          </header>

          <h2 id={titleId} className="rg-flyer-title">
            {project.title}
          </h2>

          <p className="rg-flyer-tagline">{project.description}</p>

          {copy !== project.description ? (
            <p className="rg-flyer-body">{copy}</p>
          ) : null}

          {project.tags.length ? (
            <ul className="rg-flyer-tags">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}

          {(github || live) && (
            <div className="rg-flyer-ctas">
              {live ? (
                <a
                  className="rg-flyer-cta rg-flyer-cta--live"
                  href={live}
                  target="_blank"
                  rel="noreferrer"
                >
                  Live Project
                  <span aria-hidden="true">→</span>
                </a>
              ) : null}
              {github ? (
                <a
                  className="rg-flyer-cta rg-flyer-cta--git"
                  href={github}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          )}

          <button type="button" className="rg-flyer-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )

  // Mount inside the dial shell so the custom cursor ring (also in .t) stays above.
  const host = document.querySelector('.d-stations .t') ?? document.body
  return createPortal(flyer, host)
}
