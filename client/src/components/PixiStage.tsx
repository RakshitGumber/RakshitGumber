import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Application, Container, PerspectiveMesh, Sprite, Texture } from 'pixi.js'

gsap.registerPlugin(ScrollTrigger)

const PETAL_COUNT = 8
const OVERLAY_COUNT = 6
const EDGE_MARGIN = 48
const FADE_IN = 0.45
const FADE_OUT = 0.35
const GLOW_CHANCE = 0.28
const PARALLAX_X = 24
const PARALLAX_Y = 16
/** Road sits farther back — drifts less than the title / petals. */
const ROAD_PARALLAX_X = 8
const ROAD_PARALLAX_Y = 5
const ROAD_TEX_W = 512
const ROAD_TEX_H = 512
const SKY_TEX_W = 640
const SKY_TEX_H = 960
/** Sky drifts least — farthest layer. */
const SKY_PARALLAX_X = 4
const SKY_PARALLAX_Y = 2.5
/** Fraction of viewport height the road occupies at rest / after scroll. */
const ROAD_HEIGHT_START = 0.4
const ROAD_HEIGHT_END = 0.35

const COLORS = [0xf4b6d2, 0xf8d4e4, 0xd98cb8, 0xc66fa5, 0xe6b8e0, 0xfff0f7] as const

type Layer = 'bg' | 'mid' | 'fg'

type Petal = {
  sprite: Sprite
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  spin: number
  flutter: number
  phase: number
  flip: number
  flipSpeed: number
  depth: number
  layer: Layer
  size: number
  aspect: number
  windInfluence: number
  baseAlpha: number
  glow: boolean
  fade: number
  exiting: boolean
  variant: number
  age: number
  turmoil: number
  turmoilPhase: number
}

const layerFromDepth = (depth: number): Layer =>
  depth < 0.34 ? 'bg' : depth < 0.72 ? 'mid' : 'fg'

const sizeForLayer = (layer: Layer) => {
  if (layer === 'bg') return 10 + Math.random() * 16
  if (layer === 'mid') return 22 + Math.random() * 24
  return 38 + Math.random() * 28
}

const hexToRgb = (hex: number) => ({
  r: (hex >> 16) & 255,
  g: (hex >> 8) & 255,
  b: hex & 255,
})

/** Hash noise in [0, 1] — asphalt grain. */
const hash2 = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

const valueNoise = (x: number, y: number) => {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = hash2(x0, y0)
  const b = hash2(x0 + 1, y0)
  const c = hash2(x0, y0 + 1)
  const d = hash2(x0 + 1, y0 + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

const fbm = (x: number, y: number) => {
  let amp = 0.5
  let freq = 1
  let sum = 0
  for (let i = 0; i < 5; i++) {
    sum += valueNoise(x * freq, y * freq) * amp
    amp *= 0.5
    freq *= 2.05
  }
  return sum
}

/** Urban night sky — zenith navy, city light-pollution wash, sparse stars. */
const buildNightSkyTexture = (): Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = SKY_TEX_W
  canvas.height = SKY_TEX_H
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas

  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#04060f')
  sky.addColorStop(0.28, '#070b1a')
  sky.addColorStop(0.55, '#0c1228')
  sky.addColorStop(0.78, '#161428')
  sky.addColorStop(0.9, '#2a1c22')
  sky.addColorStop(1, '#3d2818')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Soft city glow spilling upward from the horizon.
  const glow = ctx.createRadialGradient(w * 0.5, h * 1.05, h * 0.05, w * 0.5, h * 0.72, h * 0.55)
  glow.addColorStop(0, 'rgba(255,170,70,0.38)')
  glow.addColorStop(0.35, 'rgba(220,120,60,0.18)')
  glow.addColorStop(0.7, 'rgba(120,70,90,0.08)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Secondary street-glow pockets left / right.
  for (const [cx, strength] of [
    [0.22, 0.14],
    [0.78, 0.12],
    [0.5, 0.1],
  ] as const) {
    const pocket = ctx.createRadialGradient(w * cx, h * 0.98, 0, w * cx, h * 0.98, h * 0.35)
    pocket.addColorStop(0, `rgba(255,190,90,${strength})`)
    pocket.addColorStop(0.5, `rgba(180,90,50,${strength * 0.35})`)
    pocket.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = pocket
    ctx.fillRect(0, 0, w, h)
  }

  // Thin haze band just above the city.
  const haze = ctx.createLinearGradient(0, h * 0.62, 0, h)
  haze.addColorStop(0, 'rgba(40,50,80,0)')
  haze.addColorStop(0.45, 'rgba(90,70,80,0.12)')
  haze.addColorStop(1, 'rgba(60,40,30,0.2)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, w, h)

  // Distant skyline silhouettes along the horizon.
  ctx.fillStyle = 'rgba(4,6,12,0.72)'
  const baseY = h * 0.88
  let x = -10
  while (x < w + 20) {
    const bw = 8 + hash2(x * 0.1, 3) * 28
    const bh = 10 + hash2(x * 0.07, 9) * 55
    const top = baseY - bh
    ctx.fillRect(x, top, bw, bh + h * 0.14)
    // Occasional taller tower.
    if (hash2(x * 0.13, 1.7) > 0.82) {
      const tw = bw * 0.45
      const th = bh * (0.4 + hash2(x, 2.2) * 0.7)
      ctx.fillRect(x + bw * 0.25, top - th, tw, th)
    }
    x += bw + 2 + hash2(x, 4.4) * 10
  }

  // Specks of window light on the skyline.
  for (let i = 0; i < 90; i++) {
    const lx = hash2(i * 1.7, 11) * w
    const ly = baseY - hash2(i * 2.3, 13) * h * 0.12
    const a = 0.15 + hash2(i, 17) * 0.55
    ctx.fillStyle =
      hash2(i, 19) > 0.55
        ? `rgba(255,220,140,${a})`
        : `rgba(170,210,255,${a * 0.7})`
    ctx.fillRect(lx, ly, 1.2, 1.6)
  }

  // Stars — denser / brighter toward zenith, washed out near the city glow.
  for (let i = 0; i < 280; i++) {
    const sx = hash2(i * 3.1, 0.4) * w
    const sy = hash2(i * 5.7, 1.9) * h * 0.86
    const depth = 1 - sy / h
    if (hash2(i, 2.8) > depth * 0.95 + 0.08) continue
    const size = (0.4 + hash2(i, 7.1) * 1.6) * (0.45 + depth)
    const alpha = (0.25 + hash2(i, 8.3) * 0.7) * (0.25 + depth * 0.85)
    ctx.beginPath()
    ctx.fillStyle = `rgba(230,235,255,${alpha})`
    ctx.arc(sx, sy, size, 0, Math.PI * 2)
    ctx.fill()
    if (size > 1.3 && hash2(i, 9.5) > 0.7) {
      ctx.beginPath()
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`
      ctx.arc(sx, sy, size * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return Texture.from(canvas)
}

const layoutSky = (sprite: Sprite, w: number, h: number) => {
  sprite.width = w * 1.12
  sprite.height = h * 1.08
  sprite.position.set(-w * 0.06, -h * 0.03)
}

/** Night asphalt ground — noise, ambience, diffusion. */
const buildAsphaltTexture = (): Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = ROAD_TEX_W
  canvas.height = ROAD_TEX_H
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas
  const img = ctx.createImageData(w, h)
  const data = img.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w
      const ny = y / h
      const grain = fbm(x * 0.045, y * 0.045)
      const grit = fbm(x * 0.18, y * 0.18)
      const blotch = fbm(x * 0.012 + 20, y * 0.012 - 8)

      const edgeX = Math.min(nx, 1 - nx) * 2
      const edgeY = Math.min(ny, 1 - ny) * 2
      const ambience = 0.72 + 0.28 * Math.min(edgeX, edgeY) ** 0.65
      const diffusion =
        0.88 +
        0.12 * Math.exp(-((nx - 0.5) ** 2 + (ny - 0.55) ** 2) * 3.2) -
        0.08 * (1 - ny)

      const shade = (0.07 + grain * 0.09 + grit * 0.04 + blotch * 0.05) * ambience * diffusion
      const r = Math.min(255, Math.floor(shade * 255 * 0.92))
      const g = Math.min(255, Math.floor(shade * 255 * 0.94))
      const b = Math.min(255, Math.floor(shade * 255 * 1.02))
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const wash = ctx.createLinearGradient(0, 0, 0, h)
  wash.addColorStop(0, 'rgba(40,42,48,0.35)')
  wash.addColorStop(0.45, 'rgba(18,18,20,0.08)')
  wash.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, w, h)

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.4, h * 0.1, w * 0.5, h * 0.55, h * 0.75)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  return Texture.from(canvas)
}

const layoutRoad = (mesh: PerspectiveMesh, w: number, h: number, heightFrac = ROAD_HEIGHT_START) => {
  // Bottom band of the viewport; slight far-edge skew keeps the perspective read.
  const horizonY = h * (1 - heightFrac)
  const nearY = h + h * heightFrac * 0.08
  mesh.setCorners(
    -w * 0.18,
    horizonY,
    w * 1.18,
    horizonY - h * 0.012,
    w * 1.28,
    nearY,
    -w * 0.28,
    nearY,
  )
}

const sakuraPath = (w: number, h: number, variant: number) => {
  const path = new Path2D()
  const lean = (variant - 1.5) * 0.04
  const notch = 0.42 + variant * 0.02
  const belly = 0.3 + (variant % 2) * 0.04

  path.moveTo(lean * w, h * 0.46)
  path.bezierCurveTo(w * (belly + 0.02), h * 0.22, w * 0.36, h * 0.02, w * 0.28, -h * 0.18)
  path.bezierCurveTo(w * 0.2, -h * 0.36, w * 0.12, -h * 0.48, w * 0.02, -h * notch)
  path.quadraticCurveTo(0, -h * 0.3, -w * 0.02, -h * notch)
  path.bezierCurveTo(-w * 0.12, -h * 0.48, -w * 0.2, -h * 0.36, -w * 0.28, -h * 0.18)
  path.bezierCurveTo(-w * 0.36, h * 0.02, -w * (belly + 0.02), h * 0.22, lean * w, h * 0.46)
  return path
}

const drawPetalVariant = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  variant: number,
  color: number,
  glow: boolean,
) => {
  const { r, g, b } = hexToRgb(color)
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2)

  const path = sakuraPath(w * 0.78, h * 0.78, variant)

  if (glow) {
    // Soft bloom that follows the petal silhouette — no circular halo.
    for (const [scale, blur, alpha] of [
      [1.55, 10, 0.1],
      [1.28, 6, 0.16],
      [1.1, 3, 0.22],
    ] as const) {
      ctx.save()
      ctx.filter = `blur(${blur}px)`
      ctx.fillStyle = `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 50)},${Math.min(255, b + 45)},${alpha})`
      ctx.scale(scale, scale)
      ctx.fill(sakuraPath(w * 0.78, h * 0.78, variant))
      ctx.restore()
    }
  }

  const body = ctx.createLinearGradient(0, -h * 0.36, 0, h * 0.4)
  if (glow) {
    body.addColorStop(0, `rgba(255,248,252,0.98)`)
    body.addColorStop(0.3, `rgba(${Math.min(255, r + 50)},${Math.min(255, g + 55)},${Math.min(255, b + 50)},0.95)`)
    body.addColorStop(0.7, `rgba(${r},${g},${b},0.9)`)
    body.addColorStop(1, `rgba(${Math.max(0, r - 15)},${Math.max(0, g - 30)},${Math.max(0, b - 10)},0.75)`)
  } else {
    body.addColorStop(0, `rgba(${Math.min(255, r + 35)},${Math.min(255, g + 40)},${Math.min(255, b + 35)},0.95)`)
    body.addColorStop(0.35, `rgba(${r},${g},${b},0.9)`)
    body.addColorStop(0.75, `rgba(${Math.max(0, r - 25)},${Math.max(0, g - 40)},${Math.max(0, b - 20)},0.82)`)
    body.addColorStop(1, `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 55)},${Math.max(0, b - 30)},0.7)`)
  }
  ctx.fillStyle = body
  ctx.fill(path)

  ctx.save()
  ctx.clip(path)
  const hi = ctx.createRadialGradient(0, -h * 0.1, 0, 0, -h * 0.04, w * 0.28)
  hi.addColorStop(0, glow ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.4)')
  hi.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hi
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.strokeStyle = `rgba(255,255,255,${glow ? 0.4 : 0.18})`
  ctx.lineWidth = Math.max(1, w * 0.02)
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.18)
  ctx.quadraticCurveTo(w * 0.01, h * 0.04, 0, h * 0.28)
  ctx.stroke()
  ctx.restore()
  ctx.restore()
}

const buildPetalTextures = (): Texture[] => {
  const textures: Texture[] = []
  for (let variant = 0; variant < 4; variant++) {
    for (const glow of [false, true]) {
      const canvas = document.createElement('canvas')
      // Extra padding so soft blur isn't clipped.
      canvas.width = glow ? 160 : 112
      canvas.height = glow ? 220 : 168
      drawPetalVariant(
        canvas.getContext('2d')!,
        canvas.width,
        canvas.height,
        variant,
        0xf4b6d2,
        glow,
      )
      textures.push(Texture.from(canvas))
    }
  }
  return textures
}

const textureIndex = (variant: number, glow: boolean) => variant * 2 + (glow ? 1 : 0)
const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** Motion inherits global wind-from-right; only light personal variance. */
const seedPetalMotion = (depth: number, oversized = false) => {
  const layer = layerFromDepth(depth)
  const size = oversized ? 48 + Math.random() * 32 : sizeForLayer(layer)
  return {
    layer,
    depth,
    size,
    aspect: rand(1.55, 1.95),
    vx: 0,
    vy: 0,
    rot: rand(0, Math.PI * 2),
    spin: rand(-1.1, 1.1),
    flutter: rand(0.2, 0.7),
    phase: rand(0, Math.PI * 2),
    flip: rand(0, Math.PI * 2),
    flipSpeed: rand(0.5, 1.6) * (Math.random() < 0.5 ? -1 : 1),
    windInfluence: rand(0.75, 1.25) * (0.7 + depth * 0.4),
    baseAlpha:
      layer === 'bg' ? rand(0.45, 0.62) : layer === 'mid' ? rand(0.55, 0.8) : rand(0.65, 0.9),
    glow: Math.random() < GLOW_CHANCE,
    variant: (Math.random() * 4) | 0,
    turmoil: rand(0.6, 1.4),
    turmoilPhase: rand(0, Math.PI * 2),
  }
}

/** Across the full top edge — staggered downward as if already falling. */
const placeFromTop = (w: number, h: number, midFall = false) => ({
  x: rand(-30, w + 30),
  y: midFall ? rand(-EDGE_MARGIN, h * 0.85) : -EDGE_MARGIN - rand(0, 120),
})

type LayerOpts = {
  count: number
  overlay: boolean
  zClass: string
}

const usePetalLayer = ({ count, overlay, zClass }: LayerOpts) => {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // Overlay keeps host parallax; main stage parallax is applied per-layer in boot.
    if (!overlay) return

    const xTo = gsap.quickTo(host, 'x', { duration: 0.55, ease: 'power3.out' })
    const yTo = gsap.quickTo(host, 'y', { duration: 0.55, ease: 'power3.out' })

    const onMove = (event: MouseEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5
      const ny = event.clientY / window.innerHeight - 0.5
      xTo(-nx * 2 * PARALLAX_X)
      yTo(-ny * 2 * PARALLAX_Y)
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [overlay])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let destroyed = false
    let app: Application | null = null
    let textures: Texture[] = []
    let skyTexture: Texture | null = null
    let skyRoot: Container | null = null
    let sky: Sprite | null = null
    let roadTexture: Texture | null = null
    let roadRoot: Container | null = null
    let road: PerspectiveMesh | null = null
    let petalsRoot: Container | null = null
    let petals: Petal[] = []
    let rafId = 0
    let lastTs = 0
    let visible = document.visibilityState === 'visible'
    let removeParallax: (() => void) | null = null
    let roadScroll: gsap.core.Tween | null = null
    let roadHeightFrac = ROAD_HEIGHT_START

    // Gentler fall; light wind from the right for drift.
    let windX = -22
    let windY = 110
    let windXTarget = -22
    let windYTarget = 110
    let gustUntil = 0
    let windNoiseT = 0

    const layers = overlay
      ? null
      : {
          bg: new Container(),
          mid: new Container(),
          fg: new Container(),
        }

    const applyRoadLayout = () => {
      if (!app || !road) return
      layoutRoad(road, app.screen.width, app.screen.height, roadHeightFrac)
    }

    const applySkyLayout = () => {
      if (!app || !sky) return
      layoutSky(sky, app.screen.width, app.screen.height)
    }

    const resize = () => {
      if (!app) return
      app.renderer.resize(window.innerWidth, window.innerHeight)
      applySkyLayout()
      applyRoadLayout()
    }

    const onVisibility = () => {
      visible = document.visibilityState === 'visible'
      if (visible) {
        lastTs = 0
        rafId = requestAnimationFrame(tick)
      }
    }

    const parentFor = (layer: Layer) => {
      if (overlay || !layers) return app!.stage
      return layers[layer]
    }

    const attach = (seed: ReturnType<typeof seedPetalMotion>, x: number, y: number, fade: number) => {
      const sprite = new Sprite(textures[textureIndex(seed.variant, seed.glow)])
      sprite.anchor.set(0.5)
      sprite.tint = COLORS[(Math.random() * COLORS.length) | 0]
      sprite.blendMode = seed.glow ? 'screen' : 'normal'
      sprite.alpha = 0
      sprite.position.set(x, y)
      sprite.rotation = seed.rot
      sprite.zIndex = seed.depth * 1000
      parentFor(seed.layer).addChild(sprite)

      return {
        sprite,
        x,
        y,
        ...seed,
        baseAlpha: seed.glow ? Math.min(0.95, seed.baseAlpha + 0.1) : seed.baseAlpha,
        fade,
        exiting: false,
        age: rand(0, 6),
      } satisfies Petal
    }

    const applySeed = (p: Petal, seed: ReturnType<typeof seedPetalMotion>, x: number, y: number) => {
      p.sprite.texture = textures[textureIndex(seed.variant, seed.glow)]
      p.sprite.tint = COLORS[(Math.random() * COLORS.length) | 0]
      p.sprite.blendMode = seed.glow ? 'screen' : 'normal'
      if (!overlay && p.layer !== seed.layer) {
        p.sprite.parent?.removeChild(p.sprite)
        parentFor(seed.layer).addChild(p.sprite)
      }
      Object.assign(p, {
        ...seed,
        x,
        y,
        fade: 0,
        exiting: false,
        age: 0,
        baseAlpha: seed.glow ? Math.min(0.95, seed.baseAlpha + 0.1) : seed.baseAlpha,
      })
      p.sprite.position.set(x, y)
      p.sprite.rotation = p.rot
      p.sprite.zIndex = p.depth * 1000
      p.sprite.alpha = 0
      p.sprite.visible = true
    }

    const updateWind = (now: number, dt: number) => {
      windNoiseT += dt
      const turmoil =
        Math.sin(windNoiseT * 0.7) * 18 +
        Math.sin(windNoiseT * 1.3) * 10 +
        Math.sin(windNoiseT * 0.23) * 8

      if (now > gustUntil) {
        if (Math.random() < 0.22 * dt) {
          gustUntil = now + rand(1800, 4000)
          windXTarget = rand(-55, -12)
          windYTarget = rand(100, 160)
        } else {
          windXTarget = -22 + turmoil * 0.2
          windYTarget = 110 + turmoil * 0.3
        }
      }

      windX += (windXTarget - windX) * Math.min(1, dt * 2)
      windY += (windYTarget - windY) * Math.min(1, dt * 2)
    }

    const tick = (now: number) => {
      if (destroyed || !app || !visible) return
      if (!lastTs) lastTs = now
      const dt = Math.min(0.05, (now - lastTs) / 1000)
      lastTs = now

      const w = app.screen.width
      const h = app.screen.height
      updateWind(now, dt)

      for (const p of petals) {
        if (!p.sprite.visible && p.exiting) continue
        p.age += dt

        const tx =
          Math.sin(p.age * 2.1 * p.turmoil + p.turmoilPhase) * 28 * p.turmoil +
          Math.sin(p.age * 5.3 + p.phase) * 12 * p.turmoil
        const ty =
          Math.cos(p.age * 1.7 * p.turmoil + p.turmoilPhase) * 22 * p.turmoil +
          Math.sin(p.age * 3.9 + p.phase * 1.3) * 14 * p.turmoil

        const desiredVx = windX * p.windInfluence + tx
        const desiredVy = windY * p.windInfluence * (1.05 + p.depth * 0.35) + ty
        p.vx += (desiredVx - p.vx) * Math.min(1, dt * 3)
        p.vy += (desiredVy - p.vy) * Math.min(1, dt * 3)

        p.x += p.vx * dt
        p.y += p.vy * dt

        p.spin += Math.sin(p.age * 3.2 + p.turmoilPhase) * 0.4 * dt * p.turmoil
        p.rot += p.spin * dt
        p.flip += p.flipSpeed * dt * (1 + Math.sin(p.age * 2 + p.phase) * 0.2)
        const flipWidth = Math.max(0.16, Math.abs(Math.cos(p.flip)))
        const texW = p.sprite.texture.width || 112
        const texH = p.sprite.texture.height || 168

        p.sprite.position.set(p.x, p.y)
        p.sprite.rotation = p.rot
        p.sprite.scale.set((p.size * flipWidth) / texW, (p.size * p.aspect) / texH)

        if (p.exiting) {
          p.fade = Math.max(0, p.fade - dt / FADE_OUT)
          if (p.fade <= 0) {
            const pos = placeFromTop(w, h)
            applySeed(
              p,
              seedPetalMotion(overlay ? 0.9 + Math.random() * 0.1 : Math.random(), overlay),
              pos.x,
              pos.y,
            )
          }
        } else if (p.fade < 1) {
          p.fade = Math.min(1, p.fade + dt / FADE_IN)
        }

        if (!overlay) {
          const edgePad = 90
          const edgeFade = Math.min(
            1,
            Math.max(0.15, p.x / edgePad),
            Math.max(0.15, (w - p.x) / edgePad),
            Math.max(0.15, p.y / edgePad),
            Math.max(0.15, (h - p.y) / edgePad),
          )
          p.sprite.alpha = p.baseAlpha * p.fade * edgeFade * (p.layer === 'bg' ? 0.82 : 1)
        } else {
          p.sprite.alpha = p.baseAlpha * p.fade
        }

        const off =
          p.x < -EDGE_MARGIN - 100 ||
          p.x > w + EDGE_MARGIN + 100 ||
          p.y > h + EDGE_MARGIN + 100 ||
          p.y < -EDGE_MARGIN - 160
        if (off && !p.exiting) p.exiting = true
      }

      const visibleCount = petals.filter((p) => p.sprite.visible && !p.exiting).length
      if (visibleCount < count && Math.random() < dt * 1.2) {
        const seed = seedPetalMotion(overlay ? 0.9 + Math.random() * 0.1 : Math.random(), overlay)
        const pos = placeFromTop(w, h)
        const recycled = petals.find((p) => !p.sprite.visible)
        if (recycled) applySeed(recycled, seed, pos.x, pos.y)
        else if (petals.length < count + 4) petals.push(attach(seed, pos.x, pos.y, 0))
      }

      rafId = requestAnimationFrame(tick)
    }

    const boot = async () => {
      textures = buildPetalTextures()
      const next = new Application()
      await next.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        powerPreference: 'high-performance',
      })
      if (destroyed) {
        next.destroy(true)
        textures.forEach((t) => t.destroy(true))
        return
      }

      app = next
      app.stage.sortableChildren = true

      if (!overlay) {
        skyTexture = buildNightSkyTexture()
        skyRoot = new Container()
        skyRoot.zIndex = -1
        sky = new Sprite(skyTexture)
        skyRoot.addChild(sky)
        app.stage.addChild(skyRoot)
        applySkyLayout()

        roadTexture = buildAsphaltTexture()
        roadRoot = new Container()
        roadRoot.zIndex = 0
        road = new PerspectiveMesh({
          texture: roadTexture,
          verticesX: 24,
          verticesY: 24,
        })
        roadRoot.addChild(road)
        app.stage.addChild(roadRoot)
        applyRoadLayout()

        petalsRoot = new Container()
        petalsRoot.zIndex = 1
        petalsRoot.sortableChildren = true
        layers!.bg.zIndex = 1
        layers!.mid.zIndex = 2
        layers!.fg.zIndex = 3
        for (const c of Object.values(layers!)) c.sortableChildren = true
        petalsRoot.addChild(layers!.bg, layers!.mid, layers!.fg)
        app.stage.addChild(petalsRoot)

        const skyX = gsap.quickTo(skyRoot, 'x', { duration: 0.85, ease: 'power3.out' })
        const skyY = gsap.quickTo(skyRoot, 'y', { duration: 0.85, ease: 'power3.out' })
        const roadX = gsap.quickTo(roadRoot, 'x', { duration: 0.7, ease: 'power3.out' })
        const roadY = gsap.quickTo(roadRoot, 'y', { duration: 0.7, ease: 'power3.out' })
        const petalsX = gsap.quickTo(petalsRoot, 'x', { duration: 0.55, ease: 'power3.out' })
        const petalsY = gsap.quickTo(petalsRoot, 'y', { duration: 0.55, ease: 'power3.out' })

        const onMove = (event: MouseEvent) => {
          const nx = event.clientX / window.innerWidth - 0.5
          const ny = event.clientY / window.innerHeight - 0.5
          skyX(-nx * 2 * SKY_PARALLAX_X)
          skyY(-ny * 2 * SKY_PARALLAX_Y)
          roadX(-nx * 2 * ROAD_PARALLAX_X)
          roadY(-ny * 2 * ROAD_PARALLAX_Y)
          petalsX(-nx * 2 * PARALLAX_X)
          petalsY(-ny * 2 * PARALLAX_Y)
        }
        window.addEventListener('mousemove', onMove)
        removeParallax = () => window.removeEventListener('mousemove', onMove)

        const roadProxy = { height: ROAD_HEIGHT_START }
        const hero = host.closest('section') ?? host
        roadScroll = gsap.to(roadProxy, {
          height: ROAD_HEIGHT_END,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: '+=100%',
            scrub: 0.65,
          },
          onUpdate: () => {
            roadHeightFrac = roadProxy.height
            applyRoadLayout()
          },
        })
      } else if (layers) {
        layers.bg.zIndex = 1
        layers.mid.zIndex = 2
        layers.fg.zIndex = 3
        for (const c of Object.values(layers)) c.sortableChildren = true
        app.stage.addChild(layers.bg, layers.mid, layers.fg)
      }

      host.appendChild(app.canvas)
      app.canvas.style.display = 'block'
      app.canvas.style.width = '100%'
      app.canvas.style.height = '100%'
      app.canvas.style.pointerEvents = 'none'

      const w = app.screen.width
      const h = app.screen.height
      petals = Array.from({ length: count }, () => {
        const seed = seedPetalMotion(overlay ? 0.85 + Math.random() * 0.15 : Math.random(), overlay)
        const pos = placeFromTop(w, h, true)
        return attach(seed, pos.x, pos.y, rand(0.5, 1))
      })

      window.addEventListener('resize', resize)
      document.addEventListener('visibilitychange', onVisibility)
      rafId = requestAnimationFrame(tick)
    }

    void boot()

    return () => {
      destroyed = true
      cancelAnimationFrame(rafId)
      removeParallax?.()
      roadScroll?.scrollTrigger?.kill()
      roadScroll?.kill()
      roadScroll = null
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (app) {
        app.destroy(true)
        app = null
      }
      sky = null
      skyRoot = null
      road = null
      roadRoot = null
      petalsRoot = null
      skyTexture?.destroy(true)
      skyTexture = null
      roadTexture?.destroy(true)
      roadTexture = null
      textures.forEach((t) => t.destroy(true))
      host.replaceChildren()
    }
  }, [count, overlay])

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none absolute inset-0 will-change-transform ${zClass}`}
      aria-hidden
    />
  )
}

export const PixiStage = () =>
  usePetalLayer({
    count: PETAL_COUNT,
    overlay: false,
    zClass: 'z-[1]',
  })

export const PixiOverlay = () =>
  usePetalLayer({
    count: OVERLAY_COUNT,
    overlay: true,
    zClass: 'z-20',
  })
