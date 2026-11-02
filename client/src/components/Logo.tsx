type LogoProps = {
  className?: string
  title?: string
}

export function Logo({ className = 'h-40 w-auto', title = 'RG' }: LogoProps) {
  // Portrait sticker:
  // - top / right / bottom mostly clean
  // - all corners withered differently
  // - one clear cut on the left side
  const outer = [
    'M 14 4',
    'L 36 2.5',
    'L 54 3.5',
    // top-right withered
    'C 59.5 4.2 62 9 60.5 14',
    'L 61.5 40',
    'L 61 70',
    'L 60 90',
    // bottom-right withered
    'C 59 96.5 53 100 45.5 99',
    'L 28 100.5',
    'L 13 98.5',
    // bottom-left withered
    'C 7.5 97.5 5.5 92 7 86.5',
    'L 6.5 72',
    // LEFT-SIDE CUT
    'L 6 64',
    'L 20 58.5',
    'L 6.5 53',
    'L 7 30',
    'L 7.5 14',
    // top-left withered
    'C 8 8.5 10.5 4.8 14 4',
    'Z',
  ].join(' ')

  const inner = [
    'M 17 7.5',
    'L 36 6.2',
    'L 51.5 7',
    'C 55.5 7.6 57.8 11 56.8 14.8',
    'L 57.8 40',
    'L 57.2 70',
    'L 56.2 88.5',
    'C 55.5 93.5 51 96.2 44.5 95.5',
    'L 28 96.8',
    'L 15.5 95',
    'C 11.5 94.2 10 90 11 85.5',
    'L 10.5 72',
    'L 10 64.5',
    'L 20.5 59',
    'L 10.5 54',
    'L 11 30',
    'L 11.5 15.5',
    'C 11.8 11 14 8.2 17 7.5',
    'Z',
  ].join(' ')

  return (
    <svg
      viewBox="0 0 68 103"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <filter
          id="grain"
          x="-2%"
          y="-2%"
          width="104%"
          height="104%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.15"
            numOctaves="3"
            seed="12"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.42
                    0 0 0 0 0.3
                    0 0 0 0 0.2
                    0 0 0 0.42 0"
            result="grainAlpha"
          />
          <feBlend in="SourceGraphic" in2="grainAlpha" mode="multiply" result="stained" />
          <feComposite in="stained" in2="SourceGraphic" operator="in" />
        </filter>

        <clipPath id="sticker">
          <path d={outer} />
        </clipPath>
      </defs>

      <path d={outer} fill="#C4A872" filter="url(#grain)" />
      <path d={inner} fill="#5C1824" filter="url(#grain)" />

      <text
        x="35"
        y="75"
        textAnchor="middle"
        fill="#D9C193"
        fontFamily="'Bebas Neue', 'Arial Narrow', sans-serif"
        fontSize="74"
        letterSpacing="-6"
        transform="translate(35 51) scale(1.06 1.38) translate(-35 -51)"
        style={{ userSelect: 'none' }}
      >
        RG
      </text>

      <g clipPath="url(#sticker)" pointerEvents="none">
        <g fill="none" strokeLinecap="round" style={{ mixBlendMode: 'multiply' }}>
          <path d="M 12 17 C 26 24 42 11 58 18" stroke="#1A070B" strokeWidth="2" opacity="0.34" />
          <path d="M 11 40 C 24 32 36 50 50 38 C 56 32 58 44 57 52" stroke="#1A070B" strokeWidth="2.3" opacity="0.4" />
          <path d="M 14 66 C 28 75 42 60 56 70" stroke="#1A070B" strokeWidth="1.8" opacity="0.3" />
          <path d="M 13 87 C 28 94 42 83 54 90" stroke="#1A070B" strokeWidth="1.45" opacity="0.26" />
          <path d="M 25 5 C 20 42 28 72 22 98" stroke="#1A070B" strokeWidth="1.25" opacity="0.2" />
          <path d="M 46 4 C 51 44 43 76 48 98" stroke="#1A070B" strokeWidth="1.1" opacity="0.18" />
        </g>

        <g fill="none" strokeLinecap="round" opacity="0.2">
          <path d="M 12 18.4 C 26 25.4 42 12.4 58 19.4" stroke="#E8D4A8" strokeWidth="0.6" />
          <path d="M 11 41.6 C 24 33.6 36 51.6 50 39.6" stroke="#E8D4A8" strokeWidth="0.65" />
        </g>

        {/* Peel at the left cut */}
        <path d="M 20 58.5 L 24.5 60 L 19.5 63 Z" fill="#C4A872" />
        <path
          d="M 20 58.5 L 24.5 60 L 19.5 63"
          fill="none"
          stroke="#1A070B"
          strokeWidth="0.55"
          opacity="0.45"
        />
      </g>
    </svg>
  )
}
