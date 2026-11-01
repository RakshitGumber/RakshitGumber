type LogoProps = {
  className?: string
  title?: string
}

export function Logo({ className = 'size-16', title = 'RG' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <rect width="100" height="100" fill="#FF1A3C" />
      <g
        fill="#0A0A0A"
        fontFamily="Allura, cursive"
        fontSize="64"
        style={{ userSelect: 'none' }}
      >
        <text x="34" y="54" textAnchor="middle">
          R
        </text>
        <text x="66" y="66" textAnchor="middle">
          G
        </text>
      </g>
    </svg>
  )
}
