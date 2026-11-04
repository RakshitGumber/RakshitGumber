import type { Project } from '../../data/projects'
import { SITE } from '../../data/site'

type Props = {
  project: Project | null
  homeOpen: boolean
  onClose: () => void
}

export function ProjectView({ project, homeOpen, onClose }: Props) {
  if (!project && !homeOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={project ? project.title : SITE.name}
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/55 p-4 sm:items-center sm:p-8"
      onClick={onClose}
    >
      <article
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border-[5px] border-white bg-[var(--color-glass)] text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        style={{ fontFamily: 'var(--font-condensed)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-28 sm:h-36"
          style={{ background: project?.accent ?? '#FFE566' }}
        />
        <div className="space-y-3 p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">
            {project ? `CH ${String(project.channel).padStart(3, '0')} · ${project.tags}` : 'CH 000 · Home'}
          </p>
          <h1 className="text-3xl leading-none sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            {project ? project.title : SITE.headline}
          </h1>
          <p className="text-base leading-relaxed text-white/85 sm:text-lg">
            {project ? project.summary : SITE.bio}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {project?.href ? (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white px-4 py-2 text-sm font-bold tracking-wide text-black uppercase"
              >
                Open project
              </a>
            ) : null}
            {!project
              ? SITE.socials.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold tracking-wide uppercase"
                  >
                    {s.label}
                  </a>
                ))
              : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold tracking-wide uppercase"
            >
              Back
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
