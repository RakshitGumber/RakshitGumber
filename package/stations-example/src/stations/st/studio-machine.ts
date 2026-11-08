// The machine, forked from src/d/spec/machine.ts for the Studio station.
// An isometric exploded view drawn in code. Plan coordinates (x, y) and
// height z project to the screen with a 30° iso. Each part is a group drawn
// in its own local z; exploding is a vertical translate, so most frames are
// transform-only. The spring, gear and leaders are regenerated because they
// change shape.
//
// Changes from Spec: there is no page scroll here, so the explode amount p
// may overshoot past 0 and 1 (a spring settling, a hand pulling past the
// stop), the callout copy no longer mentions scrolling, and every part can be
// replaced by a pixel-art sprite (see Sprite / MachineOpts.sprites).

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const R2 = Math.SQRT1_2;
const TAU = Math.PI * 2;

type Pt = [number, number];
const P = (x: number, y: number, z: number): Pt => [(x - y) * C, (x + y) * S - z];
const q = (v: number) => (Math.round(v * 100) / 100).toString();
const poly = (a: Pt[], close = true) => "M" + a.map(([x, y]) => q(x) + " " + q(y)).join("L") + (close ? "Z" : "");
const rxOf = (r: number) => r * Math.SQRT2 * C;
const ryOf = (r: number) => r * Math.SQRT2 * S;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const NS = "http://www.w3.org/2000/svg";

const path = (d: string, cls: string) => `<path class="${cls}" d="${d}" pathLength="1"/>`;

// Plan-rectangle prism. Visible faces: top, +y (front-left), +x (front-right).
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const top = poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]);
  const left = poly([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)]);
  const right = poly([P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)]);
  return path(left, "fl") + path(right, "fr") + path(top, "ft");
}

// Upright cylinder standing on z0.
function cyl(cx: number, cy: number, z0: number, h: number, r: number, topCls = "ft") {
  const [ex, ey] = P(cx, cy, z0);
  const rx = rxOf(r);
  const ry = ryOf(r);
  const body = `M${q(ex - rx)} ${q(ey - h)}L${q(ex - rx)} ${q(ey)}A${q(rx)} ${q(ry)} 0 0 0 ${q(ex + rx)} ${q(ey)}L${q(ex + rx)} ${q(ey - h)}Z`;
  return path(body, "fr") + `<ellipse class="${topCls}" cx="${q(ex)}" cy="${q(ey - h)}" rx="${q(rx)}" ry="${q(ry)}" pathLength="1"/>`;
}

// A round hole cut down into a top face, showing its back wall.
function hole(cx: number, cy: number, z: number, r: number, depth: number) {
  const [ex, ey] = P(cx, cy, z);
  const rx = rxOf(r);
  const ry = ryOf(r);
  let s = `<ellipse class="fl" cx="${q(ex)}" cy="${q(ey)}" rx="${q(rx)}" ry="${q(ry)}" pathLength="1"/>`;
  const h2 = depth / 2;
  if (h2 < ry) {
    const yi = ey + h2;
    const xi = rx * Math.sqrt(1 - (h2 / ry) ** 2);
    const lens = `M${q(ex - xi)} ${q(yi)}A${q(rx)} ${q(ry)} 0 0 1 ${q(ex + xi)} ${q(yi)}A${q(rx)} ${q(ry)} 0 0 1 ${q(ex - xi)} ${q(yi)}Z`;
    s += path(lens, "fdeep");
  }
  return s;
}

// Extrude a plan polygon (counter-clockwise) from z0 by h.
function prism(pts: Pt[], z0: number, h: number) {
  const quads: { k: number; s: string }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const nx = b[1] - a[1];
    const ny = -(b[0] - a[0]);
    if (nx + ny <= 0) continue;
    const d = poly([P(a[0], a[1], z0 + h), P(b[0], b[1], z0 + h), P(b[0], b[1], z0), P(a[0], a[1], z0)]);
    quads.push({ k: a[0] + a[1] + b[0] + b[1], s: path(d, nx > ny ? "fr" : "fl") });
  }
  quads.sort((m, n) => m.k - n.k);
  const top = poly(pts.map(([x, y]) => P(x, y, z0 + h)));
  return quads.map((t) => t.s).join("") + path(top, "ft");
}

// Shaft segment rising from a top face, open at the top (covered by the next part).
function shaft(z0: number, len: number, r = 6) {
  const rx = rxOf(r);
  const ry = ryOf(r);
  const yb = -z0;
  const yt = -z0 - len;
  const fill = `M${q(-rx)} ${q(yt)}L${q(-rx)} ${q(yb)}A${q(rx)} ${q(ry)} 0 0 0 ${q(rx)} ${q(yb)}L${q(rx)} ${q(yt)}Z`;
  const edge = `M${q(-rx)} ${q(yt)}L${q(-rx)} ${q(yb)}A${q(rx)} ${q(ry)} 0 0 0 ${q(rx)} ${q(yb)}L${q(rx)} ${q(yt)}`;
  return `<path class="shf" d="${fill}"/><path class="ln" d="${edge}" pathLength="1"/><path class="cl" d="M0 ${q(yb + ry)}L0 ${q(yt)}"/>`;
}

// ---------------------------------------------------------------- parts

const BASE = { a: 72, h: 24, top: 28 };
const GEAR = { Ro: 64, Rr: 55.5, n: 16, h: 10, top: 14 };
const SPRING = { Rc: 29, turns: 5, wire: 4.2, Hc: 22, He: 64, washer: 38 };
const KEYS = { a: 58, h: 13, top: 17 };
const TILE = { a: 50, h: 16 };
const GHOST_U = 4.6;
// A stand-in creature (a slime with a sprout), not his ghost. o = eyes and
// mouth; the top row of eyes (row 6) is what the blink covers.
const GHOST = [
  "......##....",
  ".....##.....",
  ".....#......",
  "...######...",
  "..########..",
  ".##########.",
  ".###o##o###.",
  "####o##o####",
  "############",
  "####o##o####",
  "#####oo#####",
  "############",
  "############",
  ".##########.",
];
const GHOST_H = GHOST.length * GHOST_U;

function drawBase(tail: number) {
  const { a, h } = BASE;
  let s = `<path class="cl" d="M0 0L0 ${a + tail}"/>`;
  s += box(-a, a, -a, a, 0, h);
  // cartridge slot on the front-right face
  s += path(poly([P(a, -40, 15), P(a, -6, 15), P(a, -6, 9), P(a, -40, 9)]), "fdeep");
  // vents on the front-left face
  for (let i = 0; i < 5; i++) {
    const x = -52 + i * 9;
    s += `<path class="ln thin" d="${poly([P(x, a, 17), P(x, a, 7)], false)}" pathLength="1"/>`;
  }
  // screws
  for (const [x, y] of [[-60, -60], [60, -60], [60, 60], [-60, 60]] as Pt[]) {
    const [ex, ey] = P(x, y, h);
    s += `<ellipse class="ft" cx="${q(ex)}" cy="${q(ey)}" rx="${q(rxOf(4))}" ry="${q(ryOf(4))}" pathLength="1"/>`;
    s += `<path class="ln thin" d="${poly([P(x - 3, y + 3, h), P(x + 3, y - 3, h)], false)}" pathLength="1"/>`;
  }
  // d-pad: two crossing bars, back bar first
  const dx = -14;
  const dy = 40;
  s += box(dx - 6, dx + 6, dy - 20, dy + 20, h, h + 4);
  s += box(dx - 20, dx + 20, dy - 6, dy + 6, h, h + 4);
  s += path(poly([P(dx - 6, dy - 6, h + 4), P(dx + 6, dy - 6, h + 4), P(dx + 6, dy + 6, h + 4), P(dx - 6, dy + 6, h + 4)]), "ft");
  // two buttons
  s += cyl(30, -22, h, 4, 7);
  s += cyl(46, -6, h, 4, 7);
  // collar
  s += cyl(0, 0, h, 4, 13);
  return s;
}

function gearPoly(phi: number): Pt[] {
  const { Ro, Rr, n } = GEAR;
  const p = TAU / n;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = phi + i * p;
    for (const [r, o] of [[Rr, -0.27], [Ro, -0.15], [Ro, 0.15], [Rr, 0.27]] as Pt[]) {
      pts.push([r * Math.cos(a + o * p), r * Math.sin(a + o * p)]);
    }
  }
  return pts;
}

function drawGear(phi: number) {
  const { h } = GEAR;
  let s = prism(gearPoly(phi), 0, h);
  const holes = Array.from({ length: 5 }, (_, k) => phi * 1 + (k * TAU) / 5 + 0.3)
    .map((a) => [36 * Math.cos(a), 36 * Math.sin(a)] as Pt)
    .sort((m, n) => m[0] + m[1] - (n[0] + n[1]));
  for (const [x, y] of holes) s += hole(x, y, h, 9.5, h);
  // a keyway mark on the hub so rotation reads clearly
  s += cyl(0, 0, h, 4, 15);
  const ka = phi + 0.3;
  s += `<path class="ln" d="${poly([P(9 * Math.cos(ka), 9 * Math.sin(ka), h + 4), P(15 * Math.cos(ka), 15 * Math.sin(ka), h + 4)], false)}"/>`;
  return s;
}

function springPaths(H: number) {
  const { Rc, turns } = SPRING;
  const steps = turns * 40;
  const back: Pt[][] = [];
  const front: Pt[][] = [];
  let run: Pt[] = [];
  let runFront: boolean | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const th = t * turns * TAU + Math.PI * 0.25;
    const x = Rc * Math.cos(th);
    const y = Rc * Math.sin(th);
    const pt = P(x, y, 4 + SPRING.wire / 2 + t * (H - SPRING.wire));
    const isFront = x + y > 0;
    if (runFront === null) runFront = isFront;
    if (isFront !== runFront) {
      run.push(pt);
      (runFront ? front : back).push(run);
      run = [pt];
      runFront = isFront;
    } else run.push(pt);
  }
  (runFront ? front : back).push(run);
  const d = (rs: Pt[][]) => rs.map((r) => poly(r, false)).join("");
  return { back: d(back), front: d(front) };
}

function drawSpring(H: number, sw: number) {
  const { back, front } = springPaths(H);
  const w = SPRING.wire;
  const inner = Math.max(0.6, w - sw * 2);
  let s = cyl(0, 0, 0, 4, SPRING.washer);
  s += `<ellipse class="fdeep" cx="0" cy="-4" rx="${q(rxOf(7))}" ry="${q(ryOf(7))}"/>`;
  s += `<path class="wire-bo" stroke-width="${q(w)}" d="${back}"/><path class="wire-bi" stroke-width="${q(inner)}" d="${back}"/>`;
  s += shaft(4, H + 2);
  s += `<path class="wire-fo" stroke-width="${q(w)}" d="${front}"/><path class="wire-fi" stroke-width="${q(inner)}" d="${front}"/>`;
  s += `<g transform="translate(0 ${q(-(4 + H))})">${cyl(0, 0, 0, 4, SPRING.washer)}</g>`;
  return s;
}

function drawKeys() {
  const { a, h } = KEYS;
  let s = box(-a, a, -a, a, 0, h);
  const cs = [-31, 0, 31];
  const keys: Pt[] = [];
  for (const x of cs) for (const y of cs) if (x || y) keys.push([x, y]);
  keys.sort((m, n) => m[0] + m[1] - (n[0] + n[1]));
  for (const [x, y] of keys) {
    // keys behind the collar go first, the rest after it
    if (x + y > 0) continue;
    s += box(x - 11, x + 11, y - 11, y + 11, h, h + 4);
  }
  s += cyl(0, 0, h, 4, 10);
  for (const [x, y] of keys) {
    if (x + y <= 0) continue;
    s += box(x - 11, x + 11, y - 11, y + 11, h, h + 4);
  }
  return s;
}

function drawTile() {
  const { a, h } = TILE;
  let s = box(-a, a, -a, a, 0, h);
  const step = (a * 2) / 5;
  for (let i = 1; i < 5; i++) {
    const v = -a + i * step;
    s += `<path class="hair" d="${poly([P(v, -a, h), P(v, a, h)], false)}"/>`;
    s += `<path class="hair" d="${poly([P(-a, v, h), P(a, v, h)], false)}"/>`;
  }
  // the sprite's shadow on the tile
  s += `<ellipse class="shadow" cx="0" cy="${q(-h)}" rx="${q(rxOf(19))}" ry="${q(ryOf(19))}"/>`;
  // the creature, a billboard standing on the tile, in ink pixels
  const u = GHOST_U;
  const w = GHOST[0].length * u;
  const x0 = -w / 2;
  const yBase = -h + ryOf(4);
  let body = "";
  let eyes = "";
  let eyesShut = "";
  GHOST.forEach((row, r) => {
    const y = yBase - (GHOST.length - r) * u;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const rect = `M${q(x0 + c * u)} ${q(y)}h${q(u)}v${q(u)}h${q(-u)}Z`;
      if (ch === "#") body += rect;
      else if (ch === "o") {
        eyes += rect;
        if (r === 6) eyesShut += rect;
      }
    }
  });
  s += `<g class="ghost"><path class="px" d="${body}"/><path class="px-eye" d="${eyes}"/><path class="px blink" d="${eyesShut}"/></g>`;
  return s;
}

// ---------------------------------------------------------------- labels

type Side = -1 | 1;
type Label = {
  key: string;
  side: Side;
  gap: number; // which gap's opening reveals it
  name: string;
  note: { phone: string[]; desk: string[] };
};

const LABELS: Label[] = [
  { key: "op", side: -1, gap: 4, name: "Operator", note: { phone: ["Jagrit, played", "by a stand-in."], desk: ["Jagrit, played by a stand-in."] } },
  { key: "tile", side: 1, gap: 3, name: "Pixel art", note: { phone: ["A slime on a tile.", "Never leaving it."], desk: ["A slime, standing on a tile.", "I am never leaving this part."] } },
  { key: "keys", side: -1, gap: 2, name: "TypeScript", note: { phone: ["Key plate."], desk: ["Key plate. The part you touch."] } },
  { key: "spring", side: -1, gap: 2, name: "Python", note: { phone: ["Coil spring."], desk: ["Coil spring. Gives under load."] } },
  { key: "gear", side: -1, gap: 1, name: "Rust", note: { phone: ["Spur gear."], desk: ["Spur gear. Turns as it opens."] } },
  { key: "base", side: 1, gap: 0, name: "Game development", note: { phone: ["The chassis.", "Everything sits on it."], desk: ["The chassis.", "Everything else sits on it."] } },
];

const CORE = { name: "Core", note: "Turning into a better learner every day." };

export type PartKey = "base" | "gear" | "spring" | "keys" | "tile";

/**
 * A pixel-art stand-in for one drawn part. The image is shown at a whole-number
 * scale (whatever integer brings it closest to the drawn part's width) and
 * placed so that its pixel (ax, ay) sits where the shaft meets the part's
 * underside. The vector part is hidden; its callout stays.
 */
export type Sprite = { src: string; w: number; h: number; ax: number; ay: number };

export type MachineOpts = {
  svg: SVGSVGElement;
  op: HTMLImageElement;
  /**
   * Pixel art for the parts, when he draws it. Any part left out stays drawn.
   * e.g. sprites: { gear: { src: "/art/gear.png", w: 48, h: 32, ax: 24, ay: 26 } }
   */
  sprites?: Partial<Record<PartKey, Sprite>>;
};

export type LayoutOpts = {
  /** Operator frame size in px (keep a whole multiple of the 64 px art). */
  opPx: number;
  /** Room kept free on each side of the axis for callouts, px. */
  labelRoom: number;
  /** Callouts never come closer than this to the drawing's edge, px. */
  gutter: number;
};

// Drawn width of each part in units, for sizing sprites.
const PART_W: Record<PartKey, number> = {
  base: 4 * BASE.a * C,
  gear: 2 * Math.SQRT2 * C * GEAR.Ro,
  spring: 2 * Math.SQRT2 * C * SPRING.washer,
  keys: 4 * KEYS.a * C,
  tile: 4 * TILE.a * C,
};

export function createMachine({ svg, op, sprites = {} }: MachineOpts) {
  let s = 1; // px per unit
  let zoomA = 1;
  let W = 0;
  let H = 0;
  let phone = true;
  let opPx = 128;
  let colX = 150;
  let coreY = 30;
  let sw = 1;
  let fsName = 14;
  let fsNote = 12;
  let gutter = 16;
  let widths: Record<string, number> = {};
  let last = -1;

  // Pixel-art stand-ins, laid over the drawing at whole-pixel scales.
  const spriteKeys = (Object.keys(sprites) as PartKey[]).filter((k) => sprites[k]);
  const spriteImgs: Partial<Record<PartKey, HTMLImageElement>> = {};
  const host = svg.parentElement;
  for (const k of spriteKeys) {
    const sp = sprites[k]!;
    const img = document.createElement("img");
    img.className = `part-sprite part-sprite-${k}`;
    img.src = sp.src;
    img.alt = "";
    img.decoding = "async";
    img.width = sp.w;
    img.height = sp.h;
    img.style.cssText = "position:absolute;left:0;top:0;image-rendering:pixelated;pointer-events:none;max-width:none;transform-origin:0 0";
    host?.insertBefore(img, op);
    spriteImgs[k] = img;
  }

  const g = (cls: string) => {
    const el = document.createElementNS(NS, "g");
    el.setAttribute("class", cls);
    return el;
  };

  let root: SVGGElement;
  let L: Record<string, SVGGElement> = {};
  let shafts: Record<string, SVGGElement> = {};
  let proj: SVGPathElement;
  let frame: SVGPathElement;
  let labels: Record<string, { g: SVGGElement; lead: SVGPathElement; dot: SVGCircleElement; text: SVGGElement; texts: SVGTextElement[] }> = {};
  let brace: { g: SVGGElement; p: SVGPathElement; t: SVGGElement };
  let core: SVGGElement;

  function build() {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `${q(-W / 2 / s)} ${q(-H / 2 / s)} ${q(W / s)} ${q(H / s)}`);
    svg.style.setProperty("--sw", q(sw));
    svg.style.setProperty("--sw2", q(sw * 0.62));
    svg.style.setProperty("--u", q(1 / s));

    root = g("root");
    svg.appendChild(root);
    L = {};
    shafts = {};
    const order = ["base", "gear", "spring", "keys", "tile"];
    order.forEach((k, i) => {
      const lg = g(`part part-${k}${sprites[k as PartKey] ? " sprited" : ""}`);
      lg.style.setProperty("--i", String(i));
      root.appendChild(lg);
      L[k] = lg;
      const body = g("body");
      lg.appendChild(body);
      if (k === "base") body.innerHTML = drawBase(coreY);
      if (k === "keys") body.innerHTML = drawKeys();
      if (k === "tile") body.innerHTML = drawTile();
      if (k !== "tile" && k !== "spring") {
        const sh = g("shaft");
        lg.appendChild(sh);
        shafts[k] = sh;
      }
    });
    // spring keeps its own shaft between the coils; its outgoing shaft goes on top
    const ssh = g("shaft");
    L.spring.appendChild(ssh);
    shafts.spring = ssh;

    proj = document.createElementNS(NS, "path");
    proj.setAttribute("class", "proj");
    root.appendChild(proj);

    const og = g("part part-op");
    og.style.setProperty("--i", "5");
    frame = document.createElementNS(NS, "path");
    frame.setAttribute("class", "frame");
    frame.setAttribute("pathLength", "1");
    og.appendChild(frame);
    root.appendChild(og);
    L.op = og;

    // labels
    labels = {};
    const lg = g("labels");
    svg.appendChild(lg);
    for (const lb of LABELS) {
      const cg = g(`callout callout-${lb.key}`);
      const lead = document.createElementNS(NS, "path");
      lead.setAttribute("class", "ldr");
      lead.setAttribute("pathLength", "1");
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "anchor");
      dot.setAttribute("r", q(2.6 / s));
      const tg = g("ctext");
      const texts: SVGTextElement[] = [];
      const lines = phone ? lb.note.phone : lb.note.desk;
      const nameEl = document.createElementNS(NS, "text");
      nameEl.setAttribute("class", "cname");
      nameEl.textContent = lb.name;
      nameEl.setAttribute("y", q(-fsName * 0.42));
      texts.push(nameEl);
      lines.forEach((line, i) => {
        const t = document.createElementNS(NS, "text");
        t.setAttribute("class", "cnote");
        t.textContent = line;
        t.setAttribute("y", q(fsNote * 1.25 + i * fsNote * 1.22));
        texts.push(t);
      });
      texts.forEach((t) => {
        t.setAttribute("text-anchor", lb.side < 0 ? "end" : "start");
        tg.appendChild(t);
      });
      cg.append(lead, dot, tg);
      lg.appendChild(cg);
      labels[lb.key] = { g: cg, lead, dot, text: tg, texts };
    }
    // brace grouping the three languages
    const bg = g("callout callout-brace");
    const bp = document.createElementNS(NS, "path");
    bp.setAttribute("class", "ldr");
    bp.setAttribute("pathLength", "1");
    const bt = g("ctext");
    const bLines = phone ? ["Obsessed", "with all three."] : ["Obsessed with", "all three."];
    bLines.forEach((line, i) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("class", "cname");
      t.textContent = line;
      t.setAttribute("y", q(i * fsName * 1.12 - fsName * 0.2));
      bt.appendChild(t);
    });
    bg.append(bp, bt);
    lg.appendChild(bg);
    brace = { g: bg, p: bp, t: bt };

    // core caption, centred on the axis below the chassis
    core = g("callout core");
    const cn = document.createElementNS(NS, "text");
    cn.setAttribute("class", "cname core-name");
    cn.setAttribute("text-anchor", "middle");
    cn.textContent = CORE.name;
    const cnote = document.createElementNS(NS, "text");
    cnote.setAttribute("class", "cnote core-note");
    cnote.setAttribute("text-anchor", "middle");
    cnote.textContent = CORE.note;
    cn.setAttribute("y", q(fsName * 1.05));
    cnote.setAttribute("y", q(fsName * 1.05 + fsNote * 1.35));
    const node = document.createElementNS(NS, "circle");
    node.setAttribute("class", "anchor");
    node.setAttribute("r", q(2.6 / s));
    core.append(node, cn, cnote);
    svg.appendChild(core);

    svg.style.setProperty("--fs-name", q(fsName));
    svg.style.setProperty("--fs-note", q(fsNote));
    measure();
    last = -1;
  }

  function measure() {
    widths = {};
    for (const lb of LABELS) {
      const l = labels[lb.key];
      let w = 0;
      for (const t of l.texts) {
        let tw = 0;
        try {
          tw = t.getComputedTextLength();
        } catch {
          tw = 0;
        }
        if (!tw) tw = (t.textContent || "").length * (t.classList.contains("cname") ? fsName : fsNote) * 0.46;
        w = Math.max(w, tw);
      }
      widths[lb.key] = w;
    }
  }

  // Natural (exploded) extents in units, excluding the operator frame.
  const GAPS = [62, 54, 50, 58, 30];
  const EXPLODED = BASE.top + GAPS[0] + GEAR.top + GAPS[1] + 8 + SPRING.He + GAPS[2] + KEYS.top + GAPS[3] + TILE.h + GHOST_H + 12 + GAPS[4];

  function layout(w: number, h: number, isPhone: boolean, o: LayoutOpts) {
    W = w;
    H = h;
    phone = isPhone;
    fsName = 0; // set after s
    opPx = o.opPx;
    gutter = o.gutter;
    const labelRoom = o.labelRoom;
    coreY = isPhone ? 66 : 30;
    const below = BASE.a + coreY - 4; // base front corner and centreline tail
    const capPx = isPhone ? 58 : 50;
    const sH = (h - opPx - capPx - (isPhone ? 8 : 20)) / (EXPLODED + below);
    const sW = (w / 2 - labelRoom) / (BASE.a * 2 * C + 14);
    s = Math.max(0.35, Math.min(sH, sW, 1.15));
    sw = 1.25 / s;
    fsName = (isPhone ? 13.5 : 16.5) / s;
    fsNote = (isPhone ? 12 : 14) / s;
    colX = BASE.a * 2 * C + 16 / s;
    zoomA = Math.min(1.6, (w / 2 - 20) / ((BASE.a * 2 * C + 4) * s));
    op.style.width = op.style.height = opPx + "px";
    build();
  }

  function update(p: number, force = false) {
    if (!force && Math.abs(p - last) < 1e-5) return;
    last = p;
    const t = clamp(p / 0.84);
    // gaps open top-down, like taking it apart
    const E = [0, 1, 2, 3, 4].map((k) => smooth(clamp((t - (4 - k) * 0.11) / 0.56)));
    // Past the stops: pulled beyond open, every gap stretches a little more;
    // pushed beyond shut, the spring takes the load and the stack sinks.
    const over = Math.max(0, p - 1);
    const under = Math.max(0, -p);
    const G = GAPS.map((g, k) => g * (E[k] + over * 0.9));
    const Hs = Math.max(SPRING.wire * 2.6, lerp(SPRING.Hc, SPRING.He, E[2]) + over * 30 - under * 34);
    const zGear = BASE.top + G[0];
    const zSpring = zGear + GEAR.top + G[1];
    const zKeys = zSpring + 8 + Hs + G[2];
    const zTile = zKeys + KEYS.top + G[3];
    const zOp = zTile + TILE.h + GHOST_H + 12 + G[4];
    const zoom = lerp(zoomA, 1, smooth(clamp(t / 0.9)));
    const fpx = opPx;
    const fu = fpx / (s * zoom);

    const top = -(zOp + fu);
    const bottom = BASE.a + coreY + ((fsName * 1.05 + fsNote * 1.6) / zoom) * E[0];
    const ty = (-(top + bottom) / 2) * zoom;
    root.setAttribute("transform", `translate(0 ${q(ty)}) scale(${q(zoom)})`);
    // keep line weight constant while the camera pulls back
    root.style.setProperty("--sw", q(sw / zoom));
    root.style.setProperty("--sw2", q((sw * 0.62) / zoom));

    const z: Record<string, number> = { base: 0, gear: zGear, spring: zSpring, keys: zKeys, tile: zTile, op: zOp };
    for (const k in z) L[k].setAttribute("transform", `translate(0 ${q(-z[k])})`);

    // parts that change shape
    if (!sprites.gear) (L.gear.firstElementChild as SVGGElement).innerHTML = drawGear((t + over - under) * Math.PI * 0.9);
    if (!sprites.spring) (L.spring.firstElementChild as SVGGElement).innerHTML = drawSpring(Hs, sw);

    shafts.base.innerHTML = shaft(BASE.top, zGear - BASE.top + 5);
    shafts.gear.innerHTML = shaft(GEAR.top, zSpring - zGear - GEAR.top + 5);
    shafts.spring.innerHTML = shaft(8 + Hs, zKeys - zSpring - 8 - Hs + 5);
    shafts.keys.innerHTML = shaft(KEYS.top, zTile - zKeys - KEYS.top + 6);

    // operator frame and its projection lines down to the tile
    const fw = fu;
    frame.setAttribute("d", `M${q(-fw / 2)} 0H${q(fw / 2)}V${q(-fu)}H${q(-fw / 2)}Z`);
    const tl = P(-TILE.a, TILE.a, TILE.h);
    const tr = P(TILE.a, -TILE.a, TILE.h);
    const tb = P(-TILE.a, -TILE.a, TILE.h);
    proj.setAttribute(
      "d",
      `M${q(tl[0])} ${q(tl[1] - zTile)}L${q(-fw / 2)} ${q(-zOp)}M${q(tr[0])} ${q(tr[1] - zTile)}L${q(fw / 2)} ${q(-zOp)}M${q(tb[0])} ${q(tb[1] - zTile)}L0 ${q(-zOp)}`,
    );

    // portrait: whole-pixel position over the frame
    const dpr = window.devicePixelRatio || 1;
    const cx = W / 2;
    const cyPx = H / 2 + s * (ty + zoom * (-zOp - fu / 2));
    const px = Math.round((cx - opPx / 2) * dpr) / dpr;
    const py = Math.round((cyPx - opPx / 2) * dpr) / dpr;
    op.style.transform = `translate3d(${px}px, ${py}px, 0)`;

    // sprites: an integer scale near the drawn width, the anchor pixel on the axis
    for (const k of spriteKeys) {
      const sp = sprites[k]!;
      const img = spriteImgs[k]!;
      const k2 = Math.max(1, Math.round((PART_W[k] * s * zoom) / sp.w));
      const ay = H / 2 + s * (ty + zoom * -z[k]);
      const sx = Math.round((cx - sp.ax * k2) * dpr) / dpr;
      const sy = Math.round((ay - sp.ay * k2) * dpr) / dpr;
      img.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${k2})`;
    }

    // callouts
    const anchors: Record<string, Pt> = {
      op: [-fw / 2, -zOp - fu * 0.5],
      tile: add(P(TILE.a, -TILE.a, TILE.h * 0.5), -zTile),
      keys: add(P(-KEYS.a, KEYS.a, KEYS.h * 0.5), -zKeys),
      spring: add(P(-SPRING.Rc * R2, SPRING.Rc * R2, 4 + Hs * 0.5), -zSpring),
      gear: add(P(-GEAR.Ro * R2, GEAR.Ro * R2, GEAR.h * 0.5), -zGear),
      // on a phone the chassis label tucks under the right face; there is no room beside it
      base: phone ? P(BASE.a, 6, BASE.h * 0.5) : P(BASE.a, -BASE.a, BASE.h * 0.5),
    };
    // labels live outside the zoomed group so their type and column stay put
    const M = (u: Pt): Pt => [zoom * u[0], ty + zoom * u[1]];
    const lift = 16 / s;
    for (const lb of LABELS) {
      const l = labels[lb.key];
      const r = clamp((E[lb.gap] - 0.42) / 0.42);
      const [ax, ay] = M(anchors[lb.key]);
      const ly = phone && lb.key === "base" ? ay + 30 * zoom : ay - lift;
      // hug the part, but never past the gutter
      const edge = (W / 2 - gutter) / s - widths[lb.key] - 6 / s;
      const kx = lb.side * Math.min(edge, Math.max(colX, Math.abs(ax) + 22 / s));
      const ex = kx + lb.side * (widths[lb.key] + 4 / s);
      l.lead.setAttribute("d", `M${q(ax)} ${q(ay)}L${q(kx)} ${q(ly)}L${q(ex)} ${q(ly)}`);
      l.lead.style.strokeDashoffset = q(1 - r);
      l.dot.setAttribute("cx", q(ax));
      l.dot.setAttribute("cy", q(ay));
      l.dot.style.opacity = r > 0 ? "1" : "0";
      l.text.setAttribute("transform", `translate(${q(kx + lb.side * (2 / s) + lb.side * (1 - r) * -8 / s)} ${q(ly)})`);
      l.text.style.opacity = q(clamp(r * 1.8 - 0.6));
    }
    // brace from the gear to the key plate, right side
    {
      const r = clamp((E[1] - 0.42) / 0.42);
      const y1 = M([0, P(GEAR.Ro * R2, -GEAR.Ro * R2, 0)[1] - zGear])[1];
      const y2 = M([0, P(KEYS.a, -KEYS.a, KEYS.h)[1] - zKeys])[1];
      const x = Math.max(colX, zoom * KEYS.a * 2 * C + 16 / s);
      const d = 7 / s;
      const ym = (y1 + y2) / 2;
      const bd = `M${q(x)} ${q(y1)}Q${q(x + d)} ${q(y1)} ${q(x + d)} ${q(y1 - d)}L${q(x + d)} ${q(ym + d)}Q${q(x + d)} ${q(ym)} ${q(x + 2 * d)} ${q(ym)}Q${q(x + d)} ${q(ym)} ${q(x + d)} ${q(ym - d)}L${q(x + d)} ${q(y2 + d)}Q${q(x + d)} ${q(y2)} ${q(x)} ${q(y2)}`;
      brace.p.setAttribute("d", bd);
      brace.p.style.strokeDashoffset = q(1 - r);
      brace.t.setAttribute("transform", `translate(${q(x + 2 * d + 6 / s)} ${q(ym)})`);
      brace.t.style.opacity = q(clamp(r * 1.8 - 0.6));
    }
    {
      const r = clamp((E[0] - 0.5) / 0.4);
      core.setAttribute("transform", `translate(0 ${q(M([0, BASE.a + coreY])[1])})`);
      core.style.opacity = q(r);
    }
    return E;
  }

  function add(p: Pt, dy: number): Pt {
    return [p[0], p[1] + dy];
  }

  function setBlink(on: boolean) {
    svg.classList.toggle("blinking", on);
  }

  return {
    layout,
    update,
    remeasure() {
      measure();
      update(last < 0 ? 0 : last, true);
    },
    setBlink,
  };
}
