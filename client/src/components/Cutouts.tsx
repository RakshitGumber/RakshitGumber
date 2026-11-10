import type { MouseEvent } from 'react'

export type CutoutKind = 'about' | 'blogs' | 'projects' | 'contact' | 'cases'

/** Each cutout's PNG (transparent background) in public/cutouts, keyed by the station it opens. */
const ART: Record<CutoutKind, { label: string; src: string }> = {
  about: { label: 'About', src: '/cutouts/punching-bag.webp' },
  blogs: { label: 'Blog', src: '/cutouts/boombox.webp' },
  projects: { label: 'Projects', src: '/cutouts/computer.webp' },
  contact: { label: 'Contact', src: '/cutouts/race-car.webp' },
  cases: { label: 'Case Studies', src: '/cutouts/camera.webp' },
}

const CutoutArt = ({ kind }: { kind: CutoutKind }) => (
  <img className="rg-cut-art" src={ART[kind].src} alt="" draggable={false} />
)

/** Ransom-note title: each letter on its own scrap of paper, words kept whole. */
const CutoutLabel = ({ text }: { text: string }) => (
  <span className="rg-cut-label" aria-hidden="true">
    {text.split(' ').map((word) => (
      <span key={word} className="rg-cut-word">
        {[...word].map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </span>
    ))}
  </span>
)

/** Retune the dial to a station without a page load. */
function tune(e: MouseEvent<HTMLAnchorElement>, id: CutoutKind) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  const u = new URL(location.href)
  u.searchParams.set('s', id)
  history.pushState(null, '', u)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const HOME_ORDER: CutoutKind[] = ['about', 'cases', 'blogs', 'projects', 'contact']

/** Home: cutouts scattered across the stage, each opening its page. */
export const HomeCutouts = () => (
  <nav className="rg-cuts" aria-label="Pages">
    {HOME_ORDER.map((kind) => (
      <a
        key={kind}
        href={`/?s=${kind}`}
        className={`rg-cut rg-cut--${kind}`}
        aria-label={ART[kind].label}
        onClick={(e) => tune(e, kind)}
      >
        <CutoutArt kind={kind} />
        <CutoutLabel text={ART[kind].label} />
      </a>
    ))}
  </nav>
)

/** The same cutout pinned on its own page, so home and page read as a pair. */
export const PageCutout = ({ kind }: { kind: CutoutKind }) => (
  <div className={`rg-cut rg-cut--page rg-cut--${kind}`} aria-hidden="true">
    <CutoutArt kind={kind} />
    <CutoutLabel text={ART[kind].label} />
  </div>
)
