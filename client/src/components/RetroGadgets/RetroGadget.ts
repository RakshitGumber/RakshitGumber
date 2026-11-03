import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'

const BORDER_PAD = 14
const BORDER_WIDTH = 5
const SVG_SIZE = 240

export type GadgetDef = {
  src: string
  label: string
  /** Grid offset in screen-units (1 = one viewport). */
  grid: [number, number]
}

export const GADGETS: GadgetDef[] = [
  { src: '/gadgets/walkman.svg', label: 'Walkman', grid: [0, 0] },
  { src: '/gadgets/crt.svg', label: 'CRT', grid: [1, 0] },
  { src: '/gadgets/gameboy.svg', label: 'Game Boy', grid: [-1, 0] },
  { src: '/gadgets/flipphone.svg', label: 'Flip Phone', grid: [0, 1] },
  { src: '/gadgets/boombox.svg', label: 'Boombox', grid: [0, -1] },
  { src: '/gadgets/camcorder.svg', label: 'Camcorder', grid: [1, -1] },
]

export type RetroGadget = {
  root: Container
  x: number
  y: number
  place: (screenW: number, screenH: number) => void
  setFocused: (on: boolean) => void
}

export async function createRetroGadget(
  def: GadgetDef,
  resolution: number,
): Promise<RetroGadget> {
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

  const drawBorder = () => {
    border.clear()
    if (!focused) return
    const w = sprite.width
    const h = sprite.height
    border
      .rect(-w / 2 - BORDER_PAD, -h / 2 - BORDER_PAD, w + BORDER_PAD * 2, h + BORDER_PAD * 2)
      .stroke({ width: BORDER_WIDTH, color: 0xd01e14 })
  }

  return {
    root,
    get x() {
      return x
    },
    get y() {
      return y
    },
    place(screenW, screenH) {
      x = def.grid[0] * screenW
      y = def.grid[1] * screenH
      root.position.set(x, y)
      const size = Math.min(screenW, screenH) * 0.42
      sprite.scale.set(size / Math.max(texture.width, texture.height))
      drawBorder()
    },
    setFocused(on) {
      focused = on
      drawBorder()
    },
  }
}
