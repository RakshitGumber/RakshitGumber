// Chiki station: everything drawn in art pixels. One art pixel is k device
// pixels, k a whole number, so every edge lands on the device grid.

export const CELL = 12;
export const FRAME = 4;
export const SHADOW = 2;

export const C = {
  field: "#FF5432",
  ink: "#1A0F2E",
  drop: "#B8321C",
  cream: "#FFF1D6",
  frame: "#2B1A4A",
  frameHi: "#3D2A63",
  floor: "#21133A",
  floor2: "#251641",
  dot: "#35245C",
  bed: "#140B26",
  wallHi: "#FF9070",
  wallFront: "#B8321C",
  shade: "#100820",
  lilac: "#9C88D6",
};

export type Paint = { body: string; light: string; dark: string; name: string };
export const PAINTS: Paint[] = [
  { name: "yellow", body: "#FFC93C", light: "#FFEBA6", dark: "#D9861E" },
  { name: "mint", body: "#3FE0B0", light: "#BDF8E5", dark: "#169A84" },
  { name: "pink", body: "#FF8FC7", light: "#FFD3EA", dark: "#CF4E8E" },
];

export type Rect = (x: number, y: number, w: number, h: number, c: string) => void;
export const rectFn =
  (g: CanvasRenderingContext2D, k: number): Rect =>
  (x, y, w, h, c) => {
    if (w <= 0 || h <= 0) return;
    g.fillStyle = c;
    g.fillRect(Math.round(x) * k, Math.round(y) * k, Math.round(w) * k, Math.round(h) * k);
  };

/* ------------------------------------------------------------- glyphs */

const glyph = (rows: string[]) => ({ w: rows[0].length, rows });

// The logo: chunky letters, eight pixels tall.
const LOGO = {
  C: glyph([".#####", "######", "##....", "##....", "##....", "##....", "######", ".#####"]),
  H: glyph(["##..##", "##..##", "##..##", "######", "######", "##..##", "##..##", "##..##"]),
  I: glyph(["##", "##", "##", "##", "##", "##", "##", "##"]),
  K: glyph(["##...##", "##..##.", "##.##..", "####...", "####...", "##.##..", "##..##.", "##...##"]),
};

// The win stamp: five pixels tall.
const SMALL: Record<string, ReturnType<typeof glyph>> = {
  Q: glyph([".###.", "#...#", "#...#", "#..#.", ".##.#"]),
  U: glyph(["#...#", "#...#", "#...#", "#...#", ".###."]),
  I: glyph(["###", ".#.", ".#.", ".#.", "###"]),
  E: glyph(["####", "#...", "###.", "#...", "####"]),
  T: glyph(["#####", "..#..", "..#..", "..#..", "..#.."]),
  z: glyph(["####", "..#.", ".#..", "####"]),
};

const drawGlyph = (r: Rect, g: { rows: string[] }, x: number, y: number, s: number, c: string) => {
  g.rows.forEach((row, gy) => {
    for (let gx = 0; gx < row.length; gx++) if (row[gx] === "#") r(x + gx * s, y + gy * s, s, s, c);
  });
};

/** CHIKI in chunky pixels on a hard drop shadow. */
const LOGO_XS = [0, 7, 14, 17, 25];
const LOGO_LS = [LOGO.C, LOGO.H, LOGO.I, LOGO.K, LOGO.I];
export const LOGO_W = 27 + 1; // letters plus the drop shadow
export const LOGO_H = 8 + 1;

export function drawLogo(g: CanvasRenderingContext2D, k: number) {
  const r = rectFn(g, k);
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  LOGO_LS.forEach((l, i) => drawGlyph(r, l, LOGO_XS[i] + 1, 1, 1, C.drop));
  LOGO_LS.forEach((l, i) => drawGlyph(r, l, LOGO_XS[i], 0, 1, C.ink));
}

/* ------------------------------------------------------------- scene */

export type Eyes = "open" | "blink" | "shut" | "shock";
export type PieceDraw = {
  /** body rect in board-interior art px */
  x: number;
  y: number;
  w: number;
  h: number;
  eyes: Eyes;
  /** eyes lean this way while sliding */
  lx: number;
  ly: number;
};
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; z?: boolean };

export type Scene = {
  cols: number;
  rows: number;
  walls: Set<number>;
  beds: [number, number][];
  pieces: PieceDraw[];
  /** draw order, the mover last */
  order: number[];
  sel: number;
  selPulse: number;
  showSel: boolean;
  parts: Particle[];
  shakeX: number;
  shakeY: number;
  /** level 1 hint: a dotted trail, in cells */
  hint: { from: [number, number]; to: [number, number]; phase: number } | null;
  /** 0..1 grows the QUIET banner in; 0 hides it */
  banner: number;
  /** the banner's centre line, in interior art px: a band with no block in it */
  bannerY: number;
  /** win calm: floor dots fade out from the centre, 0..1 */
  calm: number;
};

export const boardArt = (cols: number, rows: number) => ({
  w: cols * CELL + FRAME * 2 + SHADOW,
  h: rows * CELL + FRAME * 2 + SHADOW,
});

export function drawBoard(g: CanvasRenderingContext2D, k: number, s: Scene) {
  const R = rectFn(g, k);
  const IW = s.cols * CELL;
  const IH = s.rows * CELL;
  const BW = IW + FRAME * 2;
  const BH = IH + FRAME * 2;
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);

  // the board sits on a hard pixel shadow
  R(SHADOW, SHADOW, BW, BH, C.drop);
  // frame: ink rim, a lit top-left face, a dark inner lip
  R(0, 0, BW, BH, C.ink);
  R(1, 1, BW - 2, BH - 2, C.frame);
  R(1, 1, BW - 2, 1, C.frameHi);
  R(1, 1, 1, BH - 2, C.frameHi);
  R(FRAME - 1, FRAME - 1, IW + 2, IH + 2, C.ink);
  // corner rivets
  for (const [cx, cy] of [
    [1, 1],
    [BW - 3, 1],
    [1, BH - 3],
    [BW - 3, BH - 3],
  ])
    R(cx, cy, 2, 2, C.lilac);

  g.save();
  // clip to the interior so shaken or squashed blocks never paint the frame
  g.beginPath();
  g.rect(FRAME * k, FRAME * k, IW * k, IH * k);
  g.clip();
  const ox = FRAME + s.shakeX;
  const oy = FRAME + s.shakeY;
  const r: Rect = (x, y, w, h, c) => R(ox + x, oy + y, w, h, c);

  // floor
  const cxm = (s.cols - 1) / 2;
  const cym = (s.rows - 1) / 2;
  const maxD = Math.hypot(cxm, cym) + 1;
  for (let y = 0; y < s.rows; y++)
    for (let x = 0; x < s.cols; x++) {
      r(x * CELL, y * CELL, CELL, CELL, (x + y) % 2 ? C.floor2 : C.floor);
      const quiet = s.calm > 0 && Math.hypot(x - cxm, y - cym) / maxD < s.calm;
      if (!quiet) r(x * CELL, y * CELL, 1, 1, C.dot);
    }

  // hint trail
  if (s.hint) {
    const [fx, fy] = s.hint.from;
    const [tx, ty] = s.hint.to;
    const dx = Math.sign(tx - fx);
    const dy = Math.sign(ty - fy);
    const len = (Math.abs(tx - fx) + Math.abs(ty - fy)) * CELL;
    const sx = fx * CELL + CELL / 2 + dx * 7;
    const sy = fy * CELL + CELL / 2 + dy * 7;
    const ph = Math.floor(s.hint.phase) % 3;
    for (let d = ph; d < len - 8; d += 3) r(sx + dx * d, sy + dy * d - (dx ? 1 : 0), 1, 1, C.lilac);
    // arrow head at the far end
    const ex = sx + dx * (len - 8);
    const ey = sy + dy * (len - 8) - 1;
    for (let i = 0; i < 3; i++) {
      if (dx) r(ex - dx * i, ey - i, 1, 1 + i * 2, C.lilac);
      else r(ex - i, ey - dy * i, 1 + i * 2, 1, C.lilac);
    }
  }

  // walls: raised vermilion blocks
  s.walls.forEach((c) => {
    const x = (c % s.cols) * CELL;
    const y = Math.floor(c / s.cols) * CELL;
    r(x, y, CELL, CELL, C.ink);
    r(x + 1, y, CELL - 2, CELL - 3, C.field);
    r(x + 1, y, CELL - 2, 1, C.wallHi);
    r(x + 1, y, 1, CELL - 3, C.wallHi);
    r(x + 1, y + CELL - 3, CELL - 2, 2, C.wallFront);
    r(x + 4, y + 4, 4, 1, C.wallFront);
  });

  // beds: sunken sockets
  s.beds.forEach(([bx, by], i) => {
    r(bx * CELL + 1, by * CELL + 1, 10, 10, C.bed);
    r(bx * CELL + 5, by * CELL + 5, 2, 2, PAINTS[i].dark);
  });

  // block shadows first, so no block's shadow falls on another block
  s.order.forEach((i) => {
    const b = s.pieces[i];
    r(b.x + 1, b.y + 1, b.w, b.h, C.shade);
  });

  // each bed is ringed in its block's colour, a ring that still frames a sleeper
  s.beds.forEach(([bx, by], i) => {
    const c = PAINTS[i].body;
    const x = bx * CELL;
    const y = by * CELL;
    for (let q = 0; q < CELL; q += 2) {
      r(x + q, y, 1, 1, c);
      r(x + q + 1, y + CELL - 1, 1, 1, c);
      r(x, y + q + 1, 1, 1, c);
      r(x + CELL - 1, y + q, 1, 1, c);
    }
  });

  // blocks
  s.order.forEach((i) => {
    const b = s.pieces[i];
    const p = PAINTS[i];
    const { x, y, w, h } = b;
    // ink ring with the corners knocked off
    r(x + 1, y, w - 2, h, C.ink);
    r(x, y + 1, w, h - 2, C.ink);
    r(x + 1, y + 1, w - 2, h - 2, p.body);
    r(x + 1, y + 1, w - 2, 1, p.light);
    r(x + 1, y + 1, 1, h - 3, p.light);
    r(x + 2, y + h - 2, w - 3, 1, p.dark);
    r(x + w - 2, y + 2, 1, h - 4, p.dark);
  });

  // overlaps: two blocks in one place, drawn as a checker of both
  for (let a = 0; a < s.pieces.length; a++)
    for (let b = a + 1; b < s.pieces.length; b++) {
      const A = s.pieces[a];
      const B = s.pieces[b];
      const x0 = Math.max(A.x, B.x) + 1;
      const y0 = Math.max(A.y, B.y) + 1;
      const x1 = Math.min(A.x + A.w, B.x + B.w) - 1;
      const y1 = Math.min(A.y + A.h, B.y + B.h) - 1;
      if (x1 <= x0 || y1 <= y0) continue;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) r(x, y, 1, 1, (x + y) % 2 ? PAINTS[a].body : PAINTS[b].body);
    }

  // faces on top of everything, so a block can still look out of an overlap.
  // Stand-in faces for this example: square eyes with a glint, a small mouth.
  s.order.forEach((i) => {
    const b = s.pieces[i];
    const cx = Math.round(b.x + b.w / 2) + b.lx;
    const cy = b.y + Math.round((b.h - 10) / 2) + b.ly;
    switch (b.eyes) {
      case "open":
        r(cx - 3, cy + 3, 2, 2, C.ink);
        r(cx + 1, cy + 3, 2, 2, C.ink);
        r(cx - 3, cy + 3, 1, 1, C.cream);
        r(cx + 1, cy + 3, 1, 1, C.cream);
        r(cx - 1, cy + 6, 2, 1, C.ink);
        break;
      case "blink":
        r(cx - 3, cy + 4, 2, 1, C.ink);
        r(cx + 1, cy + 4, 2, 1, C.ink);
        r(cx - 1, cy + 6, 2, 1, C.ink);
        break;
      case "shut":
        // asleep: two little arches
        r(cx - 4, cy + 5, 1, 1, C.ink);
        r(cx - 3, cy + 4, 1, 1, C.ink);
        r(cx - 2, cy + 5, 1, 1, C.ink);
        r(cx + 1, cy + 5, 1, 1, C.ink);
        r(cx + 2, cy + 4, 1, 1, C.ink);
        r(cx + 3, cy + 5, 1, 1, C.ink);
        break;
      case "shock":
        r(cx - 4, cy + 2, 2, 3, C.ink);
        r(cx + 2, cy + 2, 2, 3, C.ink);
        r(cx - 1, cy + 6, 2, 2, C.ink);
        break;
    }
  });

  // selection: four pixel brackets that tick outward
  if (s.showSel && s.sel >= 0) {
    const b = s.pieces[s.sel];
    const o = 1 + s.selPulse;
    const x0 = b.x - o;
    const y0 = b.y - o;
    const x1 = b.x + b.w + o - 1;
    const y1 = b.y + b.h + o - 1;
    for (const [px, py, sx, sy] of [
      [x0, y0, 1, 1],
      [x1, y0, -1, 1],
      [x0, y1, 1, -1],
      [x1, y1, -1, -1],
    ]) {
      r(px, py, 1, 1, C.cream);
      r(px + sx, py, 1, 1, C.cream);
      r(px + 2 * sx, py, 1, 1, C.cream);
      r(px, py + sy, 1, 1, C.cream);
      r(px, py + 2 * sy, 1, 1, C.cream);
    }
  }

  // particles: dust, sparks and z's
  for (const q of s.parts) {
    if (q.z) drawGlyph(r, SMALL.z, Math.round(q.x), Math.round(q.y), 1, q.c);
    else r(Math.round(q.x), Math.round(q.y), 1, 1, q.c);
  }

  // the win stamp
  if (s.banner > 0) {
    const word = "QUIET";
    const sc = 2;
    const gw = [...word].reduce((n, ch) => n + SMALL[ch].w + 1, -1) * sc;
    const full = 5 * sc + 8;
    const bh = Math.max(1, Math.round(full * Math.min(1.15, s.banner)));
    const by = Math.round(s.bannerY - bh / 2);
    r(0, by - 1, IW, bh + 2, C.field);
    r(0, by, IW, bh, C.ink);
    if (s.banner > 0.6) {
      let x = Math.round((IW - gw) / 2);
      const y = Math.round(s.bannerY - (5 * sc) / 2);
      for (const ch of word) {
        drawGlyph(r, SMALL[ch], x + 1, y + 1, sc, C.drop);
        drawGlyph(r, SMALL[ch], x, y, sc, C.cream);
        x += (SMALL[ch].w + 1) * sc;
      }
    }
  }
  g.restore();
}
