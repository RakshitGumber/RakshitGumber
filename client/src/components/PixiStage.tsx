import { useEffect, useRef } from 'react'
import { Application, Container, Sprite, Texture } from 'pixi.js'

const PETAL_COUNT = 18
const OVERLAY_COUNT = 6
const EDGE_MARGIN = 48
const FADE_IN = 0.45
const FADE_OUT = 0.35
const GLOW_CHANCE = 0.12

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

  if (glow) {
    const bloom = ctx.createRadialGradient(0, 0, h * 0.08, 0, 0, h * 0.48)
    bloom.addColorStop(0, `rgba(255,245,250,0.35)`)
    bloom.addColorStop(0.45, `rgba(${r},${g},${b},0.18)`)
    bloom.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = bloom
    ctx.beginPath()
    ctx.ellipse(0, 0, w * 0.48, h * 0.48, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const path = sakuraPath(w * 0.92, h * 0.92, variant)
  const body = ctx.createLinearGradient(0, -h * 0.42, 0, h * 0.46)
  body.addColorStop(0, `rgba(${Math.min(255, r + 35)},${Math.min(255, g + 40)},${Math.min(255, b + 35)},0.95)`)
  body.addColorStop(0.35, `rgba(${r},${g},${b},0.9)`)
  body.addColorStop(0.75, `rgba(${Math.max(0, r - 25)},${Math.max(0, g - 40)},${Math.max(0, b - 20)},0.82)`)
  body.addColorStop(1, `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 55)},${Math.max(0, b - 30)},0.7)`)
  ctx.fillStyle = body
  ctx.fill(path)

  ctx.save()
  ctx.clip(path)
  const hi = ctx.createRadialGradient(0, -h * 0.12, 0, 0, -h * 0.05, w * 0.32)
  hi.addColorStop(0, 'rgba(255,255,255,0.4)')
  hi.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hi
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.strokeStyle = `rgba(255,255,255,${glow ? 0.35 : 0.18})`
  ctx.lineWidth = Math.max(1, w * 0.02)
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.2)
  ctx.quadraticCurveTo(w * 0.01, h * 0.05, 0, h * 0.32)
  ctx.stroke()
  ctx.restore()
  ctx.restore()
}

const buildPetalTextures = (): Texture[] => {
  const textures: Texture[] = []
  for (let variant = 0; variant < 4; variant++) {
    for (const glow of [false, true]) {
      const canvas = document.createElement('canvas')
      canvas.width = 112
      canvas.height = 168
      drawPetalVariant(canvas.getContext('2d')!, 112, 168, variant, 0xf4b6d2, glow)
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

    let destroyed = false
    let app: Application | null = null
    let textures: Texture[] = []
    let petals: Petal[] = []
    let rafId = 0
    let lastTs = 0
    let visible = document.visibilityState === 'visible'

    // Strong downward wind from the top; light wind from the right for drift.
    let windX = -35
    let windY = 210
    let windXTarget = -35
    let windYTarget = 210
    let gustUntil = 0
    let windNoiseT = 0

    const layers = overlay
      ? null
      : {
          bg: new Container(),
          mid: new Container(),
          fg: new Container(),
        }

    const resize = () => {
      if (!app) return
      app.renderer.resize(window.innerWidth, window.innerHeight)
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
          windXTarget = rand(-80, -20)
          windYTarget = rand(200, 320) // top-down gust
        } else {
          windXTarget = -35 + turmoil * 0.25
          windYTarget = 210 + turmoil * 0.45
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
      if (layers) {
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
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (app) {
        app.destroy(true)
        app = null
      }
      textures.forEach((t) => t.destroy(true))
      host.replaceChildren()
    }
  }, [count, overlay])

  return (
    <div ref={hostRef} className={`pointer-events-none absolute inset-0 ${zClass}`} aria-hidden />
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
