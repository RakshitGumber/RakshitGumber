import {
  Application,
  BlurFilter,
  Container,
  Sprite,
  Texture,
  Ticker,
} from 'pixi.js'
import {
  FADE_IN,
  FADE_OUT,
  createWind,
  integratePetal,
  isOffscreen,
  petalScale,
  pickTint,
  seedPetal,
  spawnAbove,
  stepWind,
  type PetalSeed,
  type WindState,
} from '@/components/petals/petalMotion'
import { buildPetalTextures } from '@/components/petals/petalTextures'

type Petal = PetalSeed & {
  sprite: Sprite
  halo: Sprite
  x: number
  y: number
  fade: number
  exiting: boolean
  age: number
}

/**
 * Imperative Pixi scene for falling sakura. React owns mount/unmount only —
 * per-frame work stays on the ticker to avoid re-renders.
 */
export class PetalField {
  private app: Application | null = null
  private textures: Texture[] = []
  private glowLayer: Container | null = null
  private petals: Petal[] = []
  private wind: WindState = createWind()
  private count: number
  private disposed = false
  private onTick = (ticker: Ticker) => this.update(ticker)

  constructor(count: number) {
    this.count = count
  }

  async mount(host: HTMLElement) {
    this.textures = buildPetalTextures()

    const app = new Application()
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: 'high-performance',
    })

    if (this.disposed) {
      app.destroy({ releaseGlobalResources: true })
      this.textures.forEach((t) => t.destroy(true))
      this.textures = []
      return
    }

    this.app = app
    app.stage.sortableChildren = true

    this.glowLayer = new Container()
    this.glowLayer.zIndex = 10
    const bloom = new BlurFilter({ strength: 7, quality: 4 })
    bloom.blendMode = 'add'
    this.glowLayer.filters = [bloom]
    app.stage.addChild(this.glowLayer)

    const canvas = app.canvas
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    host.appendChild(canvas)

    const { width: w, height: h } = app.screen
    this.petals = Array.from({ length: this.count }, () => {
      const pos = spawnAbove(w, h, true)
      return this.createPetal(seedPetal(), pos.x, pos.y, 0.5 + Math.random() * 0.5)
    })

    app.ticker.add(this.onTick)
  }

  destroy() {
    this.disposed = true
    const app = this.app
    if (!app) return

    app.ticker.remove(this.onTick)
    app.destroy({ releaseGlobalResources: true }, { children: true })
    this.textures.forEach((t) => t.destroy(true))
    this.textures = []
    this.petals = []
    this.glowLayer = null
    this.app = null
  }

  private createPetal(seed: PetalSeed, x: number, y: number, fade: number): Petal {
    const sprite = new Sprite(this.textures[seed.variant])
    sprite.anchor.set(0.5)
    sprite.tint = pickTint()
    sprite.alpha = 0
    sprite.position.set(x, y)
    sprite.rotation = seed.rot
    sprite.zIndex = seed.depth * 1000
    this.app!.stage.addChild(sprite)

    const halo = new Sprite(this.textures[seed.variant])
    halo.anchor.set(0.5)
    halo.tint = 0xff9ccc
    halo.visible = seed.glow
    this.glowLayer!.addChild(halo)

    return { sprite, halo, x, y, fade, exiting: false, age: Math.random() * 6, ...seed }
  }

  private recycle(p: Petal, seed: PetalSeed, x: number, y: number) {
    p.sprite.texture = this.textures[seed.variant]
    p.halo.texture = this.textures[seed.variant]
    p.halo.visible = seed.glow
    p.sprite.tint = pickTint()
    Object.assign(p, seed, { x, y, fade: 0, exiting: false, age: 0 })
    p.sprite.position.set(x, y)
    p.sprite.rotation = p.rot
    p.sprite.zIndex = p.depth * 1000
    p.sprite.alpha = 0
    p.sprite.visible = true
  }

  private update(ticker: Ticker) {
    const app = this.app
    if (!app) return

    const dt = Math.min(0.05, ticker.deltaMS / 1000)
    const now = performance.now()
    const { width: w, height: h } = app.screen

    stepWind(this.wind, now, dt)

    for (const p of this.petals) {
      if (!p.sprite.visible && p.exiting) continue

      integratePetal(p, this.wind, dt)
      const texW = p.sprite.texture.width || 72
      const texH = p.sprite.texture.height || 112
      const { sx, sy } = petalScale(p, texW, texH)

      p.sprite.position.set(p.x, p.y)
      p.sprite.rotation = p.rot
      p.sprite.scale.set(sx, sy)

      if (p.exiting) {
        p.fade = Math.max(0, p.fade - dt / FADE_OUT)
        if (p.fade <= 0) {
          const pos = spawnAbove(w, h)
          this.recycle(p, seedPetal(), pos.x, pos.y)
        }
      } else if (p.fade < 1) {
        p.fade = Math.min(1, p.fade + dt / FADE_IN)
      }

      p.sprite.alpha = p.baseAlpha * p.fade

      if (p.glow) {
        p.halo.position.set(p.x, p.y)
        p.halo.rotation = p.rot
        p.halo.scale.set(sx * 1.25, sy * 1.25)
        p.halo.alpha = p.sprite.alpha * (0.75 + 0.25 * Math.sin(p.age * 2.3 + p.phase))
      }

      if (isOffscreen(p.x, p.y, w, h) && !p.exiting) p.exiting = true
    }

    const live = this.petals.filter((p) => p.sprite.visible && !p.exiting).length
    if (live < this.count && Math.random() < dt * 1.2) {
      const pos = spawnAbove(w, h)
      const recycled = this.petals.find((p) => !p.sprite.visible)
      if (recycled) this.recycle(recycled, seedPetal(), pos.x, pos.y)
      else if (this.petals.length < this.count + 4) {
        this.petals.push(this.createPetal(seedPetal(), pos.x, pos.y, 0))
      }
    }
  }
}
