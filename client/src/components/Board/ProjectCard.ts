import { Container, Graphics, Text } from 'pixi.js'
import type { Project } from '../../data/projects'

export const CARD_W = 380
export const CARD_H = 260

function hex(n: string) {
  return Number.parseInt(n.slice(1), 16)
}

export function createProjectCard(project: Project, spacing: number) {
  const root = new Container()
  root.eventMode = 'none'

  const accent = hex(project.accent)
  const ink = hex(project.ink)

  const frame = new Graphics()
  frame.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 24)
  frame.fill({ color: 0x141414 })
  frame.stroke({ width: 5, color: 0xf0f0f0 })

  const glass = new Graphics()
  glass.roundRect(-CARD_W / 2 + 12, -CARD_H / 2 + 12, CARD_W - 24, CARD_H - 24, 16)
  glass.fill({ color: accent })

  // Abstract “screen” content blocks — original placeholders, not stolen thumbs.
  const deco = new Graphics()
  deco.roundRect(-CARD_W / 2 + 36, -CARD_H / 2 + 40, CARD_W * 0.42, CARD_H * 0.38, 12)
  deco.fill({ color: 0xffffff, alpha: 0.22 })
  deco.roundRect(20, -CARD_H / 2 + 48, CARD_W * 0.28, 18, 6)
  deco.fill({ color: ink, alpha: 0.35 })
  deco.roundRect(20, -CARD_H / 2 + 78, CARD_W * 0.22, 14, 6)
  deco.fill({ color: ink, alpha: 0.22 })
  deco.circle(CARD_W / 2 - 70, CARD_H / 2 - 70, 34)
  deco.fill({ color: 0xffffff, alpha: 0.18 })

  const ch = new Text({
    text: String(project.channel).padStart(3, '0'),
    style: {
      fontFamily: '"IBM Plex Sans Condensed", sans-serif',
      fontSize: 14,
      fontWeight: '700',
      fill: ink,
      letterSpacing: 2,
    },
  })
  ch.position.set(-CARD_W / 2 + 28, -CARD_H / 2 + 22)

  const title = new Text({
    text: project.title,
    style: {
      fontFamily: 'Anton, Impact, sans-serif',
      fontSize: 36,
      fill: ink,
      wordWrap: true,
      wordWrapWidth: CARD_W - 56,
    },
  })
  title.position.set(-CARD_W / 2 + 28, CARD_H / 2 - 88)

  const tags = new Text({
    text: project.tags.toUpperCase(),
    style: {
      fontFamily: '"IBM Plex Sans Condensed", sans-serif',
      fontSize: 14,
      fontWeight: '600',
      fill: ink,
      letterSpacing: 1.5,
    },
  })
  tags.position.set(-CARD_W / 2 + 28, CARD_H / 2 - 42)
  tags.alpha = 0.85

  root.addChild(frame, glass, deco, ch, title, tags)

  const [gx, gy] = project.grid
  const x = gx * spacing
  const y = gy * spacing
  root.position.set(x, y)

  return {
    root,
    project,
    x,
    y,
    place(nextSpacing: number) {
      this.x = gx * nextSpacing
      this.y = gy * nextSpacing
      root.position.set(this.x, this.y)
    },
  }
}

export type ProjectCard = ReturnType<typeof createProjectCard>
