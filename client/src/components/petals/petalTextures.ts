import { CanvasSource, Texture } from 'pixi.js'

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

const toTexture = (canvas: HTMLCanvasElement) =>
  new Texture({
    source: new CanvasSource({
      resource: canvas,
      scaleMode: 'linear',
      addressMode: 'clamp-to-edge',
      autoGenerateMipmaps: true,
      maxAnisotropy: 16,
    }),
  })

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

/** Near-white petals — sprite tint supplies hue; glow is a separate blur pass. */
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

    textures.push(toTexture(canvas))
  }
  return textures
}
