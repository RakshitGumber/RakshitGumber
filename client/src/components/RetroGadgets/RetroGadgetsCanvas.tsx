import { useEffect, useRef } from 'react'
import { createPanZoomCanvas, FOCUS_ZOOM } from './PanZoomCanvas'
import { createRetroGadget, GADGETS, type RetroGadget } from './RetroGadget'

export default function RetroGadgetsCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)

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
        if (focused >= 0) gadgets[focused]?.setFocused(true)
      }

      const camera = await createPanZoomCanvas(host, {
        getPoints: () => gadgets.map((g) => ({ x: g.x, y: g.y })),
        onNear: setFocus,
        onSnap: setFocus,
        onClear: () => setFocus(-1),
      })
      destroy = () => camera.destroy()
      if (dead) return destroy()

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const displayPx =
        Math.min(camera.app.screen.width, camera.app.screen.height) * 0.42 * dpr
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
      }

      layout()
      setFocus(0)
      camera.snapTo({ x: gadgets[0].x, y: gadgets[0].y }, FOCUS_ZOOM)
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
      ref={hostRef}
      className="absolute inset-0 overflow-hidden"
      aria-label="Retro gadgets canvas — drag to pan, scroll to zoom"
    />
  )
}
