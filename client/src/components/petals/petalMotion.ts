export const PETAL_COUNT = 5
export const EDGE_MARGIN = 48
export const FADE_IN = 0.45
export const FADE_OUT = 0.35
export const GLOW_CHANCE = 0.22
export const PARALLAX_X = 24
export const PARALLAX_Y = 16

export const PETAL_TINTS = [0xffc8dc, 0xffd8e6, 0xf7b3cc, 0xffe6ee, 0xf2a6c4, 0xfff2f6] as const

export type PetalSeed = {
  depth: number
  size: number
  aspect: number
  vx: number
  vy: number
  rot: number
  spin: number
  phase: number
  flip: number
  flipSpeed: number
  windInfluence: number
  baseAlpha: number
  glow: boolean
  variant: number
  turmoil: number
  turmoilPhase: number
}

export type WindState = {
  x: number
  y: number
  xTarget: number
  yTarget: number
  gustUntil: number
  noiseT: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export const createWind = (): WindState => ({
  x: -22,
  y: 90,
  xTarget: -22,
  yTarget: 90,
  gustUntil: 0,
  noiseT: 0,
})

export const seedPetal = (): PetalSeed => ({
  depth: 0.9 + Math.random() * 0.1,
  size: 16 + Math.random() * 8,
  aspect: rand(1.4, 1.65),
  vx: 0,
  vy: 0,
  rot: rand(0, Math.PI * 2),
  spin: rand(-1.1, 1.1),
  phase: rand(0, Math.PI * 2),
  flip: rand(0, Math.PI * 2),
  flipSpeed: rand(0.5, 1.6) * (Math.random() < 0.5 ? -1 : 1),
  windInfluence: rand(0.75, 1.25),
  baseAlpha: rand(0.85, 0.97),
  glow: Math.random() < GLOW_CHANCE,
  variant: (Math.random() * 4) | 0,
  turmoil: rand(0.6, 1.4),
  turmoilPhase: rand(0, Math.PI * 2),
})

export const spawnAbove = (w: number, h: number, midFall = false) => ({
  x: rand(-30, w + 30),
  y: midFall ? rand(-EDGE_MARGIN, h * 0.85) : -EDGE_MARGIN - rand(0, 120),
})

export const pickTint = () => PETAL_TINTS[(Math.random() * PETAL_TINTS.length) | 0]

export const stepWind = (wind: WindState, now: number, dt: number) => {
  wind.noiseT += dt
  const turmoil =
    Math.sin(wind.noiseT * 0.7) * 18 +
    Math.sin(wind.noiseT * 1.3) * 10 +
    Math.sin(wind.noiseT * 0.23) * 8

  if (now > wind.gustUntil) {
    if (Math.random() < 0.22 * dt) {
      wind.gustUntil = now + rand(1800, 4000)
      wind.xTarget = rand(-55, -12)
      wind.yTarget = rand(85, 130)
    } else {
      wind.xTarget = -22 + turmoil * 0.2
      wind.yTarget = 90 + turmoil * 0.3
    }
  }

  wind.x += (wind.xTarget - wind.x) * Math.min(1, dt * 2)
  wind.y += (wind.yTarget - wind.y) * Math.min(1, dt * 2)
}

export const integratePetal = (
  p: PetalSeed & { x: number; y: number; age: number },
  wind: WindState,
  dt: number,
) => {
  p.age += dt

  const tx =
    Math.sin(p.age * 2.1 * p.turmoil + p.turmoilPhase) * 28 * p.turmoil +
    Math.sin(p.age * 5.3 + p.phase) * 12 * p.turmoil
  const ty =
    Math.cos(p.age * 1.7 * p.turmoil + p.turmoilPhase) * 22 * p.turmoil +
    Math.sin(p.age * 3.9 + p.phase * 1.3) * 14 * p.turmoil

  const depthSpeed = 0.45 + p.depth * 0.75
  const desiredVx = (wind.x * p.windInfluence + tx) * depthSpeed
  const desiredVy = (wind.y * p.windInfluence + ty) * depthSpeed
  p.vx += (desiredVx - p.vx) * Math.min(1, dt * 3)
  p.vy += (desiredVy - p.vy) * Math.min(1, dt * 3)

  p.x += p.vx * dt
  p.y += p.vy * dt
  p.spin += Math.sin(p.age * 3.2 + p.turmoilPhase) * 0.4 * dt * p.turmoil
  p.rot += p.spin * dt
  p.flip += p.flipSpeed * dt * (1 + Math.sin(p.age * 2 + p.phase) * 0.2)
}

export const petalScale = (p: PetalSeed, texW: number, texH: number) => {
  const flipWidth = Math.max(0.16, Math.abs(Math.cos(p.flip)))
  return {
    sx: (p.size * flipWidth) / texW,
    sy: (p.size * p.aspect) / texH,
  }
}

export const isOffscreen = (x: number, y: number, w: number, h: number) =>
  x < -EDGE_MARGIN - 100 ||
  x > w + EDGE_MARGIN + 100 ||
  y > h + EDGE_MARGIN + 100 ||
  y < -EDGE_MARGIN - 160
