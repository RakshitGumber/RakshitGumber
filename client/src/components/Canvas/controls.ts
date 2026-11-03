import { Application, Container, Texture, TilingSprite } from 'pixi.js'

export type WorldPoint = { x: number; y: number }

const FOCUS_RADIUS = 0.28
const SNAP_MS = 780
const ZOOM_MIN = 0.28
const ZOOM_MAX = 1.2
const FOCUS_ZOOM = 1.06
const WHEEL_STEP = 0.0014
const EDGE = 0.08

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

export const createPanZoomCanvas = async (
  host: HTMLElement,
  opts: {
    getPoints: () => WorldPoint[]
    onSnap?: (index: number) => void
    onClear?: () => void
    onPointer?: (sx: number, sy: number, dragging: boolean) => void
  },
) => {
  const app = new Application()
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
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

  const cell = 120
  const dotCanvas = document.createElement('canvas')
  dotCanvas.width = cell
  dotCanvas.height = cell
  const ctx = dotCanvas.getContext('2d')!
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.arc(3.5, 3.5, 3.2, 0, Math.PI * 2)
  ctx.fill()

  const dots = new TilingSprite({
    texture: Texture.from(dotCanvas),
    width: 1,
    height: 1,
  })
  world.addChild(dots)

  const contentBounds = () => {
    const points = opts.getPoints()
    if (points.length === 0) return null
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const p of points) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    return { minX, maxX, minY, maxY }
  }

  const clampAxis = (pos: number, minC: number, maxC: number, view: number, z: number) => {
    const inset = view * EDGE
    const lo = inset - maxC * z
    const hi = view - inset - minC * z
    return lo <= hi ? Math.min(hi, Math.max(lo, pos)) : (lo + hi) / 2
  }

  const paintGrid = () => {
    const b = contentBounds()
    const pad = Math.max(app.screen.width, app.screen.height)
    if (!b) {
      const extent = pad * 2
      dots.width = extent * 2
      dots.height = extent * 2
      dots.position.set(-extent, -extent)
      return
    }
    const half = Math.min(app.screen.width, app.screen.height) * 0.21
    dots.width = b.maxX - b.minX + half * 2 + pad * 2
    dots.height = b.maxY - b.minY + half * 2 + pad * 2
    dots.position.set(b.minX - half - pad, b.minY - half - pad)
  }

  const clampWorld = () => {
    paintGrid()
    const b = contentBounds()
    if (!b) return
    const z = world.scale.x
    world.x = clampAxis(world.x, b.minX, b.maxX, app.screen.width, z)
    world.y = clampAxis(world.y, b.minY, b.maxY, app.screen.height, z)
  }

  paintGrid()
  app.renderer.on('resize', clampWorld)

  const snap = {
    active: false,
    index: -1,
    point: { x: 0, y: 0 },
    fromX: 0,
    fromY: 0,
    fromZ: 1,
    toZ: FOCUS_ZOOM,
    elapsed: 0,
  }

  const nearestInFocus = (points: WorldPoint[]) => {
    const cx = app.screen.width / 2
    const cy = app.screen.height / 2
    const r = Math.min(app.screen.width, app.screen.height) * FOCUS_RADIUS
    let best = -1
    let bestDist = Infinity
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const d = Math.hypot(world.x + p.x * world.scale.x - cx, world.y + p.y * world.scale.y - cy)
      if (d < r && d < bestDist) {
        best = i
        bestDist = d
      }
    }
    return best
  }

  const snapTo = (point: WorldPoint, zoom = FOCUS_ZOOM, index = -1) => {
    snap.active = true
    snap.index = index
    snap.point = point
    snap.fromX = world.x
    snap.fromY = world.y
    snap.fromZ = world.scale.x
    snap.toZ = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
    snap.elapsed = 0
  }

  const cancelSnap = () => {
    snap.active = false
    snap.index = -1
  }

  const setZoomAt = (next: number, ax: number, ay: number) => {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next))
    if (z === world.scale.x) return
    const wx = (ax - world.x) / world.scale.x
    const wy = (ay - world.y) / world.scale.y
    world.scale.set(z)
    world.x = ax - wx * z
    world.y = ay - wy * z
    cancelSnap()
    opts.onClear?.()
    clampWorld()
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

    cancelSnap()
    dragging = true
    pointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    app.canvas.style.cursor = 'grabbing'
  }

  const emitPointer = (e: PointerEvent) => {
    const rect = app.canvas.getBoundingClientRect()
    opts.onPointer?.(e.clientX - rect.left, e.clientY - rect.top, dragging)
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

    emitPointer(e)

    if (!dragging || e.pointerId !== pointerId) return
    world.x += e.clientX - lastX
    world.y += e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    clampWorld()

    if (nearestInFocus(opts.getPoints()) < 0) opts.onClear?.()
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
    if (i >= 0) snapTo(points[i], FOCUS_ZOOM, i)
    else opts.onClear?.()
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
    world.x = snap.fromX + (app.screen.width / 2 - snap.point.x * z - snap.fromX) * k
    world.y = snap.fromY + (app.screen.height / 2 - snap.point.y * z - snap.fromY) * k
    clampWorld()
    if (t >= 1) {
      const i = snap.index
      snap.active = false
      snap.index = -1
      if (i >= 0) opts.onSnap?.(i)
    }
  })

  return {
    app,
    world,
    snapTo,
    clampWorld,
    destroy() {
      app.renderer.off('resize', clampWorld)
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
