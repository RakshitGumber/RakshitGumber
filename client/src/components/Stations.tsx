import { useEffect, useRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { mount, type Meta, type Station, type Wave } from 'stations'

export type StationSpec = {
  id: string
  label: string
  field: string
  ink: string
  wave: Wave
  content: ReactNode
}

type StationsProps = {
  title: string
  stations: StationSpec[]
}

export const Stations = ({ title, stations }: StationsProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  // Keep the latest tree without remounting the dial on every render.
  const stationsRef = useRef(stations)
  stationsRef.current = stations

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const roots: Root[] = []
    const dialStations: Station[] = stationsRef.current.map((spec, i) => {
      const meta: Meta = {
        id: spec.id,
        label: spec.label,
        field: spec.field,
        ink: spec.ink,
        wave: spec.wave,
      }
      return {
        meta,
        mount(section: HTMLElement) {
          const root = createRoot(section)
          roots[i] = root
          root.render(stationsRef.current[i]?.content ?? null)
          return {
            destroy() {
              root.unmount()
            },
          }
        },
      }
    })

    return mount(host, { title, stations: dialStations })
  }, [title])

  return <div ref={hostRef} />
}
