import { PETAL_COUNT } from '@/components/petals/petalMotion'
import { usePetalField } from '@/components/petals/usePetalField'

/** Global sakura layer — floats above every route, never captures clicks. */
export const PetalOverlay = () => {
  const hostRef = usePetalField(PETAL_COUNT)

  return (
    <div
      ref={hostRef}
      className="rg-petals"
      aria-hidden
    />
  )
}
