import { useEffect, useRef } from 'react'
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Texture,
} from 'pixi.js'

const GADGETS = [
  { src: '/gadgets/walkman.svg', label: 'Walkman' },
  { src: '/gadgets/crt.svg', label: 'CRT' },
  { src: '/gadgets/gameboy.svg', label: 'Game Boy' },
  { src: '/gadgets/flipphone.svg', label: 'Flip Phone' },
  { src: '/gadgets/boombox.svg', label: 'Boombox' },
  { src: '/gadgets/camcorder.svg', label: 'Camcorder' },
] as const

/** Grid offsets in screen-units — each step is one full viewport away. */
const LAYOUT: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
]

type GadgetNode = {
  root: Container
  sprite: Sprite
  border: Graphics
  worldX: number
  worldY: number
}

type SnapState = {
  active: boolean
  fromX: number
  fromY: number
  toX: number
  toY: number
  elapsed: number
  duration: number
  overshoot: number
}

const FOCUS_RADIUS_FACTOR = 0.28
const SNAP_DURATION_MS = 220
const OVERSHOOT = 0.18
const BORDER_PAD = 14
const BORDER_WIDTH = 5
const ZOOM_MIN = 0.28
const ZOOM_MAX = 1
const ZOOM_WHEEL_STEP = 0.0014

function dramaticSnapT(t: number, overshoot: number): number {
  // Hard, theatrical motion: race past the target, then slam back.
  if (t < 0.55) {
    const u = t / 0.55
    return (1 + overshoot) * u
  }
  if (t < 0.78) {
    const u = (t - 0.55) / 0.23
    return 1 + overshoot * (1 - u)
  }
  // Final jolt into place (not eased)
  return 1
}

export default function RetroGadgetsCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let destroyed = false
    let app: Application | null = null
    let detachListeners: (() => void) | null = null

    const boot = async () => {
      const instance = new Application()
      await instance.init({
        resizeTo: host,
        background: '#0B0B0B',
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        preference: 'webgl',
      })

      if (destroyed) {
        instance.destroy(true)
        return
      }

      app = instance
      host.appendChild(instance.canvas)
      instance.canvas.style.display = 'block'
      instance.canvas.style.width = '100%'
      instance.canvas.style.height = '100%'
      instance.canvas.style.touchAction = 'none'
      instance.canvas.style.cursor = 'grab'

      const world = new Container()
      instance.stage.addChild(world)

      // Pixi rasterizes SVGs to bitmaps. Native viewBox is 240px, but we
      // display much larger (and on retina), so load at a matching resolution.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const displayPx =
        Math.min(instance.screen.width, instance.screen.height) * 0.42 * dpr
      const svgResolution = Math.max(2, Math.ceil(displayPx / 240))

      const textures = await Promise.all(
        GADGETS.map((g) =>
          Assets.load<Texture>({
            alias: `${g.src}@${svgResolution}`,
            src: g.src,
            data: {
              width: 240,
              height: 240,
              resolution: svgResolution,
            },
          }),
        ),
      )

      if (destroyed) return

      const nodes: GadgetNode[] = []
      let focused: GadgetNode | null = null

      const spacingX = () => instance.screen.width
      const spacingY = () => instance.screen.height
      const gadgetSize = () => Math.min(instance.screen.width, instance.screen.height) * 0.42

      const drawBorder = (node: GadgetNode, on: boolean) => {
        node.border.clear()
        if (!on) return
        const w = node.sprite.width
        const h = node.sprite.height
        node.border
          .rect(
            -w / 2 - BORDER_PAD,
            -h / 2 - BORDER_PAD,
            w + BORDER_PAD * 2,
            h + BORDER_PAD * 2,
          )
          .stroke({ width: BORDER_WIDTH, color: 0xd01e14, alpha: 1 })
      }

      const placeNodes = () => {
        const sx = spacingX()
        const sy = spacingY()
        const size = gadgetSize()

        LAYOUT.forEach(([gx, gy], i) => {
          const texture = textures[i]
          if (!texture) return

          let node = nodes[i]
          if (!node) {
            const root = new Container()
            const sprite = new Sprite(texture)
            sprite.anchor.set(0.5)
            const border = new Graphics()
            root.addChild(sprite)
            root.addChild(border)
            world.addChild(root)
            node = { root, sprite, border, worldX: 0, worldY: 0 }
            nodes[i] = node
          }

          node.worldX = gx * sx
          node.worldY = gy * sy
          node.root.position.set(node.worldX, node.worldY)

          const scale = size / Math.max(node.sprite.texture.width, node.sprite.texture.height)
          node.sprite.scale.set(scale)
          drawBorder(node, node === focused)
        })
      }

      placeNodes()

      // Start centered on the first gadget
      world.position.set(instance.screen.width / 2, instance.screen.height / 2)

      const snap: SnapState = {
        active: false,
        fromX: 0,
        fromY: 0,
        toX: 0,
        toY: 0,
        elapsed: 0,
        duration: SNAP_DURATION_MS,
        overshoot: OVERSHOOT,
      }

      const setFocus = (node: GadgetNode | null) => {
        if (focused === node) return
        if (focused) drawBorder(focused, false)
        focused = node
        if (focused) drawBorder(focused, true)
      }

      const screenPos = (node: GadgetNode) => ({
        x: world.x + node.worldX * world.scale.x,
        y: world.y + node.worldY * world.scale.y,
      })

      const startSnapTo = (node: GadgetNode) => {
        const z = world.scale.x
        snap.active = true
        snap.fromX = world.x
        snap.fromY = world.y
        snap.toX = instance.screen.width / 2 - node.worldX * z
        snap.toY = instance.screen.height / 2 - node.worldY * z
        snap.elapsed = 0
        snap.duration = SNAP_DURATION_MS
        snap.overshoot = OVERSHOOT
        setFocus(node)
      }

      const nearestInFocus = (): GadgetNode | null => {
        const cx = instance.screen.width / 2
        const cy = instance.screen.height / 2
        const radius =
          Math.min(instance.screen.width, instance.screen.height) * FOCUS_RADIUS_FACTOR

        let best: GadgetNode | null = null
        let bestDist = Infinity

        for (const node of nodes) {
          const { x: sx, y: sy } = screenPos(node)
          const dist = Math.hypot(sx - cx, sy - cy)
          if (dist < radius && dist < bestDist) {
            best = node
            bestDist = dist
          }
        }
        return best
      }

      const setZoomAt = (nextZoom: number, anchorX: number, anchorY: number) => {
        const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom))
        if (z === world.scale.x) return

        // Keep the world point under the anchor fixed on screen while scaling.
        const wx = (anchorX - world.x) / world.scale.x
        const wy = (anchorY - world.y) / world.scale.y
        world.scale.set(z)
        world.x = anchorX - wx * z
        world.y = anchorY - wy * z
        snap.active = false
      }

      // Pointer pan + pinch zoom
      let dragging = false
      let lastX = 0
      let lastY = 0
      let pointerId: number | null = null
      const pointers = new Map<number, { x: number; y: number }>()
      let pinchDist = 0

      const onPointerDown = (e: PointerEvent) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        instance.canvas.setPointerCapture(e.pointerId)

        if (pointers.size === 2) {
          dragging = false
          pointerId = null
          const [a, b] = [...pointers.values()]
          pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
          instance.canvas.style.cursor = 'grabbing'
          return
        }

        if (snap.active) return
        dragging = true
        pointerId = e.pointerId
        lastX = e.clientX
        lastY = e.clientY
        instance.canvas.style.cursor = 'grabbing'
      }

      const onPointerMove = (e: PointerEvent) => {
        if (pointers.has(e.pointerId)) {
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        }

        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (pinchDist > 0) {
            const rect = instance.canvas.getBoundingClientRect()
            const midX = (a.x + b.x) / 2 - rect.left
            const midY = (a.y + b.y) / 2 - rect.top
            setZoomAt(world.scale.x * (dist / pinchDist), midX, midY)
          }
          pinchDist = dist
          return
        }

        if (!dragging || e.pointerId !== pointerId) return
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        world.x += dx
        world.y += dy

        // Live focus ring while dragging near center (no snap yet)
        const near = nearestInFocus()
        if (near) setFocus(near)
        else if (focused) setFocus(null)
      }

      const onPointerUp = (e: PointerEvent) => {
        pointers.delete(e.pointerId)

        if (pointers.size < 2) pinchDist = 0

        if (pointers.size === 1) {
          const remaining = pointers.entries().next().value
          if (remaining) {
            const [id, p] = remaining
            pointerId = id
            lastX = p.x
            lastY = p.y
            dragging = !snap.active
          }
          return
        }

        if (e.pointerId !== pointerId && pointerId !== null) return
        dragging = false
        pointerId = null
        instance.canvas.style.cursor = 'grab'

        if (pointers.size > 0) return

        const near = nearestInFocus()
        if (near) startSnapTo(near)
        else setFocus(null)
      }

      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = instance.canvas.getBoundingClientRect()
        const anchorX = e.clientX - rect.left
        const anchorY = e.clientY - rect.top
        // Positive deltaY = scroll down = zoom out
        const next = world.scale.x * Math.exp(-e.deltaY * ZOOM_WHEEL_STEP)
        setZoomAt(next, anchorX, anchorY)
      }

      instance.canvas.addEventListener('pointerdown', onPointerDown)
      instance.canvas.addEventListener('pointermove', onPointerMove)
      instance.canvas.addEventListener('pointerup', onPointerUp)
      instance.canvas.addEventListener('pointercancel', onPointerUp)
      instance.canvas.addEventListener('wheel', onWheel, { passive: false })

      detachListeners = () => {
        instance.canvas.removeEventListener('pointerdown', onPointerDown)
        instance.canvas.removeEventListener('pointermove', onPointerMove)
        instance.canvas.removeEventListener('pointerup', onPointerUp)
        instance.canvas.removeEventListener('pointercancel', onPointerUp)
        instance.canvas.removeEventListener('wheel', onWheel)
      }

      instance.ticker.add((ticker) => {
        if (!snap.active) return
        snap.elapsed += ticker.deltaMS
        const t = Math.min(1, snap.elapsed / snap.duration)
        const k = dramaticSnapT(t, snap.overshoot)
        world.x = snap.fromX + (snap.toX - snap.fromX) * k
        world.y = snap.fromY + (snap.toY - snap.fromY) * k
        if (t >= 1) {
          world.x = snap.toX
          world.y = snap.toY
          snap.active = false
        }
      })

      const onResize = () => {
        placeNodes()
        if (focused) {
          const z = world.scale.x
          world.x = instance.screen.width / 2 - focused.worldX * z
          world.y = instance.screen.height / 2 - focused.worldY * z
        }
      }
      instance.renderer.on('resize', onResize)

      // Initial focus on first gadget
      if (nodes[0]) setFocus(nodes[0])
    }

    void boot()

    return () => {
      destroyed = true
      detachListeners?.()
      if (app) {
        app.destroy(true, { children: true })
        app = null
      }
      host.replaceChildren()
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
