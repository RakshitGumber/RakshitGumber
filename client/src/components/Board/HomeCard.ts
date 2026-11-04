import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { SITE } from '../../data/site'

export const HOME_W = 520
export const HOME_H = 360

function burstTexture(w: number, h: number) {
  const c = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  const ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)

  const cx = w * 0.42
  const cy = h * 0.48
  const spikes = 18
  const rOuter = Math.min(w, h) * 0.42
  const rInner = rOuter * 0.62

  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? rOuter : rInner
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#111'
  ctx.stroke()

  ctx.fillStyle = '#111'
  ctx.font = `700 ${Math.round(h * 0.045)}px "IBM Plex Sans Condensed", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('HELLO MY NAME IS', cx, cy - h * 0.12)

  ctx.fillStyle = '#FFE566'
  ctx.strokeStyle = '#111'
  ctx.lineWidth = Math.max(4, h * 0.018)
  ctx.font = `400 ${Math.round(h * 0.16)}px Anton, Impact, sans-serif`
  ctx.strokeText(SITE.shortName, cx, cy + h * 0.02)
  ctx.fillText(SITE.shortName, cx, cy + h * 0.02)

  ctx.fillStyle = '#111'
  ctx.font = `700 ${Math.round(h * 0.035)}px "IBM Plex Sans Condensed", sans-serif`
  ctx.fillText("AND I'M A", cx, cy + h * 0.1)
  ctx.font = `700 ${Math.round(h * 0.055)}px "IBM Plex Sans Condensed", sans-serif`
  ctx.fillText('PRODUCT BUILDER', cx, cy + h * 0.165)

  return Texture.from(c)
}

export function createHomeCard() {
  const root = new Container()
  root.eventMode = 'none'

  const frame = new Graphics()
  frame.roundRect(-HOME_W / 2, -HOME_H / 2, HOME_W, HOME_H, 28)
  frame.fill({ color: 0x1a1a1a })
  frame.stroke({ width: 6, color: 0xf5f5f5 })

  const inset = new Graphics()
  inset.roundRect(-HOME_W / 2 + 14, -HOME_H / 2 + 14, HOME_W - 28, HOME_H - 28, 20)
  inset.fill({ color: 0x2a2a2a })

  // Desk-ish room blocks for atmosphere (original, not a clone of ntch art).
  const room = new Graphics()
  room.rect(-HOME_W / 2 + 40, HOME_H / 2 - 90, HOME_W - 80, 50)
  room.fill({ color: 0x3a3a3a })
  room.roundRect(-70, 20, 120, 70, 8)
  room.fill({ color: 0x111111 })
  room.roundRect(-55, 30, 90, 48, 4)
  room.fill({ color: 0x4ad2ff })
  room.circle(-140, -40, 28)
  room.fill({ color: 0x5a5a5a })
  room.circle(160, -60, 18)
  room.fill({ color: 0x6a8f5a })

  const burst = new Sprite(burstTexture(HOME_W * 0.78, HOME_H * 0.78))
  burst.anchor.set(0.5)
  burst.position.set(-20, -10)

  const footer = new Text({
    text: SITE.bio,
    style: {
      fontFamily: '"IBM Plex Sans Condensed", sans-serif',
      fontSize: 15,
      fontWeight: '500',
      fill: 0xe8e8e8,
      wordWrap: true,
      wordWrapWidth: HOME_W - 64,
      align: 'left',
    },
  })
  footer.anchor.set(0, 1)
  footer.position.set(-HOME_W / 2 + 28, HOME_H / 2 - 22)
  footer.alpha = 0.92

  root.addChild(frame, inset, room, burst, footer)

  return {
    root,
    x: 0,
    y: 0,
    place(spacing: number) {
      this.x = 0
      this.y = 0
      root.position.set(this.x, this.y)
      void spacing
    },
  }
}

export type HomeCard = ReturnType<typeof createHomeCard>
