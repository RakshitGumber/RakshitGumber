import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  Mesh,
  MeshGeometry,
  Sprite,
  Texture,
  TilingSprite,
} from 'pixi.js'
import {
  MOON_GLOW_CORE,
  buildAsphaltTexture,
  buildCloudTextures,
  buildGrimeTexture,
  buildHazeTexture,
  buildMoonGlowTexture,
  buildMoonTexture,
  buildPetalTextures,
  buildRadialMaskTexture,
  buildReflectionTexture,
  buildSkyTexture,
  buildSkylineTexture,
  buildStarFieldTexture,
  buildStarTexture,
  hash2,
  type Ground,
  type RoadLight,
} from '@/components/textures'

gsap.registerPlugin(ScrollTrigger)

const PETAL_COUNT = 26
const OVERLAY_COUNT = 5
const EDGE_MARGIN = 48
const FADE_IN = 0.45
const FADE_OUT = 0.35
const GLOW_CHANCE = 0.22
const PARALLAX_X = 24
const PARALLAX_Y = 16
/** Road sits farther back — drifts less than the title / petals. */
const ROAD_PARALLAX_X = 8
const ROAD_PARALLAX_Y = 5
/** Sky drifts least — farthest layer. */
const SKY_PARALLAX_X = 4
const SKY_PARALLAX_Y = 2.5
/** Fraction of viewport height the road occupies at rest / after scroll. */
const ROAD_HEIGHT_START = 0.4
const ROAD_HEIGHT_END = 0.35

/** Moon sits right of centre in the upper sky, larger than the reference. */
const MOON_NX = 0.7
const MOON_NY = 0.19
const TWINKLE_COUNT = 34

/**
 * Road is a real ground plane: camera CAM_H metres up, the bottom screen edge
 * NEAR_Z metres ahead. World X is metres right of centre, Z metres forward.
 */
const CAM_H = 1.4
const NEAR_Z = 2.6
const FAR_Z = 420
const ASPHALT_TILE = 2
const GRIME_TILE = 9
const GRID_COLS = 64
const GRID_ROWS = 72
const GROUND_HALF_X = 90
const ROAD_HALF = 10.5
const STRIPE = 0.5
const STRIPE_GAP = 0.55
const PAINT = 0xdedcd8
const PAINT_ALPHA = 0.78
const YELLOW = 0xe0a92a

const GROUND_PETALS = 320
const GROUND_PETAL_CAP = 480

/** Off-frame neon signs and the moon — mirrored as streaks on the wet road. */
const ROAD_LIGHTS: RoadLight[] = [
  { nx: MOON_NX, ny: MOON_NY, color: [190, 205, 255], power: 1.1, width: 0.032 },
  { nx: 0.03, ny: 0.42, color: [255, 60, 160], power: 1.3, width: 0.03 },
  { nx: 0.16, ny: 0.5, color: [200, 70, 255], power: 0.8, width: 0.012 },
  { nx: 0.84, ny: 0.46, color: [70, 140, 255], power: 1, width: 0.016 },
  { nx: 0.97, ny: 0.4, color: [255, 40, 100], power: 1.3, width: 0.03 },
  { nx: 0.57, ny: 0.56, color: [255, 120, 200], power: 0.6, width: 0.006 },
  { nx: 0.36, ny: 0.57, color: [120, 190, 255], power: 0.5, width: 0.005 },
]

type Star = {
  sprite: Sprite
  nx: number
  ny: number
  size: number
  baseAlpha: number
  phase: number
  speed: number
}

const COLORS = [0xffc8dc, 0xffd8e6, 0xf7b3cc, 0xffe6ee, 0xf2a6c4, 0xfff2f6] as const
const GROUND_COLORS = [0xf2c4d6, 0xe8b0c8, 0xf6dde6, 0xd896b4, 0xe9c9d2, 0xc98aa6] as const

type Layer = 'bg' | 'mid' | 'fg'

type Petal = {
  sprite: Sprite
  halo: Sprite
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

type GroundPetal = { node: Container; sprite: Sprite; X: number; Z: number; size: number }

const layerFromDepth = (depth: number): Layer =>
  depth < 0.34 ? 'bg' : depth < 0.72 ? 'mid' : 'fg'

/** Petal width in px — kept small so they read as real blossoms. */
const sizeForLayer = (layer: Layer) => {
  if (layer === 'bg') return 4 + Math.random() * 3
  if (layer === 'mid') return 7 + Math.random() * 4
  return 11 + Math.random() * 4
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/* ------------------------------------------------------------ ground */

const groundFor = (w: number, h: number, heightFrac: number): Ground => {
  const yH = h * (1 - heightFrac)
  return { cx: w * 0.5, yH, f: ((h - yH) * NEAR_Z) / CAM_H, camH: CAM_H }
}

const toScreen = (g: Ground, X: number, Z: number) => {
  const z = Math.max(1.6, Z)
  return [g.cx + (g.f * X) / z, g.yH + (g.f * CAM_H) / z]
}

/** Grid rows are spaced evenly in screen space so texturing stays perspective-true. */
const gridZ = (j: number) => {
  const t = j / GRID_ROWS
  return 1 / (1 / FAR_Z + (1 / (NEAR_Z * 0.8) - 1 / FAR_Z) * t)
}

const gridX = (i: number) => -GROUND_HALF_X + (2 * GROUND_HALF_X * i) / GRID_COLS

const buildGroundGeometry = (tile: number) => {
  const n = (GRID_COLS + 1) * (GRID_ROWS + 1)
  const positions = new Float32Array(n * 2)
  const uvs = new Float32Array(n * 2)
  const indices = new Uint32Array(GRID_COLS * GRID_ROWS * 6)
  for (let j = 0; j <= GRID_ROWS; j++) {
    for (let i = 0; i <= GRID_COLS; i++) {
      const k = (j * (GRID_COLS + 1) + i) * 2
      uvs[k] = gridX(i) / tile
      uvs[k + 1] = gridZ(j) / tile
    }
  }
  let q = 0
  for (let j = 0; j < GRID_ROWS; j++) {
    for (let i = 0; i < GRID_COLS; i++) {
      const a = j * (GRID_COLS + 1) + i
      const b = a + 1
      const c = a + GRID_COLS + 1
      const d = c + 1
      indices.set([a, b, c, b, d, c], q)
      q += 6
    }
  }
  const geometry = new MeshGeometry({ positions, uvs, indices })
  geometry.batchMode = 'no-batch'
  return geometry
}

const layoutGroundGeometry = (geometry: MeshGeometry, g: Ground) => {
  const pos = geometry.positions
  for (let j = 0; j <= GRID_ROWS; j++) {
    const Z = gridZ(j)
    const y = g.yH + (g.f * CAM_H) / Z
    for (let i = 0; i <= GRID_COLS; i++) {
      const k = (j * (GRID_COLS + 1) + i) * 2
      pos[k] = g.cx + (g.f * gridX(i)) / Z
      pos[k + 1] = y
    }
  }
  geometry.getBuffer('aPosition').update()
}

/* ---------------------------------------------------------- markings */

type Pt = [number, number]

const fillPoly = (gfx: Graphics, g: Ground, pts: Pt[], color: number, alpha: number) =>
  gfx.poly(pts.flatMap(([X, Z]) => toScreen(g, X, Z))).fill({ color, alpha })

const rect = (
  gfx: Graphics,
  g: Ground,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  color = PAINT,
  alpha = PAINT_ALPHA,
) =>
  fillPoly(
    gfx,
    g,
    [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ],
    color,
    alpha,
  )

/** Zebra crossing along the segment a→b; stripes are `width` long across it. */
const crosswalk = (gfx: Graphics, g: Ground, a: Pt, b: Pt, width: number) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const dx = (b[0] - a[0]) / len
  const dz = (b[1] - a[1]) / len
  const nx = -dz * (width / 2)
  const nz = dx * (width / 2)
  const pitch = STRIPE + STRIPE_GAP
  const n = Math.floor((len + STRIPE_GAP) / pitch)
  const start = (len - (n * pitch - STRIPE_GAP)) / 2
  for (let k = 0; k < n; k++) {
    const s0 = start + k * pitch
    const s1 = s0 + STRIPE
    const p0: Pt = [a[0] + dx * s0, a[1] + dz * s0]
    const p1: Pt = [a[0] + dx * s1, a[1] + dz * s1]
    fillPoly(
      gfx,
      g,
      [
        [p0[0] - nx, p0[1] - nz],
        [p1[0] - nx, p1[1] - nz],
        [p1[0] + nx, p1[1] + nz],
        [p0[0] + nx, p0[1] + nz],
      ],
      PAINT,
      PAINT_ALPHA,
    )
  }
}

/** Lane line from z0 to z1; dashed when `dash` is given as [on, off] metres. */
const laneLine = (
  gfx: Graphics,
  g: Ground,
  x: number,
  z0: number,
  z1: number,
  dash?: [number, number],
  color = PAINT,
  width = 0.15,
) => {
  if (!dash) return rect(gfx, g, x - width / 2, z0, x + width / 2, z1, color)
  for (let z = z0; z < z1; z += dash[0] + dash[1]) {
    rect(gfx, g, x - width / 2, z, x + width / 2, Math.min(z1, z + dash[0]), color)
  }
}

const manhole = (gfx: Graphics, g: Ground, X: number, Z: number) => {
  const ring = (r: number) =>
    Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2
      return toScreen(g, X + Math.cos(a) * r, Z + Math.sin(a) * r)
    }).flat()
  const px = (g.f * 0.03) / Z
  gfx.poly(ring(0.34)).fill({ color: 0x0a0a10, alpha: 0.9 }).stroke({ width: px * 1.5, color: 0x4a4954, alpha: 0.8 })
  gfx.poly(ring(0.24)).stroke({ width: px, color: 0x34333d, alpha: 0.85 })
  for (const off of [-0.16, -0.08, 0, 0.08, 0.16]) {
    const half = Math.sqrt(0.24 ** 2 - off ** 2)
    const [ax, ay] = toScreen(g, X - half, Z + off)
    const [bx, by] = toScreen(g, X + half, Z + off)
    gfx.moveTo(ax, ay).lineTo(bx, by).stroke({ width: px * 0.8, color: 0x2a2933, alpha: 0.85 })
  }
}

/** Shibuya-style scramble intersection: zebras, diagonals, stop lines, lanes. */
const drawMarkings = (gfx: Graphics, g: Ground) => {
  gfx.clear()

  // Sidewalk corners and curbs flanking the main road.
  for (const s of [-1, 1]) {
    for (const [z0, z1] of [
      [0, 10],
      [28, FAR_Z],
    ] as const) {
      rect(gfx, g, s * 11, z0, s * 80, z1, 0x24232c, 0.85)
      rect(gfx, g, s * 10.8, z0, s * 11.05, z1, 0x5c5b68, 0.9)
    }
  }

  // Main crossings, side crossings over the cross street, and the scramble X.
  crosswalk(gfx, g, [-ROAD_HALF, 7.5], [ROAD_HALF, 7.5], 4)
  crosswalk(gfx, g, [-ROAD_HALF, 30.5], [ROAD_HALF, 30.5], 4)
  for (const s of [-1, 1]) crosswalk(gfx, g, [s * 13.5, 11], [s * 13.5, 27], 4)
  crosswalk(gfx, g, [-8.5, 12], [8.5, 26], 3.6)
  crosswalk(gfx, g, [8.5, 12], [-8.5, 26], 3.6)

  // Stop lines: ours (left-hand traffic) near, oncoming far.
  rect(gfx, g, -ROAD_HALF + 0.2, 4.6, -0.3, 5.05)
  rect(gfx, g, 0.3, 32.95, ROAD_HALF - 0.2, 33.4)

  // Approach lanes: double yellow centre, edge lines, lane dividers.
  for (const [z0, z1] of [
    [0, 4.6],
    [33.4, FAR_Z],
  ] as const) {
    for (const s of [-1, 1]) {
      laneLine(gfx, g, s * 0.17, z0, z1, undefined, YELLOW, 0.13)
      laneLine(gfx, g, s * 10.25, z0, z1)
      for (const lane of [3.5, 7]) {
        if (z0 > 30) {
          laneLine(gfx, g, s * lane, z0, z0 + 24)
          laneLine(gfx, g, s * lane, z0 + 30, z1, [5, 7])
        } else {
          laneLine(gfx, g, s * lane, z0, z1)
        }
      }
    }
  }

  // Cross street: centre line and lane dashes running off to the sides.
  for (const s of [-1, 1]) {
    const x0 = s * 15.6
    const x1 = s * 120
    for (const z of [18.83, 19.17]) {
      fillPoly(
        gfx,
        g,
        [
          [x0, z - 0.065],
          [x1, z - 0.065],
          [x1, z + 0.065],
          [x0, z + 0.065],
        ],
        YELLOW,
        0.8,
      )
    }
    for (const z of [14.5, 23.5]) {
      for (let x = 16.5; x < 120; x += 9) rect(gfx, g, s * x, z - 0.075, s * (x + 4), z + 0.075)
    }
  }

  // Crosswalk-ahead diamonds in the far lanes.
  for (const X of [-8.75, -5.25, -1.75, 1.75, 5.25, 8.75]) {
    for (const Z of [52, 70]) {
      const pts = [
        toScreen(g, X, Z - 1.5),
        toScreen(g, X + 0.6, Z),
        toScreen(g, X, Z + 1.5),
        toScreen(g, X - 0.6, Z),
      ].flat()
      gfx.poly(pts).stroke({ width: Math.max(0.8, (g.f * 0.15) / Z), color: PAINT, alpha: PAINT_ALPHA })
    }
  }

  manhole(gfx, g, 1.6, 3.4)
  manhole(gfx, g, -2.2, 14)
  manhole(gfx, g, 5.8, 22)
  manhole(gfx, g, -6.4, 44)
}

/* ------------------------------------------------------- ground petals */

const placeGroundPetal = (p: GroundPetal, g: Ground) => {
  const [x, y] = toScreen(g, p.X, p.Z)
  p.node.position.set(x, y)
  p.node.scale.set(1, Math.min(1, CAM_H / p.Z))
  p.sprite.scale.set((g.f * p.size) / p.Z / (p.sprite.texture.width || 72))
}

/** Drifts piled along curbs and crossings, plus a loose scatter. */
const seedGroundPetalSpots = () => {
  const spots: Pt[] = []
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
  const clusters: [number, number, number, number, number][] = [
    // X, Z, spreadX, spreadZ, count
    [-10.4, 6, 0.35, 5, 50],
    [10.4, 5, 0.35, 5, 45],
    [-4.2, 3.5, 1.8, 0.45, 40],
    [3.6, 4.4, 2.2, 0.8, 34],
    [-7, 9.6, 2.5, 0.3, 24],
    [6.5, 5.6, 1.6, 0.3, 22],
  ]
  for (const [cx, cz, sx, sz, n] of clusters) {
    for (let i = 0; i < n; i++) spots.push([cx + gauss() * sx, Math.max(NEAR_Z + 0.1, cz + gauss() * sz)])
  }
  while (spots.length < GROUND_PETALS) {
    spots.push([rand(-12, 12), NEAR_Z + 0.1 + Math.pow(Math.random(), 2.2) * 32])
  }
  return spots
}

/* --------------------------------------------------------------- petals */

const seedPetalMotion = (depth: number, oversized = false) => {
  const layer = layerFromDepth(depth)
  const size = oversized ? 16 + Math.random() * 8 : sizeForLayer(layer)
  return {
    layer,
    depth,
    size,
    aspect: rand(1.4, 1.65),
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
      layer === 'bg' ? rand(0.55, 0.7) : layer === 'mid' ? rand(0.7, 0.88) : rand(0.85, 0.97),
    glow: Math.random() < GLOW_CHANCE,
    variant: (Math.random() * 4) | 0,
    turmoil: rand(0.6, 1.4),
    turmoilPhase: rand(0, Math.PI * 2),
  }
}

/** Depth decides where a petal touches down: near petals land near the camera. */
const landingZ = (depth: number) => NEAR_Z + 0.4 + Math.pow(1 - depth, 1.6) * 38

/** Across the full top edge — staggered downward as if already falling. */
const placeFromTop = (w: number, maxY: number, midFall = false) => ({
  x: rand(-30, w + 30),
  y: midFall ? rand(-EDGE_MARGIN, maxY) : -EDGE_MARGIN - rand(0, 120),
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
    const owned: Texture[] = []
    let petalTextures: Texture[] = []
    let skyRoot: Container | null = null
    let sky: Sprite | null = null
    let starField: Sprite | null = null
    let moon: Sprite | null = null
    let moonGlow: Sprite | null = null
    let moonMasks: Sprite[] = []
    let clouds: { sprite: TilingSprite; tile: number; top: number; height: number; speed: number }[] = []
    let stars: Star[] = []
    let roadRoot: Container | null = null
    let asphaltGeo: MeshGeometry | null = null
    let grimeGeo: MeshGeometry | null = null
    let markings: Graphics | null = null
    let skyline: Sprite | null = null
    let haze: Sprite | null = null
    let reflection: Sprite | null = null
    let reflectionTimer = 0
    let groundPetalLayer: Container | null = null
    let groundPetals: GroundPetal[] = []
    let ground: Ground | null = null
    let glowLayer: Container | null = null
    let petals: Petal[] = []
    let rafId = 0
    let lastTs = 0
    let skyAge = 0
    let visible = document.visibilityState === 'visible'
    let removeParallax: (() => void) | null = null
    let roadScroll: gsap.core.Tween | null = null
    let roadHeightFrac = ROAD_HEIGHT_START

    // Gentler fall; light wind from the right for drift.
    let windX = -22
    let windY = 90
    let windXTarget = -22
    let windYTarget = 90
    let gustUntil = 0
    let windNoiseT = 0

    const layers = overlay
      ? null
      : {
          bg: new Container(),
          mid: new Container(),
          fg: new Container(),
        }

    const rebuildReflection = () => {
      if (!app || !reflection || !ground) return
      const old = reflection.texture
      reflection.texture = buildReflectionTexture(app.screen.width, app.screen.height, ground, ROAD_LIGHTS)
      if (old !== Texture.EMPTY) old.destroy(true)
      applyRoadLayout()
    }

    const applyRoadLayout = () => {
      if (!app || !asphaltGeo || !grimeGeo || !markings) return
      const w = app.screen.width
      const h = app.screen.height
      const g = groundFor(w, h, roadHeightFrac)
      ground = g
      layoutGroundGeometry(asphaltGeo, g)
      layoutGroundGeometry(grimeGeo, g)
      drawMarkings(markings, g)
      for (const p of groundPetals) placeGroundPetal(p, g)
      if (skyline) {
        skyline.width = w * 1.15
        skyline.height = h * 0.1
        skyline.position.set(-w * 0.075, g.yH + 3 - skyline.height)
      }
      if (haze) {
        haze.width = w * 1.2
        haze.height = h * 0.2
        haze.position.set(-w * 0.1, g.yH - haze.height * 0.45)
      }
      if (reflection) {
        // Stretched while scrolling; regenerated on resize.
        reflection.position.set(0, g.yH)
        reflection.width = w
        reflection.height = h - g.yH
      }
    }

    const applySkyLayout = () => {
      if (!app || !sky) return
      const w = app.screen.width
      const h = app.screen.height
      sky.width = w * 1.12
      sky.height = h * 1.08
      sky.position.set(-w * 0.06, -h * 0.03)
      if (starField) {
        starField.width = w * 1.12
        starField.height = h * 0.8
        starField.position.set(-w * 0.06, -h * 0.03)
      }
      for (const star of stars) {
        const size = star.size * Math.min(w, h) * 0.008
        star.sprite.position.set(star.nx * w, star.ny * h)
        star.sprite.scale.set(size / (star.sprite.texture.width || 32))
      }
      const diameter = Math.min(w * 0.11, h * 0.2)
      if (moon) {
        moon.scale.set(diameter / (moon.texture.width || 640))
        moon.position.set(MOON_NX * w, MOON_NY * h)
      }
      if (moonGlow) {
        moonGlow.scale.set(diameter / MOON_GLOW_CORE / (moonGlow.texture.width || 768))
        moonGlow.position.set(MOON_NX * w, MOON_NY * h)
      }
      for (const mask of moonMasks) {
        mask.width = mask.height = Math.max(w, h) * 0.75
        mask.position.set(MOON_NX * w, MOON_NY * h)
      }
      for (const c of clouds) {
        const tex = c.sprite.texture
        c.sprite.position.set(-w * 0.1, h * c.top)
        c.sprite.width = w * 1.2
        c.sprite.height = h * c.height
        c.sprite.tileScale.set((w * c.tile) / tex.width, (h * c.height) / tex.height)
      }
    }

    const resize = () => {
      if (!app) return
      app.renderer.resize(window.innerWidth, window.innerHeight)
      applySkyLayout()
      applyRoadLayout()
      window.clearTimeout(reflectionTimer)
      reflectionTimer = window.setTimeout(rebuildReflection, 180)
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

    const addGroundPetal = (X: number, Z: number, rotation: number, variant: number, tint?: number) => {
      if (!groundPetalLayer || !ground) return
      if (groundPetals.length >= GROUND_PETAL_CAP) {
        const old = groundPetals.shift()!
        old.node.destroy({ children: true })
      }
      const node = new Container()
      const sprite = new Sprite(petalTextures[variant])
      sprite.anchor.set(0.5)
      sprite.rotation = rotation
      sprite.tint = tint ?? GROUND_COLORS[(Math.random() * GROUND_COLORS.length) | 0]
      sprite.alpha = rand(0.82, 0.96)
      node.addChild(sprite)
      node.zIndex = Z < 1 ? 0 : -Z
      groundPetalLayer.addChild(node)
      const p: GroundPetal = { node, sprite, X, Z, size: rand(0.07, 0.1) }
      placeGroundPetal(p, ground)
      groundPetals.push(p)
    }

    const attach = (seed: ReturnType<typeof seedPetalMotion>, x: number, y: number, fade: number) => {
      const sprite = new Sprite(petalTextures[seed.variant])
      sprite.anchor.set(0.5)
      sprite.tint = COLORS[(Math.random() * COLORS.length) | 0]
      sprite.alpha = 0
      sprite.position.set(x, y)
      sprite.rotation = seed.rot
      sprite.zIndex = seed.depth * 1000
      parentFor(seed.layer).addChild(sprite)

      const halo = new Sprite(petalTextures[seed.variant])
      halo.anchor.set(0.5)
      halo.tint = 0xff9ccc
      halo.visible = seed.glow
      glowLayer!.addChild(halo)

      return {
        sprite,
        halo,
        x,
        y,
        ...seed,
        fade,
        exiting: false,
        age: rand(0, 6),
      } satisfies Petal
    }

    const applySeed = (p: Petal, seed: ReturnType<typeof seedPetalMotion>, x: number, y: number) => {
      p.sprite.texture = petalTextures[seed.variant]
      p.halo.texture = petalTextures[seed.variant]
      p.halo.visible = seed.glow
      p.sprite.tint = COLORS[(Math.random() * COLORS.length) | 0]
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
      })
      p.sprite.position.set(x, y)
      p.sprite.rotation = p.rot
      p.sprite.zIndex = p.depth * 1000
      p.sprite.alpha = 0
      p.sprite.visible = true
    }

    const newSeed = () =>
      seedPetalMotion(overlay ? 0.9 + Math.random() * 0.1 : Math.random(), overlay)

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
          windYTarget = rand(85, 130)
        } else {
          windXTarget = -22 + turmoil * 0.2
          windYTarget = 90 + turmoil * 0.3
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

      if (!overlay) {
        skyAge += dt
        for (const star of stars) {
          // Slow asymmetric twinkle — never fully extinguishes.
          const pulse =
            0.55 +
            0.45 *
              (0.5 +
                0.5 *
                  Math.sin(skyAge * star.speed + star.phase) *
                  Math.sin(skyAge * star.speed * 0.37 + star.phase * 1.7))
          star.sprite.alpha = star.baseAlpha * pulse
        }
        if (moonGlow) moonGlow.alpha = 0.92 + 0.08 * Math.sin(skyAge * 0.25)
        for (const c of clouds) c.sprite.tilePosition.x -= c.speed * dt
      }

      for (const p of petals) {
        if (!p.sprite.visible && p.exiting) continue
        p.age += dt

        const tx =
          Math.sin(p.age * 2.1 * p.turmoil + p.turmoilPhase) * 28 * p.turmoil +
          Math.sin(p.age * 5.3 + p.phase) * 12 * p.turmoil
        const ty =
          Math.cos(p.age * 1.7 * p.turmoil + p.turmoilPhase) * 22 * p.turmoil +
          Math.sin(p.age * 3.9 + p.phase * 1.3) * 14 * p.turmoil

        // Far petals fall slower on screen, like the rest of the parallax.
        const depthSpeed = 0.45 + p.depth * 0.75
        const desiredVx = (windX * p.windInfluence + tx) * depthSpeed
        const desiredVy = (windY * p.windInfluence + ty) * depthSpeed
        p.vx += (desiredVx - p.vx) * Math.min(1, dt * 3)
        p.vy += (desiredVy - p.vy) * Math.min(1, dt * 3)

        p.x += p.vx * dt
        p.y += p.vy * dt

        p.spin += Math.sin(p.age * 3.2 + p.turmoilPhase) * 0.4 * dt * p.turmoil
        p.rot += p.spin * dt
        p.flip += p.flipSpeed * dt * (1 + Math.sin(p.age * 2 + p.phase) * 0.2)
        const flipWidth = Math.max(0.16, Math.abs(Math.cos(p.flip)))
        const texW = p.sprite.texture.width || 72
        const texH = p.sprite.texture.height || 112
        const sx = (p.size * flipWidth) / texW
        const sy = (p.size * p.aspect) / texH

        p.sprite.position.set(p.x, p.y)
        p.sprite.rotation = p.rot
        p.sprite.scale.set(sx, sy)

        if (p.exiting) {
          p.fade = Math.max(0, p.fade - dt / FADE_OUT)
          if (p.fade <= 0) {
            const pos = placeFromTop(w, h)
            applySeed(p, newSeed(), pos.x, pos.y)
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
            Math.max(0.15, (p.y + EDGE_MARGIN) / edgePad),
          )
          p.sprite.alpha = p.baseAlpha * p.fade * edgeFade
        } else {
          p.sprite.alpha = p.baseAlpha * p.fade
        }

        if (p.glow) {
          // Real bloom: a blurred, additive copy that follows the petal.
          p.halo.position.set(p.x, p.y)
          p.halo.rotation = p.rot
          p.halo.scale.set(sx * 1.25, sy * 1.25)
          p.halo.alpha = p.sprite.alpha * (0.75 + 0.25 * Math.sin(p.age * 2.3 + p.phase))
        }

        // Main stage: petals settle onto the road and stay there.
        if (!overlay && ground && !p.exiting) {
          const Z = landingZ(p.depth)
          const landY = ground.yH + (ground.f * CAM_H) / Z
          if (p.y >= landY && p.x > -20 && p.x < w + 20) {
            const X = ((p.x - ground.cx) * Z) / ground.f
            addGroundPetal(X, Z, p.rot, p.variant, p.glow ? 0xffd6ea : undefined)
            const pos = placeFromTop(w, h)
            applySeed(p, newSeed(), pos.x, pos.y)
            continue
          }
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
        const pos = placeFromTop(w, h)
        const recycled = petals.find((p) => !p.sprite.visible)
        if (recycled) applySeed(recycled, newSeed(), pos.x, pos.y)
        else if (petals.length < count + 4) petals.push(attach(newSeed(), pos.x, pos.y, 0))
      }

      rafId = requestAnimationFrame(tick)
    }

    const buildSky = () => {
      skyRoot = new Container()
      skyRoot.zIndex = -1
      skyRoot.sortableChildren = true

      const skyTex = buildSkyTexture(MOON_NX, MOON_NY)
      const starFieldTex = buildStarFieldTexture()
      const starTex = buildStarTexture()
      const moonTex = buildMoonTexture()
      const glowTex = buildMoonGlowTexture()
      const maskTex = buildRadialMaskTexture()
      const back = buildCloudTextures('back')
      const front = buildCloudTextures('front')
      owned.push(skyTex, starFieldTex, starTex, moonTex, glowTex, maskTex, back.body, back.light, front.body, front.light)

      sky = new Sprite(skyTex)
      starField = new Sprite(starFieldTex)
      starField.zIndex = 1
      skyRoot.addChild(sky, starField)

      // A few brighter twinkling stars, kept clear of the moon.
      for (let i = 0; i < TWINKLE_COUNT; i++) {
        const nx = hash2(i * 3.3, 1.1)
        const ny = Math.pow(hash2(i * 2.1, 0.6), 1.3) * 0.48
        if (Math.hypot(nx - MOON_NX, (ny - MOON_NY) * 1.3) < 0.16) continue
        const sprite = new Sprite(starTex)
        sprite.anchor.set(0.5)
        sprite.blendMode = 'add'
        sprite.zIndex = 2
        sprite.tint = hash2(i, 4.2) > 0.7 ? 0xc8d6ff : hash2(i, 4.9) > 0.85 ? 0xffe2c8 : 0xffffff
        const star: Star = {
          sprite,
          nx,
          ny,
          size: 0.6 + hash2(i, 5.5) * 1.3,
          baseAlpha: (0.35 + hash2(i, 6.8) * 0.6) * (1 - ny),
          phase: hash2(i, 7.9) * Math.PI * 2,
          speed: 0.6 + hash2(i, 8.4) * 1.6,
        }
        skyRoot.addChild(sprite)
        stars.push(star)
      }

      // Each cloud layer: dark body + additive silver lining masked around the moon.
      const addClouds = (
        tex: { body: Texture; light: Texture },
        z: number,
        spec: { tile: number; top: number; height: number; speed: number },
        lightAlpha: number,
      ) => {
        const body = new TilingSprite({ texture: tex.body })
        body.zIndex = z
        const light = new TilingSprite({ texture: tex.light })
        light.blendMode = 'add'
        light.alpha = lightAlpha
        const lightWrap = new Container()
        lightWrap.zIndex = z + 0.5
        lightWrap.addChild(light)
        const mask = new Sprite(maskTex)
        mask.anchor.set(0.5)
        lightWrap.mask = mask
        moonMasks.push(mask)
        skyRoot!.addChild(body, lightWrap, mask)
        clouds.push({ sprite: body, ...spec }, { sprite: light, ...spec })
      }

      addClouds(back, 3, { tile: 1.5, top: -0.05, height: 0.72, speed: 5 }, 0.55)

      moonGlow = new Sprite(glowTex)
      moonGlow.anchor.set(0.5)
      moonGlow.blendMode = 'add'
      moonGlow.zIndex = 5
      moon = new Sprite(moonTex)
      moon.anchor.set(0.5)
      moon.zIndex = 6
      skyRoot.addChild(moonGlow, moon)

      // Thin wisps that drift across the moon's face.
      addClouds(front, 7, { tile: 1.1, top: 0.02, height: 0.46, speed: 13 }, 0.7)

      app!.stage.addChild(skyRoot)
      applySkyLayout()
    }

    const buildRoad = () => {
      roadRoot = new Container()
      roadRoot.zIndex = 0
      roadRoot.sortableChildren = true

      const asphaltTex = buildAsphaltTexture()
      const grimeTex = buildGrimeTexture()
      const skylineTex = buildSkylineTexture()
      const hazeTex = buildHazeTexture()
      owned.push(asphaltTex, grimeTex, skylineTex, hazeTex)

      asphaltGeo = buildGroundGeometry(ASPHALT_TILE)
      grimeGeo = buildGroundGeometry(GRIME_TILE)
      const asphalt = new Mesh({ geometry: asphaltGeo, texture: asphaltTex })
      asphalt.zIndex = 0
      markings = new Graphics()
      markings.zIndex = 1
      const grime = new Mesh({ geometry: grimeGeo, texture: grimeTex })
      grime.zIndex = 2
      grime.alpha = 1
      skyline = new Sprite(skylineTex)
      skyline.zIndex = 3
      reflection = new Sprite(Texture.EMPTY)
      reflection.blendMode = 'add'
      reflection.zIndex = 4
      groundPetalLayer = new Container()
      groundPetalLayer.zIndex = 5
      groundPetalLayer.sortableChildren = true
      haze = new Sprite(hazeTex)
      haze.zIndex = 6
      roadRoot.addChild(asphalt, markings, grime, skyline, reflection, groundPetalLayer, haze)
      app!.stage.addChild(roadRoot)

      applyRoadLayout()
      rebuildReflection()

      for (const [X, Z] of seedGroundPetalSpots()) {
        addGroundPetal(X, Z, rand(0, Math.PI * 2), (Math.random() * 4) | 0)
      }
    }

    const boot = async () => {
      petalTextures = buildPetalTextures()
      owned.push(...petalTextures)
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
        owned.forEach((t) => t.destroy(true))
        return
      }

      app = next
      app.stage.sortableChildren = true

      glowLayer = new Container()
      glowLayer.zIndex = 10
      const bloom = new BlurFilter({ strength: 7, quality: 4 })
      bloom.blendMode = 'add'
      glowLayer.filters = [bloom]

      if (!overlay) {
        buildSky()
        buildRoad()

        const petalsRoot = new Container()
        petalsRoot.zIndex = 1
        petalsRoot.sortableChildren = true
        layers!.bg.zIndex = 1
        layers!.mid.zIndex = 2
        layers!.fg.zIndex = 3
        for (const c of Object.values(layers!)) c.sortableChildren = true
        petalsRoot.addChild(layers!.bg, layers!.mid, layers!.fg, glowLayer)
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
      } else {
        app.stage.addChild(glowLayer)
      }

      host.appendChild(app.canvas)
      app.canvas.style.display = 'block'
      app.canvas.style.width = '100%'
      app.canvas.style.height = '100%'
      app.canvas.style.pointerEvents = 'none'
      if (!overlay) gsap.fromTo(app.canvas, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' })

      const w = app.screen.width
      const h = app.screen.height
      petals = Array.from({ length: count }, () => {
        const seed = newSeed()
        const maxY = ground ? ground.yH + (ground.f * CAM_H) / landingZ(seed.depth) - 10 : h * 0.85
        const pos = placeFromTop(w, maxY, true)
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
      window.clearTimeout(reflectionTimer)
      removeParallax?.()
      roadScroll?.scrollTrigger?.kill()
      roadScroll?.kill()
      roadScroll = null
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      const reflectionTex = reflection?.texture
      if (app) {
        app.destroy(true, { children: true })
        app = null
      }
      if (reflectionTex && reflectionTex !== Texture.EMPTY) reflectionTex.destroy(true)
      owned.forEach((t) => t.destroy(true))
      sky = starField = moon = moonGlow = skyline = haze = reflection = null
      skyRoot = roadRoot = groundPetalLayer = glowLayer = null
      asphaltGeo = grimeGeo = null
      markings = null
      moonMasks = []
      clouds = []
      stars = []
      groundPetals = []
      petals = []
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
