// The game screen from the Cartridge design, on its own: a pixel window with
// a 64px portrait (stand-in art, public/art/portrait.png) standing behind a
// dialogue box that types. Adapted from the Cartridge design's screen (the
// "about" cartridge), minus the console. Everything is drawn in device pixels so every edge is crisp.

import { person } from "../../content";
import type { Sfx } from "../sound";

/** What he says, in order. Facts only, from content.ts. */
export const LINES = [
  person.line,
  `I'm obsessed with ${person.obsessed[0]}, ${person.obsessed[1]} and ${person.obsessed[2]}.`,
  "I make games and pixel art, and I'm never leaving either.",
  "Everything I make lives on the dial. Find the radio.",
];

const INK = "#2D160C";
const PAPER = "#F9F3E8";
const FLOOR = "#E9E0CF";
const GREEN = "#91AB7F";
const GREEN_HI = "#B9CBA9";
const GREEN_LO = "#5F7A55";
const GLASS = "#1E281C";
const SHADOW = "#170A05";
const FONT = '"Pixelify Sans", ui-monospace, monospace';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// full boot: flood, title card, reveal. A re-tune skips the title card.
const FLOOD = 380;
const HOLD = 860;
const END = 1100;
const SHORT_FLOOD = 260;
const SHORT_END = 480;
const TYPE_MS = 26;

export type ScreenHooks = {
  sfx: Sfx;
  reduced: () => boolean;
  /** A line starts typing (after a boot, or on a new page). */
  onLine: (page: number) => void;
};

type Phase = "off" | "boot" | "play";

export class JScreen {
  phase: Phase = "off";
  page = 0;
  pressed = false;
  private c: CanvasRenderingContext2D;
  private W = 0; // canvas, device px
  private H = 0;
  private dpr = 1;
  private U = 2; // frame pixel, device px
  private t0 = 0;
  private short = false;
  private typeFrom = 0;
  private lastBlip = 0;
  private chimed = false;
  private now = 0;
  private key = "";
  private gen = 0;
  // scene geometry, set per draw (content area, device px)
  private w = 0;
  private h = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private portrait: HTMLImageElement,
    private hooks: ScreenHooks,
  ) {
    this.c = canvas.getContext("2d")!;
  }

  /** Canvas size in device pixels. */
  layout(wd: number, hd: number, dpr: number) {
    this.W = wd;
    this.H = hd;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, wd);
    this.canvas.height = Math.max(1, hd);
    this.U = JScreen.unit(wd, hd);
    this.invalidate();
  }

  /** The frame's pixel for a canvas of this size. */
  static unit(wd: number, hd: number) {
    return Math.max(2, Math.round(Math.min(wd, hd) / 112));
  }

  invalidate() {
    this.gen++;
  }

  // ---------------------------------------------------------------- state

  /** Turn on. first: the full boot with the title card. */
  power(now: number, first: boolean) {
    this.short = !first;
    this.chimed = false;
    this.lastBlip = 0;
    if (this.hooks.reduced()) {
      this.phase = "play";
      this.typeFrom = now;
      this.hooks.onLine(this.page);
    } else {
      this.phase = "boot";
      this.t0 = now;
      this.typeFrom = now + (first ? END : SHORT_END);
    }
    this.invalidate();
  }

  /** A tap, click, Enter or Space. */
  press(now: number) {
    if (this.phase === "off") return;
    if (this.phase === "boot") {
      // an impatient press skips the boot
      this.phase = "play";
      this.typeFrom = now;
      this.hooks.onLine(this.page);
      return;
    }
    const line = LINES[this.page];
    if (this.typed(line, now) < line.length) {
      this.typeFrom = -1e9;
      return;
    }
    this.page = (this.page + 1) % LINES.length;
    this.typeFrom = now;
    this.lastBlip = 0;
    this.hooks.sfx.page();
    this.hooks.onLine(this.page);
  }

  private typed(line: string, now = this.now) {
    if (this.hooks.reduced()) return line.length;
    return Math.max(0, Math.min(line.length, Math.floor((now - this.typeFrom) / TYPE_MS)));
  }

  // ---------------------------------------------------------------- frame

  /** Draws if anything visible changed. Cheap when nothing did. */
  draw(now: number) {
    this.now = now;
    if (!this.W || !this.H) return;
    const red = this.hooks.reduced();
    let k: string;
    if (this.phase === "boot") {
      const e = now - this.t0;
      if (e >= (this.short ? SHORT_END : END)) {
        this.phase = "play";
        this.hooks.onLine(this.page);
      }
      k = this.phase === "boot" ? `b${Math.floor(e / 16)}` : "";
    } else k = "";
    if (this.phase === "play") {
      const n = this.typed(LINES[this.page]);
      const done = n >= LINES[this.page].length;
      const breathe = red ? 0 : Math.floor(now / 760) % 2;
      const blink = red || !done ? 1 : Math.floor(now / 420) % 2;
      k = `p${this.page}|${n}|${breathe}|${blink}`;
    } else if (this.phase === "off") k = "off";
    k += `|${this.pressed ? 1 : 0}|${this.gen}`;
    if (k === this.key) return;
    this.key = k;
    this.paint(now);
  }

  private paint(now: number) {
    const c = this.c;
    const U = this.U;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, this.W, this.H);

    // the window: a hard shadow under it, a bevelled green frame, an ink rule
    const lift = this.pressed ? U : 0;
    const fw = this.W;
    const fh = this.H - 2 * U;
    const fy = lift;
    this.prect(0, 2 * U, fw, fh, SHADOW);
    this.prect(0, fy, fw, fh, GREEN_LO);
    this.prect(0, fy, fw - U, fh - U, GREEN_HI);
    this.prect(U, fy + U, fw - 2 * U, fh - 2 * U, GREEN, 1);
    c.fillStyle = INK;
    c.fillRect(3 * U, fy + 3 * U, fw - 6 * U, fh - 6 * U);

    // the glass
    const gx = 4 * U;
    const gy = fy + 4 * U;
    this.w = fw - 8 * U;
    this.h = fh - 8 * U;
    c.save();
    c.translate(gx, gy);
    c.beginPath();
    c.rect(0, 0, this.w, this.h);
    c.clip();
    this.scene(now);
    c.restore();
  }

  private scene(now: number) {
    if (this.phase === "off") {
      this.fill(GLASS);
      return;
    }
    if (this.phase === "play") {
      this.drawTalk(now);
      return;
    }
    const e = now - this.t0;
    if (this.short) {
      if (e < SHORT_FLOOD) {
        this.drawTalk(now);
        this.dither(GREEN, e / SHORT_FLOOD, "rise");
      } else {
        this.drawTalk(now);
        this.dither(GREEN, 1 - (e - SHORT_FLOOD) / (SHORT_END - SHORT_FLOOD), "even");
      }
    } else if (e < FLOOD) {
      this.fill(GLASS);
      this.dither(GREEN, e / FLOOD, "rise");
    } else if (e < HOLD) {
      this.fill(GREEN);
      this.drawTitle(e);
    } else {
      this.drawTalk(now);
      this.dither(GREEN, 1 - (e - HOLD) / (END - HOLD), "even");
    }
    if (!this.chimed && e >= (this.short ? SHORT_FLOOD * 0.6 : FLOOD)) {
      this.chimed = true;
      this.hooks.sfx.chime();
    }
  }

  // ---------------------------------------------------------------- helpers

  /** A rectangle with stepped pixel corners, r steps deep. */
  private prect(x: number, y: number, w: number, h: number, color: string, r = 2) {
    const c = this.c;
    const U = this.U;
    c.fillStyle = color;
    if (r >= 2) {
      c.fillRect(x + 2 * U, y, w - 4 * U, h);
      c.fillRect(x + U, y + U, w - 2 * U, h - 2 * U);
      c.fillRect(x, y + 2 * U, w, h - 4 * U);
    } else {
      c.fillRect(x + U, y, w - 2 * U, h);
      c.fillRect(x, y + U, w, h - 2 * U);
    }
  }

  /** CSS px to device px, whole. */
  private px(v: number) {
    return Math.round(v * this.dpr);
  }

  /** Scene pixel: the dialogue box's rule and the dither grain. */
  private get u() {
    return Math.max(2, Math.round(Math.min(this.w, this.h) / 92));
  }

  /** Type scale: grows with the screen, so a big screen reads big. */
  private get fs() {
    return Math.min(1.5, Math.max(0.92, this.w / this.dpr / 350));
  }

  private font(sizeCss: number, weight = 400) {
    this.c.font = `${weight} ${this.px(sizeCss)}px ${FONT}`;
  }

  private text(s: string, x: number, y: number, color: string, align: CanvasTextAlign = "left") {
    const c = this.c;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "top";
    c.fillText(s, Math.round(x), Math.round(y));
  }

  private wrap(s: string, maxW: number): string[] {
    const lines: string[] = [];
    let cur = "";
    for (const w of s.split(" ")) {
      const t = cur ? `${cur} ${w}` : w;
      if (this.c.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  private fill(color: string) {
    this.c.fillStyle = color;
    this.c.fillRect(0, 0, this.w, this.h);
  }

  /** Ordered-dither cover. "rise" floods from the bottom; "even" is uniform. */
  private dither(color: string, prog: number, mode: "rise" | "even") {
    if (prog <= 0) return;
    if (prog >= 1) {
      this.fill(color);
      return;
    }
    const c = this.c;
    const u = this.u;
    const cols = Math.ceil(this.w / u);
    const rows = Math.ceil(this.h / u);
    c.fillStyle = color;
    c.beginPath();
    for (let j = 0; j < rows; j++) {
      const rowT = mode === "rise" ? (rows - 1 - j) / rows : 0;
      for (let i = 0; i < cols; i++) {
        const b = BAYER[(j & 3) * 4 + (i & 3)] / 16;
        const th = mode === "even" ? b : rowT * 0.78 + b * 0.22;
        if (prog > th) c.rect(i * u, j * u, u, u);
      }
    }
    c.fill();
  }

  private tri(x: number, y: number, n: number, color: string) {
    const u = this.u;
    this.c.fillStyle = color;
    for (let i = 0; i < n; i++) this.c.fillRect(Math.round(x + i * u), Math.round(y + i * u), ((n - i) * 2 - 1) * u, u);
  }

  /** Largest whole-pixel scale at which nw x nh fits in maxW x maxH. */
  private scaleFor(nw: number, nh: number, maxW: number, maxH: number) {
    return Math.max(1, Math.floor(Math.min(maxW / nw, maxH / nh)));
  }

  // ---------------------------------------------------------------- scenes

  private drawTitle(e: number) {
    const fs = this.fs;
    const size = Math.round(34 * fs);
    this.font(size, 700);
    const sz = this.px(size);
    const top = this.h / 2 - sz * 0.9;
    this.text(person.first, this.w / 2, top, INK, "center");
    // a bar fills underneath, like a load
    const u = this.u;
    const p = Math.min(1, (e - FLOOD) / (HOLD - FLOOD - 80));
    const bw = Math.round((this.w * 0.34) / u) * u;
    const bx = Math.round(this.w / 2 - bw / 2);
    const by = Math.round(top + sz * 1.55);
    this.c.fillStyle = "rgba(45,22,12,0.22)";
    this.c.fillRect(bx, by, bw, u);
    this.c.fillStyle = INK;
    this.c.fillRect(bx, by, Math.round((bw * p) / u) * u, u);
  }

  private drawTalk(now: number) {
    const c = this.c;
    const fs = this.fs;
    const u = this.u;
    const red = this.hooks.reduced();
    this.fill(PAPER);

    const m = Math.round(Math.max(this.px(10), this.w * 0.04));
    const boxW = this.w - m * 2;
    // the box is as tall as the longest line needs, so it never jumps between
    // pages; on a short screen the type steps down until the box fits
    let size = Math.round(17 * fs);
    let sz = 0;
    let lh = 0;
    let pad = 0;
    let rows = 1;
    let boxH = 0;
    for (;;) {
      this.font(size);
      sz = this.px(size);
      lh = Math.round(sz * 1.4);
      pad = Math.round(sz * 0.95);
      rows = Math.max(...LINES.map((l) => this.wrap(l, boxW - pad * 2).length));
      boxH = pad * 2 + u + rows * lh;
      if (boxH <= this.h * 0.5 || size <= 11) break;
      size--;
    }
    const box = { x: m, y: this.h - boxH - m, w: boxW, h: boxH };

    // portrait, his waist tucked behind the box; a one-pixel breath
    const k = this.scaleFor(41, 57, this.w * 0.64, box.y - m * 0.6 + 8);
    const breathe = red ? 0 : (Math.floor(now / 760) % 2) * k;
    const px = Math.round(this.w / 2 - (41 * k) / 2);
    const py = box.y - 57 * k + 4 * k + breathe;
    c.fillStyle = FLOOR;
    c.fillRect(0, box.y - 6 * k, this.w, this.h);
    if (this.portrait.complete && this.portrait.naturalWidth) c.drawImage(this.portrait, 12, 7, 41, 57, px, py, 41 * k, 57 * k);

    // the box
    c.fillStyle = INK;
    c.fillRect(box.x, box.y, box.w, box.h);
    c.fillStyle = PAPER;
    c.fillRect(box.x + u, box.y + u, box.w - u * 2, box.h - u * 2);
    c.fillStyle = GREEN;
    c.fillRect(box.x + u * 2, box.y + u * 2, box.w - u * 4, u);

    // speaker tag
    const tagSize = Math.round(size * 0.74);
    this.font(tagSize, 700);
    const tsz = this.px(tagSize);
    const tagPad = this.px(7 * fs);
    const tw = Math.round(c.measureText(person.first).width) + tagPad * 2;
    const th = Math.round(sz * 1.25);
    c.fillStyle = INK;
    c.fillRect(box.x + u * 3, box.y - th + u, tw, th);
    this.text(person.first, box.x + u * 3 + tagPad, box.y - th + u + (th - tsz) / 2 - this.px(1), PAPER);

    // the typed line
    const line = LINES[this.page];
    const n = this.typed(line, now);
    this.font(size);
    let left = n;
    this.wrap(line, box.w - pad * 2).forEach((l, i) => {
      this.text(l.slice(0, Math.max(0, left)), box.x + pad, box.y + pad + u + i * lh, INK);
      left -= l.length + 1;
    });
    if (n < line.length) {
      const per = Math.floor(n / 3);
      if (per !== this.lastBlip && n > 0) {
        this.lastBlip = per;
        this.hooks.sfx.blip();
      }
    } else if (red || Math.floor(now / 420) % 2 === 0) {
      this.tri(box.x + box.w - pad - u * 5, box.y + box.h - pad, 3, INK);
    }

    // where we are in the conversation
    this.font(Math.round(size * 0.7));
    this.text(`${this.page + 1} of ${LINES.length}`, box.x + box.w - pad, box.y - th + u + this.px(2), "rgba(45,22,12,0.55)", "right");
  }
}
