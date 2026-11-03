import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'

const BORDER_PAD = 14
const BORDER_WIDTH = 5
const SVG_SIZE = 240
const PARALLAX = 36
const FRAME_MS = 980

export type GadgetDef = {
  src: string
  label: string
  grid: [number, number]
  accent: string
  ink: string
  title: string
  detail: string
}

export const GADGETS: GadgetDef[] = [
  {
    src: '/gadgets/walkman.svg',
    label: 'Walkman',
    grid: [0, 0],
    accent: '#FF8A5C',
    ink: '#1A1008',
    title: 'Sony Walkman',
    detail: 'Cassette stereo · 1979',
  },
  {
    src: '/gadgets/crt.svg',
    label: 'CRT',
    grid: [1, 0],
    accent: '#00D68F',
    ink: '#062218',
    title: 'CRT Monitor',
    detail: 'Phosphor glow · living room TV',
  },
  {
    src: '/gadgets/gameboy.svg',
    label: 'Game Boy',
    grid: [-1, 0],
    accent: '#B4E34A',
    ink: '#1A2410',
    title: 'Game Boy',
    detail: 'Handheld pixel playground · 1989',
  },
  {
    src: '/gadgets/flipphone.svg',
    label: 'Flip Phone',
    grid: [0, 1],
    accent: '#C89BFF',
    ink: '#1A1028',
    title: 'Flip Phone',
    detail: 'Clamshell chatter · early 2000s',
  },
  {
    src: '/gadgets/boombox.svg',
    label: 'Boombox',
    grid: [0, -1],
    accent: '#FFC857',
    ink: '#1A1408',
    title: 'Boombox',
    detail: 'Shoulder-mounted bass · street stereo',
  },
  {
    src: '/gadgets/camcorder.svg',
    label: 'Camcorder',
    grid: [1, -1],
    accent: '#FF5E6C',
    ink: '#1A080C',
    title: 'Camcorder',
    detail: 'Home movies on tape · press rec',
  },
]

export type RetroGadget = {
  root: Container
  def: GadgetDef
  x: number
  y: number
  place: (screenW: number, screenH: number) => void
  setFocused: (on: boolean) => void
  setParallax: (nx: number, ny: number) => void
}

function hexToNum(hex: string) {
  return Number.parseInt(hex.slice(1), 16)
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

export async function createRetroGadget(def: GadgetDef, resolution: number): Promise<RetroGadget> {
  const texture = await Assets.load<Texture>({
    alias: `${def.src}@${resolution}`,
    src: def.src,
    data: { width: SVG_SIZE, height: SVG_SIZE, resolution },
  })

  const root = new Container()
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  const border = new Graphics()
  root.addChild(sprite, border)

  let x = 0
  let y = 0
  let focused = false
  let panX = 0
  let panY = 0
  let frame = 0
  let frameTarget = 0
  let raf = 0
  let lastTs = 0

  const applyPos = () => {
    root.position.set(x + panX, y + panY)
  }

  const drawBorder = () => {
    border.clear()
    if (frame <= 0.001) {
      border.alpha = 0
      return
    }
    const t = easeOut(frame)
    const w = sprite.width
    const h = sprite.height
    const settle = (1 - t) * 32
    border
      .rect(
        -w / 2 - BORDER_PAD - settle,
        -h / 2 - BORDER_PAD - settle,
        w + (BORDER_PAD + settle) * 2,
        h + (BORDER_PAD + settle) * 2,
      )
      .stroke({ width: BORDER_WIDTH * (0.35 + 0.65 * t), color: hexToNum(def.ink) })
    border.alpha = t
  }

  const pump = (ts: number) => {
    if (!lastTs) lastTs = ts
    const dt = Math.min(48, ts - lastTs)
    lastTs = ts
    const step = dt / FRAME_MS
    if (frame < frameTarget) frame = Math.min(frameTarget, frame + step)
    else if (frame > frameTarget) frame = Math.max(frameTarget, frame - step)
    drawBorder()
    if (frame !== frameTarget) {
      raf = requestAnimationFrame(pump)
    } else {
      raf = 0
      lastTs = 0
    }
  }

  const setFrameTarget = (next: number) => {
    frameTarget = next
    if (!raf) {
      lastTs = 0
      raf = requestAnimationFrame(pump)
    }
  }

  return {
    root,
    def,
    get x() {
      return x
    },
    get y() {
      return y
    },
    place(screenW, screenH) {
      x = def.grid[0] * screenW
      y = def.grid[1] * screenH
      sprite.scale.set(Math.min(screenW, screenH) * 0.42 / Math.max(texture.width, texture.height))
      applyPos()
      drawBorder()
    },
    setFocused(on) {
      focused = on
      if (!on) {
        panX = 0
        panY = 0
        applyPos()
      }
      setFrameTarget(on ? 1 : 0)
    },
    setParallax(nx, ny) {
      if (!focused) return
      panX = -nx * PARALLAX
      panY = -ny * PARALLAX
      applyPos()
    },
  }
}
