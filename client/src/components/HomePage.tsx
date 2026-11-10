import { useRef } from 'react'
import { Title } from '@/components/Title'
import { useMouseParallax } from '@/hooks/useMouseParallax'

const CHIPS = ['programmer', 'learner', 'deviant'] as const

/** Quiet home stage — name first, light comic ink only. */
export const HomePage = () => {
  const leadRef = useRef<HTMLParagraphElement>(null)
  const chipsRef = useRef<HTMLUListElement>(null)

  // Same parallax as the title, with a longer follow so it drifts slower.
  useMouseParallax(leadRef, { duration: 1.05 })
  useMouseParallax(chipsRef, { duration: 1.05 })

  return (
    <div className="rg-home" data-own>
      <div className="rg-home-stage">
        <div className="rg-home-ink" aria-hidden />
        <div className="rg-home-title">
          <div className="rg-home-stack">
            <div className="rg-home-head">
              <p ref={leadRef} className="rg-home-lead">
                I am
              </p>
              <Title />
            </div>
            <ul ref={chipsRef} className="rg-home-chips">
              {CHIPS.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="rg-home-mark" aria-hidden="true">
          No. 01
        </p>
        <p className="rg-home-hint" aria-hidden="true">
          Right swipe to tune <span>→</span>
        </p>
      </div>
    </div>
  )
}
