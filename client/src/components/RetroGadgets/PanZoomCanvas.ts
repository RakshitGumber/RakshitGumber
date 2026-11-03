import { Application, Container, Texture, TilingSprite } from 'pixi.js'

export type WorldPoint = { x: number; y: number }

type Snap = {
  active: boolean
  point: WorldPoint
  fromX: number
  fromY: number
  fromZ: number
  toZ: number
  elapsed: number
}

const FOCUS_RADIUS = 0.28
const SNAP_MS = 780
const ZOOM_MIN = 0.28
const ZOOM_MAX = 1.2
export const FOCUS_ZOOM = 1.06
const WHEEL_STEP = 0.0014

/** Soft ease-out — free drift, no slam. */
function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

export type PanZoomCanvas = {
  app: Application
  world: Container
  snapTo: (point: WorldPoint, zoom?: number) => void
  nearestInFocus: (points: WorldPoint[]) => number
  destroy: () => void
}

export async function createPanZoomCanvas(
  host: HTMLElement,
  opts: {
    getPoints: () => WorldPoint[]
    onNear?: (index: number) => void
    onSnap?: (index: number) => void
    onClear?: () => void
  },
): Promise<PanZoomCanvas> {
  const app = new Application()
  await app.init({
    resizeTo: host,
    background: '#0B0B0B',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  })

  host.appendChild(app.canvas)
  Object.assign(app.canvas.style, {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'none',
    cursor: 'grab',
  })

  const world = new Container()
  app.stage.addChild(world)
  world.position.set(app.screen.width / 2, app.screen.height / 2)

  const cell = 28
  const dotCanvas = document.createElement('canvas')
  dotCanvas.width = cell
  dotCanvas.height = cell
  const ctx = dotCanvas.getContext('2d')!
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.arc(0.75, 0.75, 1.1, 0, Math.PI * 2)
  ctx.fill()

  const dots = new TilingSprite({
    texture: Texture.from(dotCanvas),
    width: 1,
    height: 1,
  })
  world.addChild(dots)

  const paintGrid = () => {
    const extent = Math.max(app.screen.width, app.screen.height) * 8
    dots.width = extent * 2
    dots.height = extent * 2
    dots.position.set(-extent, -extent)
  }
  paintGrid()
  app.renderer.on('resize', paintGrid)

  const snap: Snap = {
    active: false,
    point: { x: 0, y: 0 },
    fromX: 0,
    fromY: 0,
    fromZ: 1,
    toZ: FOCUS_ZOOM,
    elapsed: 0,
  }

  const screenOf = (p: WorldPoint) => ({
    x: world.x + p.x * world.scale.x,
    y: world.y + p.y * world.scale.y,
  })

  const nearestInFocus = (points: WorldPoint[]) => {
    const cx = app.screen.width / 2
    const cy = app.screen.height / 2
    const r = Math.min(app.screen.width, app.screen.height) * FOCUS_RADIUS
    let best = -1
    let bestDist = Infinity
    for (let i = 0; i < points.length; i++) {
      const s = screenOf(points[i])
      const d = Math.hypot(s.x - cx, s.y - cy)
      if (d < r && d < bestDist) {
        best = i
        bestDist = d
      }
    }
    return best
  }

  const snapTo = (point: WorldPoint, zoom = FOCUS_ZOOM) => {
    snap.active = true
    snap.point = point
    snap.fromX = world.x
    snap.fromY = world.y
    snap.fromZ = world.scale.x
    snap.toZ = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
    snap.elapsed = 0
  }

  const setZoomAt = (next: number, ax: number, ay: number) => {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next))
    if (z === world.scale.x) return
    const wx = (ax - world.x) / world.scale.x
    const wy = (ay - world.y) / world.scale.y
    world.scale.set(z)
    world.x = ax - wx * z
    world.y = ay - wy * z
    snap.active = false
  }

  let dragging = false
  let lastX = 0
  let lastY = 0
  let pointerId: number | null = null
  const pointers = new Map<number, { x: number; y: number }>()
  let pinchDist = 0

  const onPointerDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    app.canvas.setPointerCapture(e.pointerId)

    if (pointers.size === 2) {
      dragging = false
      pointerId = null
      const [a, b] = [...pointers.values()]
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      app.canvas.style.cursor = 'grabbing'
      return
    }

    snap.active = false
    dragging = true
    pointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    app.canvas.style.cursor = 'grabbing'
  }

  const onPointerMove = (e: PointerEvent) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDist > 0) {
        const rect = app.canvas.getBoundingClientRect()
        setZoomAt(
          world.scale.x * (dist / pinchDist),
          (a.x + b.x) / 2 - rect.left,
          (a.y + b.y) / 2 - rect.top,
        )
      }
      pinchDist = dist
      return
    }

    if (!dragging || e.pointerId !== pointerId) return
    world.x += e.clientX - lastX
    world.y += e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY

    const i = nearestInFocus(opts.getPoints())
    if (i >= 0) opts.onNear?.(i)
    else opts.onClear?.()
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
    app.canvas.style.cursor = 'grab'
    if (pointers.size > 0) return

    const points = opts.getPoints()
    const i = nearestInFocus(points)
    if (i >= 0) {
      snapTo(points[i])
      opts.onSnap?.(i)
    } else {
      opts.onClear?.()
    }
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const rect = app.canvas.getBoundingClientRect()
    setZoomAt(
      world.scale.x * Math.exp(-e.deltaY * WHEEL_STEP),
      e.clientX - rect.left,
      e.clientY - rect.top,
    )
  }

  app.canvas.addEventListener('pointerdown', onPointerDown)
  app.canvas.addEventListener('pointermove', onPointerMove)
  app.canvas.addEventListener('pointerup', onPointerUp)
  app.canvas.addEventListener('pointercancel', onPointerUp)
  app.canvas.addEventListener('wheel', onWheel, { passive: false })

  app.ticker.add((ticker) => {
    if (!snap.active) return
    snap.elapsed += ticker.deltaMS
    const t = Math.min(1, snap.elapsed / SNAP_MS)
    const k = easeOut(t)
    const z = snap.fromZ + (snap.toZ - snap.fromZ) * k
    world.scale.set(z)
    const toX = app.screen.width / 2 - snap.point.x * z
    const toY = app.screen.height / 2 - snap.point.y * z
    world.x = snap.fromX + (toX - snap.fromX) * k
    world.y = snap.fromY + (toY - snap.fromY) * k
    if (t >= 1) snap.active = false

  })

  return {
    app,
    world,
    snapTo,
    nearestInFocus,
    destroy() {
      app.renderer.off('resize', paintGrid)
      app.canvas.removeEventListener('pointerdown', onPointerDown)
      app.canvas.removeEventListener('pointermove', onPointerMove)
      app.canvas.removeEventListener('pointerup', onPointerUp)
      app.canvas.removeEventListener('pointercancel', onPointerUp)
      app.canvas.removeEventListener('wheel', onWheel)
      app.destroy(true, { children: true })
      host.replaceChildren()
    },

  }
}
