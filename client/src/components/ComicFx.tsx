import type { CSSProperties } from 'react'

export type ComicFxVariant =
  | 'radial-burst'
  | 'edge-focus'
  | 'speed-streaks'
  | 'corner-flare'
  | 'slash-burst'

type ComicFxProps = {
  variant: ComicFxVariant
  /** Station glow pair — drives ray color. */
  accents: [string, string]
}

/** Manga / comic motion field behind station copy. */
export const ComicFx = ({ variant, accents }: ComicFxProps) => (
  <div
    className={`rg-comic rg-comic--${variant}`}
    style={
      {
        '--fx-a': accents[0],
        '--fx-b': accents[1],
      } as CSSProperties
    }
    aria-hidden
  >
    {variant === 'speed-streaks' && <SpeedStreaks />}
  </div>
)

/** Horizontal whoosh streaks with tapered opacity. */
const SpeedStreaks = () => (
  <svg className="rg-comic-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <linearGradient id="fx-speed" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--fx-a)" stopOpacity="0" />
        <stop offset="25%" stopColor="var(--fx-a)" stopOpacity="0.9" />
        <stop offset="70%" stopColor="var(--fx-b)" stopOpacity="1" />
        <stop offset="100%" stopColor="var(--fx-b)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="fx-speed-hi" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="40%" stopColor="#fff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[
      { y: 10, h: 2.8, x: -5, w: 75 },
      { y: 18, h: 1.4, x: 10, w: 70 },
      { y: 26, h: 3.6, x: -8, w: 88 },
      { y: 36, h: 1.2, x: 5, w: 55 },
      { y: 44, h: 2.2, x: 20, w: 78 },
      { y: 54, h: 4.2, x: -10, w: 95 },
      { y: 64, h: 1.6, x: 8, w: 62 },
      { y: 72, h: 2.6, x: 15, w: 80 },
      { y: 82, h: 1.1, x: 0, w: 48 },
    ].map((r, i) => (
      <rect
        key={i}
        x={r.x}
        y={r.y}
        width={r.w}
        height={r.h}
        rx={r.h / 2}
        fill={i % 3 === 1 ? 'url(#fx-speed-hi)' : 'url(#fx-speed)'}
        opacity={0.8}
      />
    ))}
  </svg>
)
