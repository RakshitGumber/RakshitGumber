import { useEffect, useRef } from 'react'
import { createPanZoomCanvas } from './controls'
import { createFocusUi } from './focusUi'
import { createRetroGadget, GADGETS, type RetroGadget } from '../Objects/RetroGadget'
import { createLogoSprite } from '../Overlay/logoTexture'

export const Canvas = () => {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let dead = false
    let destroy = () => {}

    void (async () => {
      const gadgets: RetroGadget[] = []
      let focused = -1
      let focusUi: ReturnType<typeof createFocusUi> | null = null
      let setScreenColor = (_hex: string) => {}

      const setFocus = (i: number) => {
        if (focused === i) return
        if (focused >= 0) gadgets[focused]?.setFocused(false)
        focused = i
        if (focused >= 0) {
          const g = gadgets[focused]
          g.setFocused(true)
          focusUi?.setFocus({
            accent: g.def.accent,
            ink: g.def.ink,
            title: g.def.title,
            detail: g.def.detail,
          })
          setScreenColor(g.def.accent)
        } else {
          focusUi?.setFocus(null)
          setScreenColor('#0B0B0B')
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
      setScreenColor = camera.setScreenColor

      focusUi = createFocusUi(camera.ui)
      const logo = await createLogoSprite(160)
      if (dead) return destroy()
      camera.ui.addChild(logo)

      const placeUi = () => {
        const { width: w, height: h } = camera.app.screen
        // Keep chrome inside the CRT glass pad + soft rim.
        logo.position.set(Math.max(120, w * 0.14), Math.max(120, h * 0.15))
        focusUi?.layout(w, h)
      }
      placeUi()

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
        placeUi()
        for (const g of gadgets) g.place(w, h)
        if (focused >= 0) {
          const g = gadgets[focused]
          const z = camera.world.scale.x
          camera.world.x = w / 2 - g.x * z
          camera.world.y = h / 2 - g.y * z
        }
        camera.clampWorld()
      }

      const onTick = (ticker: { deltaMS: number }) => {
        focusUi?.tick(ticker.deltaMS)
      }
      camera.app.ticker.add(onTick)

      layout()
      camera.snapTo({ x: gadgets[0].x, y: gadgets[0].y }, undefined, 0)
      camera.app.renderer.on('resize', layout)
      destroy = () => {
        camera.app.ticker.remove(onTick)
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
      className="absolute inset-0 overflow-hidden bg-black"
      aria-label="Retro gadgets canvas — drag to pan, scroll to zoom"
    >
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  )
}
