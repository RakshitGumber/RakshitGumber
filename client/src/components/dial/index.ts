import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/hanken-grotesk";
import { bindPageScroll, pageLenis, scrollPageBy, scrollPageTo, unbindPageScroll } from "@/lib/pageScroll";
import "./shell.css";
import type { Handle, Station } from "./types";

export type { Handle, Station, Meta, Ctx } from "./types";

export type MountOptions = {
  /** Screen-reader title for the page. */
  title: string;
  /** Stations on the dial, in order. */
  stations: Station[];
};

const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);

/* ------------------------------------------------------------------ utils */

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c: number[], a = 1) => (a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
/** Relative luminance — used to pick black/white with the most contrast. */
const luma = (c: number[]) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
/** Softly crossfades to black on light grounds and white on dark grounds. */
const contrastOf = (c: number[]) => mix([255, 255, 255], [0, 0, 0], smooth(0.42, 0.58, luma(c)));

/* ------------------------------------------------------------------ mount */

// If the page remounts the design (hot reload, say), the outgoing instance leaves
// its dial position here so the next one tunes on from it instead of rebooting.
let carry: { p: number; at: number; interacted: boolean } | null = null;

export function mount(root: HTMLElement, opts: MountOptions) {
  const MODS = opts.stations;
  if (!MODS.length) throw new Error("stations: need at least one station");

  const STATIONS = MODS.map((m) => m.meta);
  const LAST = STATIONS.length - 1;
  const RGB = STATIONS.map((s) => ({ field: hex(s.field), ink: hex(s.ink) }));

  root.classList.add("d-stations");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let rm = reduce.matches;

  root.innerHTML = `
  <div class="t">
    <h1 class="sr">${esc(opts.title)}</h1>
    <main class="stage">${STATIONS.map((s, i) => `<section class="st st-${s.id}" data-i="${i}" aria-label="${esc(s.label)}"></section>`).join("")}<canvas class="noise" aria-hidden="true"></canvas></main>
    <div class="deck">
      <div class="edge-seam" aria-hidden="true"></div>
      <div class="edge-wrap" aria-hidden="true">
        <canvas class="edge"></canvas>
      </div>
      <div class="channel" aria-hidden="true" style="--spin:45deg">
        <svg class="channel-svg" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id="channel-glow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop class="channel-glow-a" offset="0%" />
              <stop class="channel-glow-b" offset="100%" />
            </linearGradient>
            <pattern id="channel-benday" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="2.4" fill="#fff" fill-opacity="0.12" />
            </pattern>
            <linearGradient id="channel-dot-fade" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#fff" />
              <stop offset="18%" stop-color="#ddd" />
              <stop offset="42%" stop-color="#444" />
              <stop offset="68%" stop-color="#000" />
              <stop offset="100%" stop-color="#000" />
            </linearGradient>
            <mask id="channel-dot-mask">
              <rect width="200" height="200" fill="url(#channel-dot-fade)" />
            </mask>
          </defs>
          <path class="channel-ring-path" />
          <path class="channel-face-path" />
          <path class="channel-dots-path" mask="url(#channel-dot-mask)" />
        </svg>
        <span class="channel-num"></span>
      </div>
      <div class="drum" role="slider" tabindex="0" aria-label="Tuning dial" aria-valuemin="1" aria-valuemax="${STATIONS.length}">
        <canvas aria-hidden="true"></canvas>
      </div>
    </div>
    <p class="sr" aria-live="polite"></p>
  </div>`;

  const $ = <T extends Element>(s: string) => root.querySelector(s) as T;
  const t = $<HTMLDivElement>(".t");
  const stage = $<HTMLElement>(".stage");
  const secs = [...root.querySelectorAll<HTMLElement>(".st")];
  // filled once the stations have mounted: their headline shivers under static
  let bigs: (HTMLElement | null)[] = [];
  const noise = $<HTMLCanvasElement>(".noise");
  const edgeWrap = $<HTMLDivElement>(".edge-wrap");
  const edge = $<HTMLCanvasElement>(".edge");
  const drum = $<HTMLDivElement>(".drum");
  const drumCv = drum.querySelector("canvas")!;
  const channel = $<HTMLDivElement>(".channel");
  const channelEl = $<HTMLSpanElement>(".channel-num");
  const channelGlowA = $<SVGStopElement>(".channel-glow-a");
  const channelGlowB = $<SVGStopElement>(".channel-glow-b");
  const channelRingPath = $<SVGPathElement>(".channel-ring-path");
  const channelFacePath = $<SVGPathElement>(".channel-face-path");
  const channelDotsPath = $<SVGPathElement>(".channel-dots-path");
  const live = $<HTMLParagraphElement>("[aria-live]");
  const channelOf = (i: number) => String(Math.round(i) + 1).padStart(2, "0");

  /* Regular pointy-top hexagon — equal radius on every corner. */
  const regularHexPath = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      return `${i ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
    }).join("") + "Z";
  const paintChannelShape = () => {
    const face = regularHexPath(100, 100, 80);
    channelRingPath.setAttribute("d", regularHexPath(100, 100, 92));
    channelFacePath.setAttribute("d", face);
    channelDotsPath.setAttribute("d", face);
  };
  const CHANNEL_SPIN_BASE = 45;
  let channelSpin = CHANNEL_SPIN_BASE;
  const paintChannelBadge = (i: number) => {
    const [a, b] = STATIONS[i].glow;
    channelGlowA.setAttribute("stop-color", a);
    channelGlowB.setAttribute("stop-color", b);
  };
  /** Land the hex on one of 6 equal stops — one stop per station — from a 45° base. */
  const spinChannelTo = (i: number) => {
    const n = STATIONS.length;
    const step = 360 / n;
    const desired = (CHANNEL_SPIN_BASE + (((i % n) + n) % n) * step) % 360;
    const current = ((channelSpin % 360) + 360) % 360;
    let delta = desired - current;
    if (delta > 180) delta -= 360;
    if (delta <= -180) delta += 360;
    channelSpin += delta;
    channel.style.setProperty("--spin", `${channelSpin}deg`);
  };
  const nctx = noise.getContext("2d")!;
  const ectx = edge.getContext("2d")!;
  const dctx = drumCv.getContext("2d")!;

  /* ---- page chrome: background + theme colour, restored on cleanup ---- */
  const html = document.documentElement;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const prev = {
    htmlBg: html.style.background,
    bodyBg: document.body.style.background,
    bodyOverflow: document.body.style.overflow,
    overscroll: html.style.overscrollBehavior,
    theme: meta?.content ?? null,
  };
  html.style.overscrollBehavior = "none";
  document.body.style.overflow = "hidden";
  const paintChrome = (i: number) => {
    html.style.background = STATIONS[i].field;
    document.body.style.background = STATIONS[i].field;
    if (meta) meta.content = STATIONS[i].field;
  };

  /* ---- state ---- */
  const readStation = () => {
    const s = new URL(location.href).searchParams.get("s");
    const i = STATIONS.findIndex((x) => x.id === s);
    return i < 0 ? 0 : i;
  };
  const from = carry && performance.now() - carry.at < 1000 ? carry : null;
  carry = null;
  let target = readStation();
  let p = from && !rm ? from.p : target; // dial position, in stations
  let v = 0; // stations per second
  let mode: "rest" | "spring" | "drag" | "wheel" = p === target ? "rest" : "spring";
  let committed = target; // station currently in the URL
  let fromPop = false;
  let shown = -1;
  let lockedAt = -1;
  let interacted = from?.interacted ?? false;
  let boot = rm || from ? 1 : 0;
  let last = performance.now();
  let clock = 0;
  let raf = 0;
  let wheelTimer = 0;
  let wheelStepAt = 0;
  let wheelLast = 0;
  let wheelAcc = 0;
  let wheelBase = 0;
  let wheelStepped = false;
  let wheelPrev = 0;
  const WHEEL_STEP = 90; // px of scroll it takes to change station

  // geometry
  let pps = 110; // px per station on the drum face
  let R = 200;
  let dpr = 1;
  let drumW = 0;
  let drumH = 0;
  let edgeW = 0;
  let edgeH = 0;
  let nW = 0;
  let nH = 0;
  let nData: ImageData | null = null;
  let drumDirty = true;

  const measure = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    drumW = drum.clientWidth;
    drumH = drum.clientHeight;
    drumCv.width = Math.round(drumW * dpr);
    drumCv.height = Math.round(drumH * dpr);
    pps = clamp(drumW * 0.3, 104, 168);
    R = drumW * 0.54;
    edgeW = edge.clientWidth;
    edgeH = edge.clientHeight;
    edge.width = Math.round(edgeW * dpr);
    edge.height = Math.round(edgeH * dpr);
    nW = Math.max(1, Math.ceil(stage.clientWidth / 4));
    nH = Math.max(1, Math.ceil(stage.clientHeight / 4));
    noise.width = nW;
    noise.height = nH;
    nData = nctx.createImageData(nW, nH);
    drumDirty = true;
  };

  /* ---- colour of the moment ---- */
  const pack = (c: number[], al: number) => (((al & 255) << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  const nPal = new Uint32Array(4);
  let nMix = 0;
  let field = RGB[0].field;
  let ink = RGB[0].ink;
  let contrast = contrastOf(ink);
  let colourKey = "";
  const computeColour = () => {
    const q = clamp(p, 0, LAST);
    const a = Math.floor(q);
    const b = Math.min(LAST, a + 1);
    const m = smooth(0.47, 0.53, q - a);
    field = mix(RGB[a].field, RGB[b].field, m);
    ink = mix(RGB[a].ink, RGB[b].ink, m);
    // Border tracks the stage; tuner is always black so marks stay light.
    const border = contrastOf(field);
    contrast = [255, 255, 255];
    // the static is printed from both neighbours' inks: two stations interfering
    const near = q - a < 0.5 ? a : b;
    const far = near === a ? b : a;
    nPal[0] = pack(RGB[near].field, 255);
    nPal[1] = pack(RGB[far].field, 255);
    nPal[2] = pack(RGB[near].ink, 255);
    nPal[3] = pack(RGB[far].ink, 255);
    nMix = Math.min(q - a, 1 - (q - a)) * 2; // 0 at a station, 1 halfway
    const key = field.join() + ink.join();
    if (key !== colourKey) {
      colourKey = key;
      t.style.setProperty("--field", css(field));
      t.style.setProperty("--ink", css(ink));
      t.style.setProperty("--contrast", css(contrast));
      t.style.setProperty("--hex-border", css(border));
      drumDirty = true;
    }
  };

  /* ---- section visibility ---- */
  let lastS = -1;
  const pageBodyOf = (i: number) => secs[i]?.querySelector<HTMLElement>(".rg-page-body");
  const scrollY = (host: HTMLElement) => pageLenis(host)?.targetScroll ?? host.scrollTop;
  const scrollLimit = (host: HTMLElement) =>
    pageLenis(host)?.limit ?? Math.max(0, host.scrollHeight - host.clientHeight);
  const atPageEnd = (host: HTMLElement) => scrollY(host) >= scrollLimit(host) - 1;

  // Tuner ducks while content scrolls; rises at page end or after 3s idle.
  let deckTimer = 0;
  const DECK_IDLE_MS = 3000;
  const revealDeck = () => {
    clearTimeout(deckTimer);
    deckTimer = 0;
    t.classList.remove("deck-away");
  };
  const noteContentScroll = () => {
    const host = shown >= 0 ? pageBodyOf(shown) : null;
    if (host && atPageEnd(host)) {
      revealDeck();
      return;
    }
    t.classList.add("deck-away");
    clearTimeout(deckTimer);
    deckTimer = window.setTimeout(revealDeck, DECK_IDLE_MS);
  };

  const showSection = (i: number) => {
    if (i === shown) return;
    const prev = shown;
    if (shown >= 0 && bigs[shown]) bigs[shown]!.style.translate = "";
    shown = i;
    lastS = -1;
    secs.forEach((s, j) => {
      const on = j === i;
      s.classList.toggle("on", on);
      s.toggleAttribute("inert", !on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      if (!on) {
        s.style.opacity = "0";
        s.classList.remove("locked");
      }
    });
    // Always land at the top of the page body when a station comes into focus.
    if (prev >= 0) {
      const body = pageBodyOf(i);
      if (body) scrollPageTo(body, 0, { immediate: true });
    }
    revealDeck();
    t.dataset.s = STATIONS[i].id;
    paintChrome(i);
    paintChannelBadge(i);
    spinChannelTo(i);
    drumDirty = true;
  };

  /* ---- input ---- */
  const rubber = (x: number) => (x < 0 ? x * 0.32 : x > LAST ? LAST + (x - LAST) * 0.32 : x);
  const go = (i: number, vel = v) => {
    target = clamp(Math.round(i), 0, LAST);
    v = vel;
    mode = "spring";
    if (rm) {
      p = target;
      v = 0;
    }
    wake();
  };
  const step = (dir: number) => {
    const base = mode === "spring" || mode === "rest" ? target : Math.round(p);
    go(base + dir);
  };
  const touch = () => {
    fromPop = false;
    if (!interacted) {
      interacted = true;
      t.classList.add("touched");
    }
  };

  // pointer: drag horizontally anywhere; the drum takes any drag immediately
  type Down = {
    id: number;
    x0: number;
    y0: number;
    t0: number;
    startP: number;
    onDrum: boolean;
    dragging: boolean;
    samples: { t: number; p: number }[];
  };
  let down: Down | null = null;
  let suppressClick = false;
  const beginDrag = (x: number) => {
    if (!down) return;
    down.dragging = true;
    down.x0 = x;
    down.startP = p;
    mode = "drag";
    v = 0;
    touch();
    t.classList.add("dragging");
    wake();
  };
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    // a station's own board or canvas keeps its drags
    if ((e.target as HTMLElement).closest?.("[data-own]")) return;
    // a second finger never hijacks a drag in progress; a stale press is replaced
    if (down && down.dragging && down.id !== e.pointerId) return;
    const onDrum = drum.contains(e.target as Node);
    down = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), startP: p, onDrum, dragging: false, samples: [] };
    if (onDrum) {
      drum.setPointerCapture(e.pointerId);
      beginDrag(e.clientX);
    }
  };
  const onMove = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    if (!down.dragging) {
      const dx = e.clientX - down.x0;
      const dy = e.clientY - down.y0;
      if (Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        try {
          t.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already released */
        }
        beginDrag(e.clientX);
      } else return;
    }
    p = rubber(down.startP - (e.clientX - down.x0) / pps);
    const now = performance.now();
    down.samples.push({ t: now, p });
    while (down.samples.length > 2 && now - down.samples[0].t > 90) down.samples.shift();
  };
  const onUp = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const d = down;
    down = null;
    t.classList.remove("dragging");
    if (!d.dragging) return;
    const moved = Math.abs(e.clientX - d.x0);
    if (d.onDrum && moved < 5 && performance.now() - d.t0 < 350) {
      // a tap on the drum tunes to the mark under the finger
      const r = drum.getBoundingClientRect();
      const off = clamp((e.clientX - (r.left + r.width / 2)) / R, -0.98, 0.98);
      const st = Math.asin(off) / (pps / R);
      go(Math.abs(st) < 0.3 ? Math.round(p) : p + st, 0);
      return;
    }
    if (moved > 4) suppressClick = true;
    const s = d.samples;
    let vel = 0;
    if (s.length > 1) {
      const a = s[0];
      const b = s[s.length - 1];
      if (b.t - a.t > 8 && performance.now() - b.t < 80) vel = (b.p - a.p) / ((b.t - a.t) / 1000);
    }
    vel = clamp(vel, -14, 14);
    go(p + vel * 0.2, vel);
  };
  const onClickCapture = (e: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /** Active page body when it can actually scroll. */
  const scrollHost = () => {
    const body = shown >= 0 ? pageBodyOf(shown) : null;
    if (body && body.scrollHeight > body.clientHeight + 1) return body;
    return null;
  };

  const clearContentScrollLean = () => {
    if (mode === "wheel") {
      mode = "spring";
      target = Math.round(clamp(p, 0, LAST));
      wake();
    }
    wheelAcc = 0;
    wheelStepped = false;
  };

  /** True when this delta still has room to move inside the page body. */
  const canScrollContent = (dl: number) => {
    const host = scrollHost();
    if (!host) return false;
    const y = scrollY(host);
    const top = y <= 0;
    const bottom = y >= scrollLimit(host) - 1;
    return (dl < 0 && !top) || (dl > 0 && !bottom);
  };

  /** Shared station advance from a scroll gesture (wheel or touch). */
  const advanceFromScroll = (dl: number, raw: number, deltaMode: number) => {
    touch();
    const now = performance.now();
    const fresh = now - wheelLast > 240;
    wheelLast = now;
    const ab = Math.abs(raw);
    const notched = deltaMode !== 0 || (Number.isInteger(raw) && ab >= 100 && (ab % 100 === 0 || ab % 120 === 0));
    const push = Math.abs(dl) > wheelPrev * 1.6 && Math.abs(dl) > 6;
    wheelPrev = Math.abs(dl);
    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      if (!wheelStepped) go(wheelBase, 0);
      wheelStepped = false;
      wheelAcc = 0;
    }, 240);
    if (fresh) {
      wheelAcc = 0;
      wheelStepped = false;
      wheelBase = mode === "spring" || mode === "rest" ? target : Math.round(p);
    }
    if (wheelStepped) {
      const again = notched ? now - wheelStepAt > 320 : push && now - wheelStepAt > 450;
      if (!again) return;
      wheelStepped = false;
      wheelAcc = 0;
      wheelBase = target;
    }
    wheelAcc += dl;
    if (Math.abs(wheelAcc) >= WHEEL_STEP) {
      wheelStepped = true;
      wheelStepAt = now;
      go(wheelBase + Math.sign(wheelAcc), 0);
      return;
    }
    mode = "wheel";
    v = 0;
    p = clamp(wheelBase + (wheelAcc / WHEEL_STEP) * 0.2, -0.25, LAST + 0.25);
    wake();
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return;
    const dominantY = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
    const raw = dominantY ? e.deltaY : e.deltaX;
    if (!raw) return;
    const dl = e.deltaMode === 1 ? raw * 40 : e.deltaMode === 2 ? raw * 800 : raw;

    // Laptop / trackpad: scroll page content first (works even over the title).
    if (dominantY && canScrollContent(dl)) {
      e.preventDefault();
      const host = scrollHost();
      if (host) scrollPageBy(host, dl);
      clearContentScrollLean();
      noteContentScroll();
      return;
    }

    e.preventDefault();
    revealDeck();
    advanceFromScroll(dl, raw, e.deltaMode);
  };

  // Mobile: native content scroll while inside the page; edge pull changes station.
  type Finger = { id: number; x: number; y: number; axis: "none" | "x" | "y" };
  let finger: Finger | null = null;
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      finger = null;
      return;
    }
    if (drum.contains(e.target as Node)) return;
    const th = e.touches[0];
    finger = { id: th.identifier, x: th.clientX, y: th.clientY, axis: "none" };
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!finger) return;
    const th = [...e.touches].find((x) => x.identifier === finger!.id);
    if (!th) return;
    const dx = th.clientX - finger.x;
    const dy = th.clientY - finger.y;
    if (finger.axis === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      finger.axis = Math.abs(dy) >= Math.abs(dx) * 1.05 ? "y" : "x";
    }
    if (finger.axis !== "y") return;

    // Finger up → positive delta (same sign as wheel deltaY / scroll down).
    const dl = finger.y - th.clientY;
    finger.x = th.clientX;
    finger.y = th.clientY;

    if (canScrollContent(dl)) {
      clearContentScrollLean();
      noteContentScroll();
      return;
    }

    e.preventDefault();
    revealDeck();
    advanceFromScroll(dl, dl, 0);
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!finger) return;
    if ([...e.touches].some((x) => x.identifier === finger!.id)) return;
    finger = null;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement).closest?.("input, textarea, select, [contenteditable], [data-own]")) return;
    let handled = true;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        step(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        step(-1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(LAST);
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      touch();
    }
  };

  // back and forward retune the dial
  const onPop = () => {
    const i = readStation();
    fromPop = true;
    committed = i;
    go(i, 0);
  };

  /* ---- lock ---- */
  const onLock = (i: number) => {
    if (i !== committed) {
      committed = i;
      if (!fromPop) {
        const u = new URL(location.href);
        u.searchParams.set("s", STATIONS[i].id);
        history.pushState(null, "", u);
      }
      if (interacted && "vibrate" in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          /* not allowed here */
        }
      }
    }
    fromPop = false;
    live.textContent = `${STATIONS[i].label}, channel ${channelOf(i)}`;
  };

  /* ---- drawing ---- */
  const drawDrum = () => {
    const c = dctx;
    const w = drumW;
    const h = drumH;
    if (!w || !h) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const cx = w / 2;
    const th = pps / R; // radians per station
    const markC = css(contrast);
    const cur = Math.round(clamp(p, 0, LAST));
    c.fillStyle = markC;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    const fs = h < 48 ? 13 : 15;
    // ticks every 0.4 MHz: eight to a gap, a longer one halfway
    for (let k = -3; k <= LAST * 8 + 3; k++) {
      const mark = k / 8;
      const a = (mark - p) * th;
      if (Math.abs(a) > 1.5) continue;
      const cos = Math.cos(a);
      const x = cx + R * Math.sin(a);
      const major = k % 8 === 0 && k >= 0 && k <= LAST * 8;
      const mid = k % 4 === 0;
      const len = major ? h * 0.4 : mid ? h * 0.25 : h * 0.15;
      // Soft blur by distance from the needle — selected channel stays sharp.
      const distance = Math.abs(mark - p);
      const blur = rm ? 0 : Math.min(distance * 0.7, 1.6);
      const fade = Math.max(1 - distance * 0.22, 0.4);
      c.save();
      c.globalAlpha = cos * cos * (major ? 0.95 : 0.55) * fade;
      if (blur > 0.04) c.filter = `blur(${blur.toFixed(2)}px)`;
      const tw = Math.max(0.6, (major ? 2.5 : 1.2) * Math.max(0.35, cos));
      c.fillRect(x - tw / 2, 0, tw, len);
      if (major) {
        const i = k / 8;
        c.translate(x, h - 8);
        // Keep label readable while still foreshortening a little.
        c.scale(Math.max(0.55, cos), 1);
        c.font = `${i === cur ? 800 : 500} ${fs}px "Big Shoulders Display Variable"`;
        c.fillText(STATIONS[i].label, 0, 0);
      }
      c.restore();
    }
    c.filter = "none";
    c.globalAlpha = 1;
    // needle stays sharp above the blurred marks
    c.fillStyle = markC;
    c.fillRect(cx - 1.5, 0, 3, h * 0.66);
    c.beginPath();
    c.moveTo(cx - 6.5, 0);
    c.lineTo(cx + 6.5, 0);
    c.lineTo(cx, 7);
    c.closePath();
    c.fill();
  };

  // Comic Ben-Day tile — reused for the shadow print texture.
  let benday: CanvasPattern | null = null;
  const bendayPattern = () => {
    if (benday) return benday;
    const tile = document.createElement("canvas");
    tile.width = 14;
    tile.height = 14;
    const tc = tile.getContext("2d")!;
    tc.fillStyle = "rgba(0,0,0,0.34)";
    tc.beginPath();
    tc.arc(7, 7, 3.1, 0, TAU);
    tc.fill();
    benday = ectx.createPattern(tile, "repeat");
    return benday;
  };

  // Stable pseudo-random so the ridge doesn't flicker each frame.
  const edgeRnd = (i: number) => {
    let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };

  // Value noise: smooth (cosine) for the swell, linear for the jagged teeth.
  const vnoise = (x: number, span: number, seed: number, jag: boolean) => {
    const u = x / span;
    const i = Math.floor(u);
    let f = u - i;
    if (!jag) f = (1 - Math.cos(f * Math.PI)) / 2;
    const a = edgeRnd(seed + i * 7919);
    const b = edgeRnd(seed + (i + 1) * 7919);
    return a + (b - a) * f;
  };

  // One random torn ridge per station: a slow swell, jagged teeth and fine grit.
  const ridgeAt = (station: number, x: number) => {
    const s = station * 1013 + 17;
    const swell = vnoise(x, Math.max(220, edgeW / 3.4), s, false);
    const teeth = vnoise(x, 34 + edgeRnd(s) * 26, s + 3, true);
    const grit = vnoise(x, 9, s + 5, true);
    const spike = Math.pow(vnoise(x, 61, s + 9, true), 6);
    return clamp(0.2 + swell * 0.62 + (teeth - 0.5) * 0.46 + (grit - 0.5) * 0.1 + spike * 0.34, 0.04, 1.1);
  };

  const drawEdge = (n: number, sigma: number) => {
    const c = ectx;
    const w = edgeW;
    const h = edgeH;
    if (!w || !h) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const q = clamp(p, 0, LAST);
    const a = Math.floor(q);
    const b = Math.min(LAST, a + 1);
    const m = smooth(0, 1, q - a);
    const presence = a <= 0 ? m : 1;
    if (presence < 0.001 && n < 0.01) return;

    const amp = (h * 0.8 + 10 * n + 4 * (1 - sigma)) * Math.max(presence, n * 0.35);
    const step = 2;
    // Static shakes the ridge a little while tuning between stations.
    const shake = n > 0.02 ? clock * 40 : 0;
    const heightAt = (x: number) => {
      const y = ridgeAt(a, x + shake) * (1 - m) + ridgeAt(b, x + shake) * m;
      return h - y * amp;
    };
    const trace = (dx: number, scale: number) => {
      c.beginPath();
      c.moveTo(0, h);
      for (let x = 0; x <= w + step; x += step) {
        c.lineTo(x, h - (h - heightAt(x - dx)) * scale);
      }
      c.lineTo(w, h);
      c.closePath();
    };

    // Offset shadow print — darker field with Ben-Day dots, like a misregistered plate.
    const shade = mix(field, [0, 0, 0], 0.58);
    trace(-Math.max(28, w * 0.03), 1.18);
    c.globalAlpha = 0.6 * Math.max(presence, 0.2);
    c.fillStyle = css(shade);
    c.fill();
    const dots = bendayPattern();
    if (dots) {
      c.save();
      c.clip();
      c.globalAlpha = 0.45 * Math.max(presence, 0.2);
      c.fillStyle = dots;
      c.fillRect(0, 0, w, h);
      c.restore();
    }

    // Solid ink ridge — the tuner's own torn edge.
    c.globalAlpha = 1;
    trace(0, 1);
    c.fillStyle = "#000";
    c.fill();

    // Thin black base — kills field-tint at the foot.
    c.fillRect(0, h - 18, w, 18);
  };

  let seed = 0x9e3779b9;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  let noiseOn = false;
  const drawNoise = (n: number) => {
    if (n < 0.01 || !nData) {
      if (noiseOn) {
        noise.style.opacity = "0";
        noiseOn = false;
      }
      return;
    }
    noiseOn = true;
    noise.style.opacity = Math.min(1, n).toFixed(3);
    const d32 = new Uint32Array(nData.data.buffer);
    const band = frac(clock * 0.35) * (nH + 40) - 20;
    const other = nMix * 0.5; // share of the far station in the static
    for (let y = 0; y < nH; y++) {
      const thr = Math.abs(y - band) < 6 ? 0.42 : 0.66;
      const row = y * nW;
      for (let x = 0; x < nW; x++) {
        const r = rnd();
        const far = rnd() < other ? 1 : 0;
        d32[row + x] = nPal[(r > thr ? 2 : 0) + far];
      }
    }
    nctx.putImageData(nData, 0, 0);
  };

  /* ---- frame ---- */
  let lastSw = -1;
  let readKey = "";
  let jitterOn = false;
  const frame = (now: number) => {
    raf = 0;
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    clock += dt;
    if (boot < 1) boot = Math.min(1, boot + dt / 1.1);

    if (mode === "spring") {
      const k = 190;
      const damp = 2 * Math.sqrt(k) * 0.66;
      const sub = Math.max(1, Math.ceil(dt * 240));
      const h = dt / sub;
      for (let i = 0; i < sub; i++) {
        v += (k * (target - p) - damp * v) * h;
        p += v * h;
      }
      if (Math.abs(target - p) < 0.0008 && Math.abs(v) < 0.02) {
        p = target;
        v = 0;
        mode = "rest";
      }
    }

    const q = clamp(p, 0, LAST);
    const nearest = Math.round(q);
    const d = Math.abs(p - nearest);
    const bootE = 1 - (1 - boot) ** 3;
    let sig = (1 - smooth(0.012, 0.42, d)) * bootE;
    let n = Math.max(smooth(0.05, 0.45, d) * 0.9, (1 - bootE) * 0.85);

    if (rm) n = 0;

    computeColour();
    showSection(nearest);

    const sw = sig * sig;
    if (Math.abs(sw - lastSw) > 0.002) {
      lastSw = sw;
      t.style.setProperty("--sw", sw.toFixed(3));
    }
    if (Math.abs(sig - lastS) > 0.002) {
      lastS = sig;
      t.style.setProperty("--s", sig.toFixed(3));
      secs[nearest].style.opacity = smooth(0, 0.55, sig).toFixed(3);
    }
    const isLocked = sig > 0.985 && (mode === "rest" || (mode === "spring" && Math.abs(v) < 0.4));
    secs[nearest].classList.toggle("locked", isLocked);
    handles.forEach((h, j) => h.tick?.(dt, j === nearest && isLocked));
    const lockNow = isLocked && mode === "rest" ? nearest : -1;
    if (lockNow >= 0 && lockNow !== lockedAt) onLock(lockNow);
    lockedAt = lockNow;

    // interference: the station word shivers under static
    const big = bigs[nearest];
    if (big) {
      if (n > 0.02) {
        big.style.translate = `${((Math.random() - 0.5) * 14 * n).toFixed(1)}px 0`;
        jitterOn = true;
      } else if (jitterOn) {
        big.style.translate = "";
        jitterOn = false;
      }
    }

    const ch = channelOf(nearest);
    if (ch !== readKey) {
      readKey = ch;
      channelEl.textContent = ch;
      drum.setAttribute("aria-valuenow", String(nearest + 1));
      drum.setAttribute("aria-valuetext", `${STATIONS[nearest].label}, channel ${ch}`);
    }
    if (drumDirty || mode !== "rest" || boot < 1) {
      drawDrum();
      drumDirty = false;
    }
    drawEdge(n, sig);
    drawNoise(n);

    const busy = mode !== "rest" || boot < 1 || n > 0.01;
    if (busy) wake();
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  /* ---- stations ---- */
  // A station that throws stays silent; the rest of the dial keeps working.
  const handles: Handle[] = MODS.map((m, i) => {
    try {
      return m.mount(secs[i], {
        reduced: () => rm,
        wake: () => wake(),
        announce: (text) => {
          live.textContent = text;
        },
      });
    } catch (err) {
      console.error(`Station ${m.meta.id} failed to mount`, err);
      return {};
    }
  });
  // React may commit station content a frame later — keep titles + scroll hosts fresh.
  const pageBodies: HTMLElement[] = [];
  const bindPageBodies = () => {
    bigs = secs.map((s) => s.querySelector<HTMLElement>(".big"));
    secs.forEach((s) => {
      const body = s.querySelector<HTMLElement>(".rg-page-body");
      if (!body) return;
      if (!pageBodies.includes(body)) {
        pageBodies.push(body);
        body.addEventListener("scroll", noteContentScroll, { passive: true });
      }
      bindPageScroll(body);
    });
  };
  bindPageBodies();
  requestAnimationFrame(() => {
    bindPageBodies();
    requestAnimationFrame(bindPageBodies);
  });

  /* ---- wire up ---- */
  const ro = new ResizeObserver(() => {
    measure();
    handles.forEach((h) => h.resize?.());
    wake();
  });
  ro.observe(t);
  ro.observe(drum);

  const onReduce = () => {
    rm = reduce.matches;
    if (rm) {
      boot = 1;
      if (mode === "spring") {
        p = target;
        v = 0;
      }
    }
    wake();
  };
  const onVis = () => {
    last = performance.now();
    wake();
  };
  const onFonts = () => {
    drumDirty = true;
    wake();
  };

  // Depth layers: titles (fast) → waves (x-only, stays sealed to tuner) → hex (slowest).
  const WAVE_PX = 18;
  const HEX_PX = 10;
  const HEX_PY = 7;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const onDeckParallax = (e: MouseEvent) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    edgeWrap.style.setProperty("--px", `${(-nx * 2 * WAVE_PX).toFixed(1)}px`);
    edgeWrap.style.setProperty("--py", "0px");
    channel.style.setProperty("--px", `${(-nx * 2 * HEX_PX).toFixed(1)}px`);
    channel.style.setProperty("--py", `${(-ny * 2 * HEX_PY).toFixed(1)}px`);
  };

  t.addEventListener("pointerdown", onDown);
  t.addEventListener("pointermove", onMove);
  t.addEventListener("pointerup", onUp);
  t.addEventListener("pointercancel", onUp);
  t.addEventListener("click", onClickCapture, true);
  t.addEventListener("wheel", onWheel, { passive: false });
  t.addEventListener("touchstart", onTouchStart, { passive: true });
  t.addEventListener("touchmove", onTouchMove, { passive: false });
  t.addEventListener("touchend", onTouchEnd);
  t.addEventListener("touchcancel", onTouchEnd);
  if (finePointer) window.addEventListener("mousemove", onDeckParallax);
  window.addEventListener("keydown", onKey);
  window.addEventListener("popstate", onPop);
  reduce.addEventListener("change", onReduce);
  document.addEventListener("visibilitychange", onVis);
  document.fonts?.addEventListener("loadingdone", onFonts);

  if (interacted) t.classList.add("touched");
  const start = Math.round(p);
  channelEl.textContent = channelOf(start);
  paintChannelShape();
  paintChannelBadge(start);
  measure();
  showSection(start);
  computeColour();
  wake();

  return () => {
    carry = { p, at: performance.now(), interacted };
    handles.forEach((h) => h.destroy?.());
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(wheelTimer);
    clearTimeout(deckTimer);
    pageBodies.forEach((body) => {
      body.removeEventListener("scroll", noteContentScroll);
      unbindPageScroll(body);
    });
    ro.disconnect();
    t.removeEventListener("pointerdown", onDown);
    t.removeEventListener("pointermove", onMove);
    t.removeEventListener("pointerup", onUp);
    t.removeEventListener("pointercancel", onUp);
    t.removeEventListener("click", onClickCapture, true);
    t.removeEventListener("wheel", onWheel);
    t.removeEventListener("touchstart", onTouchStart);
    t.removeEventListener("touchmove", onTouchMove);
    t.removeEventListener("touchend", onTouchEnd);
    t.removeEventListener("touchcancel", onTouchEnd);
    if (finePointer) window.removeEventListener("mousemove", onDeckParallax);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("popstate", onPop);
    reduce.removeEventListener("change", onReduce);
    document.removeEventListener("visibilitychange", onVis);
    document.fonts?.removeEventListener("loadingdone", onFonts);
    html.style.background = prev.htmlBg;
    html.style.overscrollBehavior = prev.overscroll;
    document.body.style.background = prev.bodyBg;
    document.body.style.overflow = prev.bodyOverflow;
    if (meta && prev.theme !== null) meta.content = prev.theme;
    root.classList.remove("d-stations");
  };
}
