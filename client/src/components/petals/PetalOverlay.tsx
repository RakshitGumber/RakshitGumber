import { PETAL_COUNT } from '@/components/petals/petalMotion'
import { usePetalField } from '@/components/petals/usePetalField'

/** Floating sakura layer above the home title. */
export const PetalOverlay = () => {
  const hostRef = usePetalField(PETAL_COUNT)

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-20 will-change-transform"
      aria-hidden
    />
  )
}
