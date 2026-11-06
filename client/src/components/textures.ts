import { CanvasSource, Texture } from 'pixi.js'

/**
 * Procedural canvas textures for the hero scene: night sky, stars, moon,
 * clouds, wet asphalt, road reflections and sakura petals.
 */

type RGB = [number, number, number]

export const hash2 = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

const wrap = (v: number, p: number) => ((v % p) + p) % p
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Value noise; tiles every px × py lattice cells when periods are given. */
const noise = (x: number, y: number, px = 1e9, py = 1e9) => {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const xa = wrap(x0, px)
  const xb = wrap(x0 + 1, px)
  const ya = wrap(y0, py)
  const yb = wrap(y0 + 1, py)
  const a = hash2(xa, ya)
  const b = hash2(xb, ya)
  const c = hash2(xa, yb)
  const d = hash2(xb, yb)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Normalised fBm in [0, 1]; periods double with each octave so tiling holds. */
export const fbm = (x: number, y: number, octaves = 5, px = 1e9, py = 1e9) => {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq, px * freq, py * freq) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

const toTexture = (canvas: HTMLCanvasElement, opts: { repeat?: boolean; mipmaps?: boolean } = {}) =>
  new Texture({
    source: new CanvasSource({
      resource: canvas,
      scaleMode: 'linear',
      addressMode: opts.repeat ? 'repeat' : 'clamp-to-edge',
      autoGenerateMipmaps: !!opts.mipmaps,
      maxAnisotropy: opts.mipmaps ? 16 : 1,
    }),
  })

/** Per-pixel painter; `o` is [r, g, b, a] in 0–255, reused between pixels. */
const shade = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fn: (x: number, y: number, o: number[]) => void,
) => {
  const img = ctx.createImageData(w, h)
  const data = img.data
  const o = [0, 0, 0, 255]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      o[0] = o[1] = o[2] = 0
      o[3] = 255
      fn(x, y, o)
      const i = (y * w + x) * 4
      data[i] = o[0]
      data[i + 1] = o[1]
      data[i + 2] = o[2]
      data[i + 3] = o[3]
    }
  }
  ctx.putImageData(img, 0, 0)
}

/* ------------------------------------------------------------------ sky */

const SKY_STOPS: [number, RGB][] = [
  [0, [3, 4, 10]],
  [0.3, [7, 8, 19]],
  [0.48, [14, 12, 30]],
  [0.58, [30, 18, 44]],
  [0.66, [62, 28, 70]],
  [0.74, [44, 20, 52]],
  [1, [18, 9, 24]],
]

/** Sky colour at a normalised screen height — also used for road reflections. */
export const skyColorAt = (t: number): RGB => {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const [t1, c1] = SKY_STOPS[i]
    if (t <= t1) {
      const [t0, c0] = SKY_STOPS[i - 1]
      const k = smoothstep(0, 1, (t - t0) / (t1 - t0))
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)]
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1][1]
}

/** Night gradient with neon light pollution pooling at the horizon. */
export const buildSkyTexture = (moonNx: number, moonNy: number) => {
  const w = 384
  const h = 768
  const { canvas, ctx } = makeCanvas(w, h)
  shade(ctx, w, h, (x, y, o) => {
    const nx = x / w
    const ny = y / h
    const [r, g, b] = skyColorAt(ny)
    // Neon pools left (magenta) and right (blue-violet) along the horizon.
    const pinkL = Math.exp(-(((nx - 0.12) / 0.28) ** 2) - (((ny - 0.66) / 0.12) ** 2)) * 0.9
    const blueR = Math.exp(-(((nx - 0.88) / 0.25) ** 2) - (((ny - 0.64) / 0.11) ** 2)) * 0.8
    // Moonlit atmosphere.
    const md = Math.hypot((nx - moonNx) * 1.4, ny - moonNy)
    const moon = Math.exp(-md * 5.5) * 0.9
    const dither = (hash2(x, y) - 0.5) * 2
    o[0] = r + pinkL * 38 + blueR * 14 + moon * 16 + dither
    o[1] = g + pinkL * 8 + blueR * 14 + moon * 20 + dither
    o[2] = b + pinkL * 30 + blueR * 42 + moon * 30 + dither
  })
  return toTexture(canvas)
}

/** Dense faint star field — clouds drawn above decide which ones show. */
export const buildStarFieldTexture = () => {
  const w = 2048
  const h = 1024
  const { canvas, ctx } = makeCanvas(w, h)
  for (let i = 0; i < 1100; i++) {
    const x = hash2(i * 1.37, 2.1) * w
    const ny = hash2(i * 0.91, 7.3)
    // Atmospheric extinction toward the horizon.
    const ext = 1 - smoothstep(0.42, 0.62, ny)
    if (ext <= 0) continue
    const mag = Math.pow(hash2(i, 3.9), 3.2)
    const a = (0.08 + mag * 0.7) * ext
    const temp = hash2(i, 9.4)
    const col = temp > 0.8 ? '255,226,200' : temp > 0.45 ? '226,234,255' : '255,255,255'
    const y = ny * h
    if (mag > 0.7) {
      const rad = 2 + mag * 3
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, `rgba(${col},${a})`)
      g.addColorStop(0.25, `rgba(${col},${a * 0.35})`)
      g.addColorStop(1, `rgba(${col},0)`)
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    } else {
      ctx.fillStyle = `rgba(${col},${a})`
      const s = mag > 0.2 ? 1.6 : 1.1
      ctx.fillRect(x, y, s, s)
    }
  }
  return toTexture(canvas, { mipmaps: true })
}

export const buildStarTexture = () => {
  const size = 32
  const { canvas, ctx } = makeCanvas(size, size)
  const c = size / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.12, 'rgba(240,244,255,0.85)')
  g.addColorStop(0.35, 'rgba(200,212,255,0.18)')
  g.addColorStop(1, 'rgba(180,190,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  // Faint diffraction cross.
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(c - 0.5, 2, 1, size - 4)
  ctx.fillRect(2, c - 0.5, size - 4, 1)
  return toTexture(canvas)
}

/* ----------------------------------------------------------------- moon */

/** Approximate positions of the real lunar maria (disc coords, x right, y down). */
const MARIA: [number, number, number, number, number][] = [
  // cx, cy, rx, ry, darkness
  [-0.6, -0.02, 0.28, 0.48, 0.8], // Oceanus Procellarum
  [-0.28, -0.4, 0.27, 0.22, 1], // Imbrium
  [0.15, -0.36, 0.15, 0.14, 0.95], // Serenitatis
  [0.27, -0.08, 0.2, 0.17, 0.9], // Tranquillitatis
  [0.62, -0.26, 0.1, 0.08, 1], // Crisium
  [0.5, 0.14, 0.11, 0.16, 0.8], // Fecunditatis
  [0.32, 0.24, 0.08, 0.08, 0.75], // Nectaris
  [-0.2, 0.3, 0.17, 0.13, 0.75], // Nubium
  [-0.46, 0.34, 0.09, 0.08, 0.85], // Humorum
  [-0.05, -0.66, 0.42, 0.07, 0.7], // Frigoris
  [0.02, -0.18, 0.08, 0.06, 0.7], // Vaporum
  [-0.25, -0.05, 0.1, 0.12, 0.5], // Insularum
]

/** Realistic moon disc — lunar maria, foreshortened craters, Tycho rays. */
export const buildMoonTexture = () => {
  const size = 640
  const c = size / 2
  const R = c - 2
  const { canvas, ctx } = makeCanvas(size, size)
  // Light from the right and slightly toward the viewer: a waxing gibbous lean.
  const L = [0.42, -0.08, 0.9]
  const ln = Math.hypot(L[0], L[1], L[2])
  const lx = L[0] / ln
  const ly = L[1] / ln
  const lz = L[2] / ln

  shade(ctx, size, size, (x, y, o) => {
    const nx = (x + 0.5 - c) / R
    const ny = (y + 0.5 - c) / R
    const r2 = nx * nx + ny * ny
    const r = Math.sqrt(r2)
    if (r > 1 + 1.5 / R) {
      o[3] = 0
      return
    }
    const nz = Math.sqrt(Math.max(0, 1 - r2))
    // Spherical coords so features compress toward the limb.
    const lon = Math.atan2(nx, Math.max(nz, 1e-3))
    const lat = Math.asin(Math.max(-1, Math.min(1, ny)))
    const sx = Math.sin(lon) + (fbm(lon * 3 + 3, lat * 3, 4) - 0.5) * 0.35
    const sy = Math.sin(lat) + (fbm(lon * 3, lat * 3 + 7, 4) - 0.5) * 0.35
    // Soft overlapping basins with ragged, noisy shorelines.
    let field = 0
    for (const [mx, my, rx, ry, dark] of MARIA) {
      field += dark * Math.exp(-(((sx - mx) / rx) ** 2 + ((sy - my) / ry) ** 2) * 1.4)
    }
    const shore = (fbm(lon * 9 + 1, lat * 9, 4) - 0.5) * 0.55
    const maria = smoothstep(0.22, 0.85, field + shore) * 0.9
    const grain = fbm(lon * 14, lat * 14, 4)
    const fine = fbm(lon * 48 + 9, lat * 48, 3)
    const albedo = lerp(1.04, 0.6, maria) * (0.86 + (grain - 0.5) * 0.36 + (fine - 0.5) * 0.14)
    // Lommel–Seeliger reflectance: flat full-moon look with a soft terminator.
    const ci = Math.max(0, nx * lx + ny * ly + nz * lz)
    const ls = (2 * ci) / (ci + Math.max(nz, 0.05))
    const lit = albedo * Math.min(1.15, ls) * 1.08
    const warm = lerp(1, 0.94, maria)
    o[0] = Math.min(255, 238 * lit * warm)
    o[1] = Math.min(255, 236 * lit * lerp(1, 0.97, maria))
    o[2] = Math.min(255, 228 * lit * lerp(1, 1.06, maria))
    o[3] = 255 * clamp01((1 - r) * R + 0.5)
  })

  ctx.save()
  ctx.beginPath()
  ctx.arc(c, c, R, 0, Math.PI * 2)
  ctx.clip()
  ctx.globalCompositeOperation = 'source-atop'

  // Craters: power-law sizes, ellipses foreshortened toward the limb.
  for (let i = 0; i < 520; i++) {
    const a = hash2(i, 1.7) * Math.PI * 2
    const rr = Math.sqrt(hash2(i, 2.3)) * 0.97
    const px = Math.cos(a) * rr
    const py = Math.sin(a) * rr
    const nz = Math.sqrt(Math.max(0.02, 1 - rr * rr))
    const cr = Math.min(R * 0.07, (R * 0.0045) / Math.pow(hash2(i, 5.1) + 0.02, 0.55))
    const strength = 0.03 + Math.min(0.07, (cr / R) * 0.9)
    ctx.save()
    ctx.translate(c + px * R, c + py * R)
    ctx.rotate(a)
    ctx.scale(nz, 1)
    ctx.beginPath()
    ctx.arc(0, 0, cr, 0, Math.PI * 2)
    ctx.save()
    ctx.clip()
    // Light from the right: the left inner wall is lit, the right one shadowed.
    ctx.rotate(-a)
    ctx.fillStyle = `rgba(255,250,238,${strength})`
    ctx.beginPath()
    ctx.arc(-cr * 0.18, 0, cr, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(60,60,70,${strength * 0.8})`
    ctx.beginPath()
    ctx.arc(cr * 0.28, 0, cr * 0.9, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.strokeStyle = `rgba(255,252,240,${strength * 0.5})`
    ctx.lineWidth = Math.max(0.6, cr * 0.12)
    ctx.stroke()
    ctx.restore()
  }

  // Bright ray systems: Tycho (south), Copernicus, Kepler.
  for (const [tx, ty, count, len, alpha] of [
    [-0.12, 0.66, 46, 1.1, 0.07],
    [-0.27, -0.13, 28, 0.45, 0.06],
    [-0.52, -0.1, 16, 0.3, 0.05],
  ] as const) {
    const ox = c + tx * R
    const oy = c + ty * R
    ctx.save()
    ctx.filter = 'blur(1.5px)'
    for (let i = 0; i < count; i++) {
      const ang = hash2(i, tx * 10) * Math.PI * 2
      const l = R * len * (0.35 + hash2(i, ty * 10) * 0.65)
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * l, oy + Math.sin(ang) * l)
      g.addColorStop(0, `rgba(255,252,244,${alpha * 2})`)
      g.addColorStop(1, 'rgba(255,252,244,0)')
      ctx.strokeStyle = g
      ctx.lineWidth = 1 + hash2(i, 4.4) * 3
      ctx.beginPath()
      ctx.moveTo(ox, oy)
      ctx.lineTo(ox + Math.cos(ang) * l, oy + Math.sin(ang) * l)
      ctx.stroke()
    }
    ctx.filter = 'none'
    const spot = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 0.035)
    spot.addColorStop(0, 'rgba(255,255,250,0.85)')
    spot.addColorStop(1, 'rgba(255,255,250,0)')
    ctx.fillStyle = spot
    ctx.fillRect(ox - R * 0.05, oy - R * 0.05, R * 0.1, R * 0.1)
    ctx.restore()
  }
  ctx.restore()

  return toTexture(canvas, { mipmaps: true })
}

/** Moon radius as a fraction of the glow texture's half-size. */
export const MOON_GLOW_CORE = 0.075

/** Layered gaussian halo (tight bloom → wide atmospheric scatter), dithered. */
export const buildMoonGlowTexture = () => {
  const size = 768
  const c = size / 2
  const { canvas, ctx } = makeCanvas(size, size)
  shade(ctx, size, size, (x, y, o) => {
    const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c
    const k = Math.max(1, r / MOON_GLOW_CORE)
    const bloom = 0.32 * Math.exp(-(k - 1) * 2.4)
    const halo = 0.2 * Math.exp(-(k - 1) / 1.8)
    const scatter = 0.09 * Math.exp(-k / 5.5)
    // Faint corona ring from thin cloud droplets.
    const ring = 0.025 * Math.exp(-(((k - 3.2) / 0.5) ** 2))
    const edge = 1 - smoothstep(0.82, 1, r)
    const i = (bloom + halo + scatter + ring) * edge + (hash2(x, y) - 0.5) / 255
    o[0] = 255 * clamp01(i * 0.82 + ring * 1.5)
    o[1] = 255 * clamp01(i * 0.88)
    o[2] = 255 * clamp01(i)
    o[3] = 255 * clamp01(i)
  })
  return toTexture(canvas)
}

/* --------------------------------------------------------------- clouds */

/**
 * Horizontally tileable night cloud layer. Returns the dark cloud body and a
 * matching "light" texture used for silver lining where the moon is near.
 */
export const buildCloudTextures = (kind: 'back' | 'front') => {
  const w = 768
  const h = 384
  const front = kind === 'front'
  const periodX = front ? 3 : 4
  const { canvas: bodyCanvas, ctx: bodyCtx } = makeCanvas(w, h)
  const { canvas: lightCanvas, ctx: lightCtx } = makeCanvas(w, h)
  const lightImg = lightCtx.createImageData(w, h)
  const seed = front ? 31.7 : 0

  shade(bodyCtx, w, h, (x, y, o) => {
    const u = (x / w) * periodX
    const v = (y / h) * (front ? 4.5 : 2.4) + seed
    const qx = fbm(u, v, 4, periodX)
    const qy = fbm(u + 5.2, v + 1.3, 4, periodX)
    const d = fbm(u + qx * 1.6, v + qy * (front ? 0.6 : 1.6), 6, periodX)
    const ny = y / h
    // Vertical profile: thickest high up, thinning toward the horizon.
    const profile = front
      ? smoothstep(0, 0.2, ny) * (1 - smoothstep(0.55, 1, ny))
      : smoothstep(0, 0.04, ny) * (1 - smoothstep(0.3, 0.97, ny))
    const cov = front ? 0.47 : 0.42
    const density = clamp01((d - cov) / (front ? 0.35 : 0.28)) * profile
    const body = smoothstep(0, 1, density)
    const thick = smoothstep(0.35, 1, density)
    // Thin edges glow, thick cores stay dark; undersides pick up city neon.
    const rim = body * (1 - thick)
    const neon = ny * ny * 0.8
    o[0] = 22 + rim * 70 + neon * 50
    o[1] = 22 + rim * 72 + neon * 16
    o[2] = 36 + rim * 96 + neon * 56
    o[3] = 255 * body * (front ? 0.62 : 0.94)
    const i = (y * w + x) * 4
    const light = body * (0.35 + rim * 1.4) * (front ? 0.75 : 1)
    lightImg.data[i] = 205
    lightImg.data[i + 1] = 218
    lightImg.data[i + 2] = 255
    lightImg.data[i + 3] = 255 * clamp01(light)
  })
  lightCtx.putImageData(lightImg, 0, 0)

  return { body: toTexture(bodyCanvas), light: toTexture(lightCanvas) }
}

/** Soft white radial falloff — masks the moonlit cloud layer. */
export const buildRadialMaskTexture = () => {
  const size = 256
  const c = size / 2
  const { canvas, ctx } = makeCanvas(size, size)
  shade(ctx, size, size, (x, y, o) => {
    const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c
    const a = Math.exp(-r * r * 4.5) * (1 - smoothstep(0.85, 1, r))
    o[0] = o[1] = o[2] = 255
    o[3] = 255 * a
  })
  return toTexture(canvas)
}

/* ----------------------------------------------------------------- city */

/** Distant low skyline silhouette with tiny windows and neon specks. */
export const buildSkylineTexture = () => {
  const w = 2048
  const h = 192
  const { canvas, ctx } = makeCanvas(w, h)
  let x = -10
  let i = 0
  while (x < w + 10) {
    const bw = 14 + hash2(i, 1.3) * 46
    const tall = hash2(i, 2.9) > 0.86
    const bh = (tall ? 90 : 18) + hash2(i, 4.7) * (tall ? 90 : 60)
    const shadeV = 6 + hash2(i, 6.1) * 8
    ctx.fillStyle = `rgb(${shadeV},${shadeV - 1},${shadeV + 6})`
    ctx.fillRect(x, h - bh, bw, bh)
    for (let wy = h - bh + 4; wy < h - 4; wy += 5) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 4) {
        const r = hash2(wx * 0.37, wy * 0.71)
        if (r > 0.88) {
          ctx.fillStyle = r > 0.97 ? 'rgba(255,214,160,0.75)' : 'rgba(170,190,255,0.45)'
          ctx.fillRect(wx, wy, 1.4, 1.6)
        }
      }
    }
    if (hash2(i, 8.8) > 0.72) {
      ctx.fillStyle = hash2(i, 9.9) > 0.5 ? 'rgba(255,70,170,0.8)' : 'rgba(90,160,255,0.75)'
      ctx.fillRect(x + bw * 0.2, h - bh + 6, bw * 0.12, Math.min(bh * 0.5, 30))
    }
    if (tall) {
      ctx.fillStyle = 'rgba(255,40,40,0.9)'
      ctx.fillRect(x + bw / 2 - 1, h - bh - 2, 2, 2)
    }
    x += bw + hash2(i, 3.3) * 6
    i++
  }
  return toTexture(canvas, { mipmaps: true })
}

/** Vertical haze strip that softens the line where road meets sky. */
export const buildHazeTexture = () => {
  const w = 4
  const h = 256
  const { canvas, ctx } = makeCanvas(w, h)
  shade(ctx, w, h, (x, y, o) => {
    const t = y / h
    const a = Math.exp(-(((t - 0.45) / 0.2) ** 2)) * 0.8
    o[0] = 54 + (hash2(x, y) - 0.5) * 2
    o[1] = 26
    o[2] = 64
    o[3] = 255 * a
  })
  return toTexture(canvas)
}

/* ---------------------------------------------------------------- road */

/** Tileable wet asphalt: aggregate stones, binder, wet glints. */
export const buildAsphaltTexture = () => {
  const size = 512
  const { canvas, ctx } = makeCanvas(size, size)
  shade(ctx, size, size, (x, y, o) => {
    const u = x / size
    const v = y / size
    const grain = fbm(u * 64, v * 64, 3, 64, 64)
    const blotch = fbm(u * 6 + 3, v * 6, 4, 6, 6)
    const stoneN = noise(u * 150, v * 150, 150, 150)
    const stone = smoothstep(0.66, 0.74, stoneN)
    const pit = smoothstep(0.3, 0.22, noise(u * 120 + 7, v * 120, 120, 120))
    let lum = 0.075 + (grain - 0.5) * 0.07 + (blotch - 0.5) * 0.035
    lum += stone * (0.05 + hash2(Math.floor(u * 150), Math.floor(v * 150)) * 0.08)
    lum -= pit * 0.035
    // Sparse wet specular glints on exposed aggregate.
    if (hash2(x, y) > 0.9975) lum += 0.35
    lum = Math.max(0.012, lum)
    o[0] = 255 * lum * 0.94
    o[1] = 255 * lum * 0.97
    o[2] = 255 * lum * 1.1
  })
  return toTexture(canvas, { repeat: true, mipmaps: true })
}

/** Tileable grime: tyre wear, oil, dark water patches and cracks. */
export const buildGrimeTexture = () => {
  const size = 512
  const { canvas, ctx } = makeCanvas(size, size)
  shade(ctx, size, size, (x, y, o) => {
    const u = x / size
    const v = y / size
    const big = fbm(u * 5, v * 5, 5, 5, 5)
    const mid = fbm(u * 18 + 4, v * 18, 4, 18, 18)
    const a = smoothstep(0.48, 0.75, big) * 0.55 + smoothstep(0.55, 0.8, mid) * 0.25
    o[0] = 4
    o[1] = 3
    o[2] = 8
    o[3] = 255 * clamp01(a)
  })
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'
  ctx.lineCap = 'round'
  for (let k = 0; k < 14; k++) {
    let px = hash2(k, 1.1) * size
    let py = hash2(k, 2.2) * size
    let ang = hash2(k, 3.3) * Math.PI * 2
    ctx.lineWidth = 0.8 + hash2(k, 4.4) * 1.4
    for (let s = 0; s < 40; s++) {
      ang += (hash2(k, s) - 0.5) * 0.9
      const nx = px + Math.cos(ang) * 5
      const ny = py + Math.sin(ang) * 5
      // Draw wrapped copies so the crack tiles seamlessly.
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          ctx.beginPath()
          ctx.moveTo(px + ox, py + oy)
          ctx.lineTo(nx + ox, ny + oy)
          ctx.stroke()
        }
      }
      px = nx
      py = ny
    }
  }
  return toTexture(canvas, { repeat: true, mipmaps: true })
}

export type Ground = { cx: number; yH: number; f: number; camH: number }

export type RoadLight = {
  nx: number
  ny: number
  color: RGB
  power: number
  width: number
}

/**
 * Screen-space wet-road reflection pass (added on top of the road): Fresnel
 * sky sheen plus rippled vertical streaks of the moon and neon, broken up by
 * puddles that live in road coordinates.
 */
export const buildReflectionTexture = (
  w: number,
  h: number,
  g: Ground,
  lights: RoadLight[],
) => {
  const scale = 0.5
  const band = h - g.yH
  const cw = Math.max(2, Math.ceil(w * scale))
  const ch = Math.max(2, Math.ceil(band * scale))
  const { canvas, ctx } = makeCanvas(cw, ch)
  const L = lights.map((l) => ({
    ...l,
    x: l.nx * w,
    m: g.yH - l.ny * h,
  }))

  shade(ctx, cw, ch, (px, py, o) => {
    const sx = px / scale
    const d = (py + 0.5) / scale
    const Z = (g.f * g.camH) / d
    const X = ((sx - g.cx) * Z) / g.f
    const t = d / band
    const puddle = smoothstep(0.5, 0.64, fbm(X * 0.16 + 11, Z * 0.16, 4))
    const wet = 0.38 + 0.62 * puddle
    const rippleN = fbm(X * 1.1, Z * 6, 3)
    const ripple = lerp(0.2 + 0.8 * smoothstep(0.3, 0.7, rippleN), 1, puddle * 0.65)

    // Fresnel: grazing angles near the horizon mirror the sky strongly.
    const fres = (0.05 + 0.75 * Math.pow(1 - t, 4)) * wet
    const sky = skyColorAt((g.yH - d) / h)
    let r = sky[0] * fres * 2.4
    let gg = sky[1] * fres * 2.4
    let b = sky[2] * fres * 2.4

    for (const l of L) {
      const width = l.width * w * (0.45 + t * 1.1)
      const hx = Math.exp(-(((sx - l.x) / width) ** 2))
      if (hx < 0.004) continue
      const reach = 0.5 * l.m + 0.25 * band
      const v = Math.exp(-Math.abs(d - l.m) / reach) * smoothstep(0, 18, d)
      const k = hx * v * ripple * wet * l.power
      r += l.color[0] * k
      gg += l.color[1] * k
      b += l.color[2] * k
    }
    o[0] = Math.min(255, r)
    o[1] = Math.min(255, gg)
    o[2] = Math.min(255, b)
  })
  return toTexture(canvas)
}

/* --------------------------------------------------------------- petals */

const sakuraPath = (w: number, h: number, variant: number) => {
  const path = new Path2D()
  const lean = (variant - 1.5) * 0.04
  const notch = 0.4 + variant * 0.02
  const belly = 0.3 + (variant % 2) * 0.04
  path.moveTo(lean * w, h * 0.46)
  path.bezierCurveTo(w * (belly + 0.02), h * 0.22, w * 0.38, 0, w * 0.3, -h * 0.2)
  path.bezierCurveTo(w * 0.22, -h * 0.38, w * 0.12, -h * 0.48, w * 0.03, -h * notch)
  path.quadraticCurveTo(0, -h * 0.3, -w * 0.03, -h * notch)
  path.bezierCurveTo(-w * 0.12, -h * 0.48, -w * 0.22, -h * 0.38, -w * 0.3, -h * 0.2)
  path.bezierCurveTo(-w * 0.38, 0, -w * (belly + 0.02), h * 0.22, lean * w, h * 0.46)
  return path
}

/**
 * Near-white petal so sprite tint supplies the hue: pink claw at the base,
 * translucent edges, faint veins. No baked glow — glow is a real blur pass.
 */
export const buildPetalTextures = () => {
  const textures: Texture[] = []
  for (let variant = 0; variant < 4; variant++) {
    const w = 72
    const h = 112
    const { canvas, ctx } = makeCanvas(w, h)
    ctx.translate(w / 2, h / 2)
    const path = sakuraPath(w * 0.92, h * 0.92, variant)
    const body = ctx.createLinearGradient(0, -h * 0.42, 0, h * 0.44)
    body.addColorStop(0, 'rgba(255,250,252,0.92)')
    body.addColorStop(0.55, 'rgba(255,240,246,0.96)')
    body.addColorStop(0.85, 'rgba(250,190,214,1)')
    body.addColorStop(1, 'rgba(226,120,168,1)')
    ctx.fillStyle = body
    ctx.fill(path)
    ctx.save()
    ctx.clip(path)
    const edge = ctx.createRadialGradient(0, h * 0.05, w * 0.12, 0, 0, w * 0.6)
    edge.addColorStop(0, 'rgba(255,255,255,0)')
    edge.addColorStop(1, 'rgba(255,214,232,0.35)')
    ctx.fillStyle = edge
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.strokeStyle = 'rgba(214,140,176,0.28)'
    ctx.lineWidth = 0.8
    for (const k of [-0.16, -0.07, 0, 0.07, 0.16]) {
      ctx.beginPath()
      ctx.moveTo(0, h * 0.4)
      ctx.quadraticCurveTo(w * k * 1.2, 0, w * k * 1.9, -h * 0.34)
      ctx.stroke()
    }
    ctx.restore()
    textures.push(toTexture(canvas, { mipmaps: true }))
  }
  return textures
}
