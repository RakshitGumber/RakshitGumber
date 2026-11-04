import { Container, Text } from 'pixi.js'

export type FocusInfo = {
  accent: string
  ink: string
  title: string
  detail: string
}

const ENTER_MS = 900
const EXIT_MS = 1100

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

function hexToNum(hex: string) {
  return Number.parseInt(hex.slice(1), 16)
}

function titleSize(w: number) {
  return Math.max(32, Math.min(72, w * 0.06))
}

function detailSize(w: number) {
  return Math.max(15, Math.min(22, w * 0.024))
}

export function createFocusUi(parent: Container) {
  const root = new Container()
  parent.addChild(root)

  const title = new Text({
    text: '',
    style: {
      fontFamily: 'Anton, Impact, sans-serif',
      fontSize: 48,
      fill: 0xffffff,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 800,
    },
  })
  title.anchor.set(0.5, 0)

  const detail = new Text({
    text: '',
    style: {
      fontFamily: '"IBM Plex Sans Condensed", sans-serif',
      fontSize: 18,
      fontWeight: '600',
      fill: 0xffffff,
      align: 'center',
      letterSpacing: 3,
    },
  })
  detail.anchor.set(0.5, 1)

  root.addChild(title, detail)
  root.visible = false

  let shown: FocusInfo | null = null
  let anim = 0
  let entering = false
  let screenW = 1
  let screenH = 1

  const layout = (w: number, h: number) => {
    screenW = w
    screenH = h
    title.style.fontSize = titleSize(w)
    title.style.wordWrapWidth = w * 0.78
    detail.style.fontSize = detailSize(w)
    title.x = w / 2
    title.y = h * 0.12
    detail.x = w / 2
    detail.y = h * 0.88
  }

  const applyTone = (tone: FocusInfo) => {
    const ink = hexToNum(tone.ink)
    title.text = tone.title
    detail.text = tone.detail.toUpperCase()
    title.style.fill = ink
    detail.style.fill = ink
  }

  const paint = (t: number) => {
    const k = entering ? easeOut(t) : 1 - easeOut(t)
    title.alpha = k
    detail.alpha = k
    title.x = screenW / 2 + (entering ? (1 - k) * -screenW * 0.4 : (1 - k) * -screenW * 0.4)
    title.y = screenH * 0.12 + (entering ? (1 - k) * -screenH * 0.3 : (1 - k) * -screenH * 0.3)
    detail.x = screenW / 2 + (entering ? (1 - k) * screenW * 0.4 : (1 - k) * screenW * 0.4)
    detail.y = screenH * 0.88 + (entering ? (1 - k) * screenH * 0.3 : (1 - k) * screenH * 0.3)
  }

  const setFocus = (info: FocusInfo | null) => {
    if (info) {
      shown = info
      applyTone(info)
      root.visible = true
      entering = true
      anim = 0
    } else if (shown) {
      entering = false
      anim = 0
    }
  }

  const tick = (deltaMS: number) => {
    if (!shown) return
    const dur = entering ? ENTER_MS : EXIT_MS
    anim = Math.min(1, anim + deltaMS / dur)
    paint(anim)
    if (!entering && anim >= 1) {
      shown = null
      root.visible = false
    }
  }

  return { layout, setFocus, tick }
}
