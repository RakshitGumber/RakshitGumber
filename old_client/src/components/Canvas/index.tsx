import { useEffect, useRef, type MutableRefObject } from 'react'
import { createPanZoomCanvas } from './controls'
import { createFocusUi } from './focusUi'
import { createHomeCard } from '../Board/HomeCard'
import { createProjectCard } from '../Board/ProjectCard'
import { createLogoSprite } from '../Overlay/logoTexture'
import { HOME_INDEX, PROJECTS, projectByIndex } from '../../data/projects'
import { SITE } from '../../data/site'

const SPACING = 560

export type BoardApi = {
  snapToIndex: (index: number) => void
  getFocusedIndex: () => number
  panBy: (dx: number, dy: number) => void
  clearFocus: () => void
}

type Props = {
  onFocusChange: (index: number) => void
  onActivate: (index: number) => void
  apiRef: MutableRefObject<BoardApi | null>
}

export const Canvas = ({ onFocusChange, onActivate, apiRef }: Props) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const onFocusChangeRef = useRef(onFocusChange)
  const onActivateRef = useRef(onActivate)

  useEffect(() => {
    onFocusChangeRef.current = onFocusChange
    onActivateRef.current = onActivate
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let dead = false
    let destroy = () => {}

    void (async () => {
      const home = createHomeCard()
      const cards = PROJECTS.map((p) => createProjectCard(p, SPACING))
      const points = () => [{ x: home.x, y: home.y }, ...cards.map((c) => ({ x: c.x, y: c.y }))]

      let focused = -1
      let focusUi: ReturnType<typeof createFocusUi> | null = null
      let setScreenColor = (_hex: string) => {}

      const focusTone = (i: number) => {
        if (i === HOME_INDEX) {
          return {
            accent: '#FFE566',
            ink: '#FFE566',
            title: SITE.name,
            detail: SITE.role,
          }
        }
        const p = projectByIndex(i)
        if (!p) return null
        return {
          accent: p.accent,
          ink: p.ink,
          title: p.title,
          detail: p.tags,
        }
      }

      const setFocus = (i: number) => {
        if (focused === i) return
        focused = i
        onFocusChangeRef.current(i)
        const tone = i >= 0 ? focusTone(i) : null
        if (tone) {
          focusUi?.setFocus(tone)
          // Keep glass mostly dark; only project cards tint the phosphor.
          setScreenColor(i === HOME_INDEX ? '#0B0B0B' : tone.accent)
        } else {
          focusUi?.setFocus(null)
          setScreenColor('#0B0B0B')
        }
      }

      const camera = await createPanZoomCanvas(host, {
        getPoints: points,
        onSnap: setFocus,
        onClear: () => setFocus(-1),
        onActivate: (i) => onActivateRef.current(i),
      })
      destroy = () => camera.destroy()
      if (dead) return destroy()
      setScreenColor = camera.setScreenColor

      focusUi = createFocusUi(camera.ui)
      const logo = await createLogoSprite(132)
      if (dead) return destroy()
      camera.ui.addChild(logo)

      camera.world.addChild(home.root)
      for (const c of cards) camera.world.addChild(c.root)

      const placeUi = () => {
        const { width: w, height: h } = camera.app.screen
        logo.position.set(Math.max(110, w * 0.14), Math.max(110, h * 0.15))
        focusUi?.layout(w, h)
      }
      placeUi()

      const layout = () => {
        const { width: w, height: h } = camera.app.screen
        placeUi()
        home.place(SPACING)
        for (const c of cards) c.place(SPACING)
        if (focused >= 0) {
          const pts = points()
          const p = pts[focused]
          if (p) {
            const z = camera.world.scale.x
            camera.world.x = w / 2 - p.x * z
            camera.world.y = h / 2 - p.y * z
          }
        }
        camera.clampWorld()
      }

      apiRef.current = {
        snapToIndex: (index) => {
          const pts = points()
          const p = pts[index]
          if (!p) return
          camera.snapTo(p, undefined, index)
        },
        getFocusedIndex: () => camera.getFocusedIndex(),
        panBy: (dx, dy) => camera.panBy(dx, dy),
        clearFocus: () => camera.clearFocus(),
      }

      const onTick = (ticker: { deltaMS: number }) => {
        focusUi?.tick(ticker.deltaMS)
      }
      camera.app.ticker.add(onTick)

      layout()
      camera.snapTo({ x: home.x, y: home.y }, undefined, HOME_INDEX)
      camera.app.renderer.on('resize', layout)
      destroy = () => {
        apiRef.current = null
        camera.app.ticker.remove(onTick)
        camera.app.renderer.off('resize', layout)
        camera.destroy()
      }
    })()

    return () => {
      dead = true
      destroy()
    }
  }, [apiRef])

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-black"
      aria-label="Portfolio board — drag to pan, scroll to zoom, click a screen to open"
    >
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  )
}
