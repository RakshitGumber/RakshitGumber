import { Application, Container, Graphics, Rectangle, Texture, TilingSprite } from 'pixi.js'
import { createCrtFilter } from './crtFilter'

export type WorldPoint = { x: number; y: number }

const FOCUS_RADIUS = 0.32
const SNAP_MS = 720
const ZOOM_MIN = 0.28
const ZOOM_MAX = 1.2
const FOCUS_ZOOM = 1.06
const DRAG_ZOOM = 0.7
const WHEEL_STEP = 0.0014
const EDGE = 0.08
const RUBBER = 0.55
const FLING_FRICTION = 0.0028
const FLING_MIN = 0.04
const BOUNCE_STIFF = 0.0042
const BOUNCE_DAMP = 0.14
const PRESS_IN_MS = 160
const PRESS_OUT_MS = 280
const HOP_DIP = 0.22

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

/** ntch-style exp ease — snappy start, soft settle (shape ≈ 11). */
function easeOutFlight(t: number, shape = 11) {
  const s = t * shape
  return (1 - (1 + s) * Math.exp(-s)) / (1 - (1 + shape) * Math.exp(-shape))
}

function easeOutBack(t: number, s = 1.05) {
  return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2
}

function softRubber(v: number, lo: number, hi: number, limit: number) {
  const resist = (over: number) => limit * (1 - 1 / (over * RUBBER / limit + 1))
  if (v < lo) return lo - resist(lo - v)
  if (v > hi) return hi + resist(v - hi)
  return v
}

function approach(dt: number, ms: number) {
  return 1 - Math.exp(-dt / Math.max(1, ms))
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

  const glass = new Container()
  const screen = new Graphics()
  const world = new Container()
  const ui = new Container()
  glass.addChild(screen, world, ui)
  app.stage.addChild(glass)
  world.position.set(app.screen.width / 2, app.screen.height / 2)

  let screenColor = 0x0b0b0b
  const paintScreen = () => {
    screen.clear()
    screen.rect(0, 0, app.screen.width, app.screen.height)
    screen.fill({ color: screenColor })
  }
  paintScreen()

  const crt = createCrtFilter()
  crt.filter.resolution = app.renderer.resolution
  glass.filters = [crt.filter]
  glass.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height)

  const syncGlass = () => {
    crt.filter.resolution = app.renderer.resolution
    glass.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height)
    paintScreen()
  }

  const setScreenColor = (hex: string) => {
    screenColor = Number.parseInt(hex.slice(1), 16)
    paintScreen()
  }

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

  const axisLimits = (minC: number, maxC: number, view: number, z: number) => {
    const inset = view * EDGE
    return {
      lo: inset - maxC * z,
      hi: view - inset - minC * z,
    }
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

  const hardClamp = () => {
    paintGrid()
    const b = contentBounds()
    if (!b) return
    const z = world.scale.x
    const xLim = axisLimits(b.minX, b.maxX, app.screen.width, z)
    const yLim = axisLimits(b.minY, b.maxY, app.screen.height, z)
    world.x = xLim.lo <= xLim.hi ? clamp(world.x, xLim.lo, xLim.hi) : (xLim.lo + xLim.hi) / 2
    world.y = yLim.lo <= yLim.hi ? clamp(world.y, yLim.lo, yLim.hi) : (yLim.lo + yLim.hi) / 2
  }

  const softClamp = () => {
    paintGrid()
    const b = contentBounds()
    if (!b) return
    const z = world.scale.x
    const xLim = axisLimits(b.minX, b.maxX, app.screen.width, z)
    const yLim = axisLimits(b.minY, b.maxY, app.screen.height, z)
    const limitX = app.screen.width * 0.35
    const limitY = app.screen.height * 0.35
    if (xLim.lo <= xLim.hi) world.x = softRubber(world.x, xLim.lo, xLim.hi, limitX)
    else world.x = (xLim.lo + xLim.hi) / 2
    if (yLim.lo <= yLim.hi) world.y = softRubber(world.y, yLim.lo, yLim.hi, limitY)
    else world.y = (yLim.lo + yLim.hi) / 2
  }

  const outOfBounds = () => {
    const b = contentBounds()
    if (!b) return false
    const z = world.scale.x
    const xLim = axisLimits(b.minX, b.maxX, app.screen.width, z)
    const yLim = axisLimits(b.minY, b.maxY, app.screen.height, z)
    const ox = xLim.lo <= xLim.hi ? world.x < xLim.lo - 0.5 || world.x > xLim.hi + 0.5 : false
    const oy = yLim.lo <= yLim.hi ? world.y < yLim.lo - 0.5 || world.y > yLim.hi + 0.5 : false
    return ox || oy
  }

  paintGrid()
  const onResize = () => {
    syncGlass()
    hardClamp()
  }
  app.renderer.on('resize', onResize)

  type Mode = 'idle' | 'drag' | 'fling' | 'bounce' | 'snap'
  let mode: Mode = 'idle'

  const snap = {
    index: -1,
    point: { x: 0, y: 0 },
    fromX: 0,
    fromY: 0,
    fromZ: 1,
    toZ: FOCUS_ZOOM,
    elapsed: 0,
    ms: SNAP_MS,
    dip: 0,
  }

  let vx = 0
  let vy = 0
  let press = 0
  let baseZoom = FOCUS_ZOOM
  let wantPress = false

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

  const applyZoomAt = (z: number, ax: number, ay: number) => {
    const next = clamp(z, ZOOM_MIN, ZOOM_MAX)
    if (Math.abs(next - world.scale.x) < 1e-6) return
    const wx = (ax - world.x) / world.scale.x
    const wy = (ay - world.y) / world.scale.y
    world.scale.set(next)
    world.x = ax - wx * next
    world.y = ay - wy * next
  }

  const setDisplayedZoom = (z: number) => {
    const cx = app.screen.width / 2
    const cy = app.screen.height / 2
    applyZoomAt(z, cx, cy)
  }

  const cancelMotion = () => {
    mode = 'idle'
    snap.index = -1
    vx = 0
    vy = 0
  }

  const snapTo = (point: WorldPoint, zoom = FOCUS_ZOOM, index = -1) => {
    const toZ = clamp(zoom, ZOOM_MIN, ZOOM_MAX)
    const dist =
      Math.hypot(
        app.screen.width / 2 - point.x * toZ - world.x,
        app.screen.height / 2 - point.y * toZ - world.y,
      ) / Math.min(app.screen.width, app.screen.height)
    const hop = clamp((dist - 0.35) / 1.1, 0, 1)
    snap.index = index
    snap.point = point
    snap.fromX = world.x
    snap.fromY = world.y
    snap.fromZ = world.scale.x
    snap.toZ = toZ
    snap.elapsed = 0
    snap.ms = SNAP_MS + hop * 220
    snap.dip = hop * HOP_DIP * Math.min(Math.log(snap.fromZ), Math.log(toZ))
    mode = 'snap'
    wantPress = false
    press = 0
    vx = 0
    vy = 0
    baseZoom = toZ
  }

  const startBounce = () => {
    mode = 'bounce'
    wantPress = false
  }

  const trySnapOrClear = () => {
    const points = opts.getPoints()
    const i = nearestInFocus(points)
    if (i >= 0) snapTo(points[i], FOCUS_ZOOM, i)
    else {
      mode = 'idle'
      opts.onClear?.()
    }
  }

  const setZoomAt = (next: number, ax: number, ay: number) => {
    cancelMotion()
    baseZoom = clamp(next, ZOOM_MIN, ZOOM_MAX)
    press = 0
    wantPress = false
    applyZoomAt(baseZoom, ax, ay)
    opts.onClear?.()
    hardClamp()
  }

  let dragging = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let pointerId: number | null = null
  const pointers = new Map<number, { x: number; y: number }>()
  let pinchDist = 0
  const samples: { dx: number; dy: number; dt: number }[] = []

  const onPointerDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    app.canvas.setPointerCapture(e.pointerId)

    if (pointers.size === 2) {
      dragging = false
      pointerId = null
      const [a, b] = [...pointers.values()]
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      app.canvas.style.cursor = 'grabbing'
      wantPress = false
      return
    }

    cancelMotion()
    dragging = true
    mode = 'drag'
    wantPress = true
    pointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    lastT = performance.now()
    samples.length = 0
    vx = 0
    vy = 0
    // Keep tracked resting zoom while a press blend is active; otherwise sync from view.
    if (press < 0.001) baseZoom = clamp(world.scale.x, ZOOM_MIN, ZOOM_MAX)
    app.canvas.style.cursor = 'grabbing'
    opts.onClear?.()
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
    const now = performance.now()
    const dt = Math.max(1, now - lastT)
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    world.x += dx
    world.y += dy
    softClamp()

    samples.push({ dx, dy, dt })
    if (samples.length > 5) samples.shift()
    lastX = e.clientX
    lastY = e.clientY
    lastT = now
  }

  const releaseVelocity = () => {
    if (samples.length === 0) return { x: 0, y: 0 }
    let sx = 0
    let sy = 0
    let st = 0
    for (const s of samples) {
      sx += s.dx
      sy += s.dy
      st += s.dt
    }
    if (st <= 0) return { x: 0, y: 0 }
    return { x: sx / st, y: sy / st }
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
        lastT = performance.now()
        dragging = mode !== 'snap'
      }
      return
    }

    if (e.pointerId !== pointerId && pointerId !== null) return
    dragging = false
    pointerId = null
    app.canvas.style.cursor = 'grab'
    if (pointers.size > 0) return

    wantPress = false
    const vel = releaseVelocity()
    samples.length = 0
    const speed = Math.hypot(vel.x, vel.y)

    if (outOfBounds()) {
      vx = vel.x
      vy = vel.y
      startBounce()
      return
    }

    if (speed > FLING_MIN) {
      vx = vel.x
      vy = vel.y
      mode = 'fling'
      return
    }

    trySnapOrClear()
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

  const tickPress = (dt: number) => {
    if (mode === 'snap') return

    const target = wantPress ? 1 : 0
    const ms = wantPress ? PRESS_IN_MS : PRESS_OUT_MS
    press += (target - press) * approach(dt, ms)
    if (Math.abs(press - target) < 0.001) press = target

    if (press < 0.001 && target === 0) {
      if (Math.abs(world.scale.x - baseZoom) > 0.001 && (mode === 'idle' || mode === 'fling' || mode === 'bounce')) {
        setDisplayedZoom(baseZoom)
        if (mode !== 'fling' && mode !== 'bounce') hardClamp()
      }
      return
    }

    const dragZ = Math.min(baseZoom, DRAG_ZOOM)
    const z = baseZoom + (dragZ - baseZoom) * press
    setDisplayedZoom(clamp(z, ZOOM_MIN, ZOOM_MAX))
    if (mode === 'drag') softClamp()
    else if (mode === 'idle') hardClamp()
  }

  const tickFling = (dt: number) => {
    world.x += vx * dt
    world.y += vy * dt
    const decay = Math.exp(-FLING_FRICTION * dt)
    vx *= decay
    vy *= decay
    softClamp()

    if (outOfBounds()) {
      startBounce()
      return
    }
    if (Math.hypot(vx, vy) < FLING_MIN * 0.35) {
      vx = 0
      vy = 0
      trySnapOrClear()
    }
  }

  const tickBounce = (dt: number) => {
    const b = contentBounds()
    if (!b) {
      mode = 'idle'
      return
    }
    const z = world.scale.x
    const xLim = axisLimits(b.minX, b.maxX, app.screen.width, z)
    const yLim = axisLimits(b.minY, b.maxY, app.screen.height, z)
    const tx = xLim.lo <= xLim.hi ? clamp(world.x, xLim.lo, xLim.hi) : (xLim.lo + xLim.hi) / 2
    const ty = yLim.lo <= yLim.hi ? clamp(world.y, yLim.lo, yLim.hi) : (yLim.lo + yLim.hi) / 2

    vx += (tx - world.x) * BOUNCE_STIFF * dt
    vy += (ty - world.y) * BOUNCE_STIFF * dt
    vx *= Math.exp(-BOUNCE_DAMP * dt)
    vy *= Math.exp(-BOUNCE_DAMP * dt)
    world.x += vx * dt
    world.y += vy * dt

    const err = Math.hypot(tx - world.x, ty - world.y)
    if (err < 0.6 && Math.hypot(vx, vy) < 0.02) {
      world.x = tx
      world.y = ty
      vx = 0
      vy = 0
      trySnapOrClear()
    }
  }

  const tickSnap = (dt: number) => {
    snap.elapsed += dt
    const t = clamp(snap.elapsed / snap.ms, 0, 1)
    const k = easeOutFlight(t)
    const kPos = easeOutBack(k)
    const logFrom = Math.log(snap.fromZ)
    const logTo = Math.log(snap.toZ)
    const ratio = snap.toZ / snap.fromZ
    const logZ = logFrom + (logTo - logFrom) * k - 4 * snap.dip * k * (1 - k)
    const z = clamp(Math.exp(logZ), ZOOM_MIN, ZOOM_MAX)
    // Progress pan with zoom so the hop feels locked to the target, not sliding under it.
    const kZoomPos =
      Math.abs(ratio - 1) < 0.001 ? k : (1 - snap.fromZ / Math.exp(logFrom + (logTo - logFrom) * k)) / (1 - 1 / ratio)
    const toX = app.screen.width / 2 - snap.point.x * snap.toZ
    const toY = app.screen.height / 2 - snap.point.y * snap.toZ
    world.scale.set(z)
    world.x = snap.fromX + (toX - snap.fromX) * (0.65 * kZoomPos + 0.35 * kPos)
    world.y = snap.fromY + (toY - snap.fromY) * (0.65 * kZoomPos + 0.35 * kPos)

    if (t >= 1) {
      const i = snap.index
      world.scale.set(snap.toZ)
      world.x = toX
      world.y = toY
      hardClamp()
      baseZoom = snap.toZ
      press = 0
      mode = 'idle'
      snap.index = -1
      if (i >= 0) opts.onSnap?.(i)
    }
  }

  app.ticker.add((ticker) => {
    crt.tick(ticker.deltaMS)
    const dt = Math.min(32, ticker.deltaMS)
    tickPress(dt)
    if (mode === 'fling') tickFling(dt)
    else if (mode === 'bounce') tickBounce(dt)
    else if (mode === 'snap') tickSnap(dt)
  })

  return {
    app,
    world,
    ui,
    snapTo,
    clampWorld: hardClamp,
    setScreenColor,
    destroy() {
      app.renderer.off('resize', onResize)
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
