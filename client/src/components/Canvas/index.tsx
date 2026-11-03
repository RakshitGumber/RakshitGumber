import { useEffect, useRef, useState } from 'react'
import { createPanZoomCanvas } from './controls'
import { createRetroGadget, GADGETS, type RetroGadget } from '../Objects/RetroGadget'
import { FocusChrome, type FocusInfo } from '../Overlay/FocusChrome'

export const Canvas = () => {
  const hostRef = useRef<HTMLDivElement>(null)
  const [focus, setFocusInfo] = useState<FocusInfo | null>(null)
  const [bg, setBg] = useState('#0B0B0B')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let dead = false
    let destroy = () => {}

    void (async () => {
      const gadgets: RetroGadget[] = []
      let focused = -1

      const setFocus = (i: number) => {
        if (focused === i) return
        if (focused >= 0) gadgets[focused]?.setFocused(false)
        focused = i
        if (focused >= 0) {
          const g = gadgets[focused]
          g.setFocused(true)
          setFocusInfo({
            accent: g.def.accent,
            ink: g.def.ink,
            title: g.def.title,
            detail: g.def.detail,
          })
          setBg(g.def.accent)
        } else {
          setFocusInfo(null)
          setBg('#0B0B0B')
        }
      }

      const camera = await createPanZoomCanvas(host, {
        getPoints: () => gadgets.map((g) => ({ x: g.x, y: g.y })),
        onSnap: setFocus,
        onClear: () => setFocus(-1),
        onPointer: (sx, sy, dragging) => {
          if (focused < 0 || dragging) return
          const { width: w, height: h } = camera.app.screen
          const nx = Math.max(-1, Math.min(1, (sx - w / 2) / (w * 0.5)))
          const ny = Math.max(-1, Math.min(1, (sy - h / 2) / (h * 0.5)))
          gadgets[focused]?.setParallax(nx, ny)
        },
      })
      destroy = () => camera.destroy()
      if (dead) return destroy()

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const displayPx = Math.min(camera.app.screen.width, camera.app.screen.height) * 0.42 * dpr
      const resolution = Math.max(2, Math.ceil(displayPx / 240))

      for (const def of GADGETS) {
        const gadget = await createRetroGadget(def, resolution)
        if (dead) return destroy()
        camera.world.addChild(gadget.root)
        gadgets.push(gadget)
      }

      const layout = () => {
        const { width: w, height: h } = camera.app.screen
        for (const g of gadgets) g.place(w, h)
        if (focused >= 0) {
          const g = gadgets[focused]
          const z = camera.world.scale.x
          camera.world.x = w / 2 - g.x * z
          camera.world.y = h / 2 - g.y * z
        }
        camera.clampWorld()
      }

      layout()
      camera.snapTo({ x: gadgets[0].x, y: gadgets[0].y }, undefined, 0)
      camera.app.renderer.on('resize', layout)
      destroy = () => {
        camera.app.renderer.off('resize', layout)
        camera.destroy()
      }
    })()

    return () => {
      dead = true
      destroy()
    }
  }, [])

  return (
    <div
      className="absolute inset-0 overflow-hidden transition-colors duration-[980ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ backgroundColor: bg }}
      aria-label="Retro gadgets canvas — drag to pan, scroll to zoom"
    >
      <div ref={hostRef} className="absolute inset-0" />
      <FocusChrome focus={focus} />
    </div>
  )
}
