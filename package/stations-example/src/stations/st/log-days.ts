// The day grid for the Log station, adapted from ../../logbook/days.ts.
// One pen mark per day, one column per year, one row per week (Monday to
// Sunday). Differences from the logbook version:
// - it fits a fixed box (width and height), wrapping years only if that
//   gives bigger marks; the station tells it how much room there is;
// - the sweep is driven by the station's tick, so nothing moves unless the
//   station is on air; tuning away resets the page to blank so the next
//   tune-in writes it again;
// - touch scrubs the grid in both directions (the page never scrolls here).

const DAY = 86_400_000;
const ROWS = 54; // a year spans at most 54 Monday-start weeks
const PAPER = 10; // paper square in CSS px; the canvas origin is put on a paper line
const INK: RGB = [29, 58, 148];
const NOW: RGB = [210, 48, 74];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type RGB = [number, number, number];

export type DaysEls = {
  /** The element whose background is the paper (snapped to the grid). */
  paper: HTMLElement;
  grid: HTMLElement;
  canvas: HTMLCanvasElement;
  labels: HTMLElement;
  today: HTMLElement;
  cursor: HTMLElement;
  num: HTMLElement;
  when: HTMLElement;
  /** Gets is-today / is-past / is-future for the margin glyph. */
  read: HTMLElement;
};

export type Days = {
  /** Fit the grid into availW x availH (CSS px). Returns the grid's size. */
  layout(availW: number, availH: number): { w: number; h: number };
  tick(dt: number, live: boolean, visible: boolean): void;
  /** Today's 1-based day number. */
  day: number;
  destroy(): void;
};

const fmt = new Intl.NumberFormat("en-GB");
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
};
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Wavefront position over time: eases in, runs, and settles into today.
const ease = (u: number) => 0.5 * (u * u * (3 - 2 * u)) + 0.5 * (1 - (1 - u) ** 3);
const smooth = (u: number) => u * u * (3 - 2 * u);
const outCubic = (u: number) => 1 - (1 - u) ** 3;
const outBack = (u: number) => 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2;
const INK_CSS = mix(INK, INK, 0);
const NOW_CSS = mix(NOW, NOW, 0);

export function createDays(els: DaysEls, startISO: string, reduced: () => boolean): Days {
  const { paper, grid, canvas, labels, today: todayEl, cursor, num: numEl, when: whenEl, read: readEl } = els;
  const ctx = canvas.getContext("2d")!;

  // ---- model -------------------------------------------------------------
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const start = Math.min(parse(startISO), today);
  const y0 = new Date(start).getUTCFullYear();
  const y1 = new Date(today).getUTCFullYear();
  const years = y1 - y0 + 1;
  const end = Date.UTC(y1, 11, 31);
  const total = Math.round((end - start) / DAY) + 1;
  const T = Math.round((today - start) / DAY); // today's index; Day T+1

  const jan1 = Array.from({ length: years }, (_, k) => Date.UTC(y0 + k, 0, 1));
  const w0 = jan1.map((t) => (new Date(t).getUTCDay() + 6) % 7);
  const yearLen = jan1.map((t, k) => Math.round((Date.UTC(y0 + k + 1, 0, 1) - t) / DAY));

  const kOf = new Uint16Array(total);
  const rowOf = new Uint8Array(total);
  const colOf = new Uint8Array(total);
  for (let i = 0, k = 0; i < total; i++) {
    const t = start + i * DAY;
    while (k + 1 < years && t >= jan1[k + 1]) k++;
    const slot = Math.round((t - jan1[k]) / DAY) + w0[k];
    kOf[i] = k;
    rowOf[i] = (slot / 7) | 0;
    colOf[i] = slot % 7;
  }

  // When the wavefront passes each day (fraction of the sweep), by inverting ease().
  const TABLE = 1024;
  const table = new Float32Array(TABLE + 1);
  for (let j = 0; j <= TABLE; j++) table[j] = ease(j / TABLE);
  const hit = new Float32Array(T + 1);
  for (let i = 0, j = 0; i <= T; i++) {
    const v = T === 0 ? 1 : i / T;
    while (j < TABLE && table[j + 1] < v) j++;
    const a = table[j], b = table[Math.min(TABLE, j + 1)];
    hit[i] = (j + (b > a ? (v - a) / (b - a) : 0)) / TABLE;
  }

  // ---- layout ------------------------------------------------------------
  const D = clamp(900 + T * 0.32, 1100, 2200); // sweep length, ms
  const TAU = 520; // how long a fresh mark takes to cool from red to ink, ms
  let c = 10, perBand = years, bands = 1, gapRows = 4, W = 0, H = 0, dpr = 1;
  let lastAvail = "";
  const xs = new Float32Array(total);
  const ys = new Float32Array(total);

  // Mark size for a given years-per-band: whichever of width or height runs out first.
  const fitFor = (n: number, aw: number, ah: number) => {
    const b = Math.ceil(years / n);
    // bands sit ~44px apart (room for the next row of year labels)
    return Math.min(aw / (n * 8 - 1), (ah - (b - 1) * 44) / (b * ROWS));
  };

  function layout(availW: number, availH: number) {
    const aw = Math.max(120, availW);
    const ah = Math.max(120, availH);
    const key = `${Math.round(aw)}x${Math.round(ah)}@${window.devicePixelRatio}`;
    if (key === lastAvail && W) return { w: W, h: H };
    lastAvail = key;

    // Prefer every year side by side; wrap years into bands only if the marks get bigger.
    let best = years, bestFit = fitFor(years, aw, ah);
    for (let n = years - 1; n >= 1; n--) {
      const f = fitFor(n, aw, ah);
      if (f > bestFit * 1.15) { best = n; bestFit = f; }
    }
    perBand = best;
    const fit = bestFit;
    // Whole paper squares (10), else whole pixels; below 5px keep the fraction.
    c = fit >= 10 ? 10 : fit >= 5 ? Math.floor(fit) : Math.max(2.5, fit);
    bands = Math.ceil(years / perBand);
    gapRows = Math.ceil(44 / c);
    W = Math.round((perBand * 8 - 1) * c);
    H = Math.round((bands * ROWS + (bands - 1) * gapRows) * c);
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    grid.style.width = `${W}px`;
    grid.style.height = `${H}px`;
    grid.style.setProperty("--c", `${c}px`);

    for (let i = 0; i < total; i++) {
      const k = kOf[i];
      const band = (k / perBand) | 0;
      xs[i] = ((k % perBand) * 8 + colOf[i]) * c;
      ys[i] = (band * (ROWS + gapRows) + rowOf[i]) * c;
    }

    // Year labels above each column, month labels in the margin of each band.
    const out: string[] = [];
    for (let k = 0; k < years; k++) {
      const band = (k / perBand) | 0;
      const x = ((k % perBand) * 8 + 3.5) * c;
      const y = band * (ROWS + gapRows) * c;
      out.push(`<span class="lg-year" data-k="${k}" style="transform:translate(${x}px,${y}px)">${y0 + k}</span>`);
    }
    const ky = years - 1;
    const monthStep = c >= 8 ? 1 : 3;
    for (let b = 0; b < bands; b++) {
      for (let m = 0; m < 12; m += monthStep) {
        const doy = Math.round((Date.UTC(y0 + ky, m, 1) - jan1[ky]) / DAY);
        const row = ((doy + w0[ky]) / 7) | 0;
        const y = (b * (ROWS + gapRows) + row) * c;
        out.push(`<span class="lg-month" style="transform:translateY(${y}px)">${MONTHS[m].slice(0, 3)}</span>`);
      }
    }
    labels.innerHTML = out.join("");
    litYear = null;
    if (sel !== null) light(sel);

    todayEl.style.transform = `translate(${xs[T] + c / 2}px,${ys[T] + c / 2}px)`;
    redraw();
    place(sel ?? T, true);
    return { w: W, h: H };
  }

  // Move the paper so the canvas origin sits on a major paper line.
  function snapPaper() {
    const r = canvas.getBoundingClientRect();
    const o = paper.getBoundingClientRect();
    const mod = PAPER * 5;
    const x = ((Math.round(r.left - o.left) % mod) + mod) % mod;
    const y = ((Math.round(r.top - o.top) % mod) + mod) % mod;
    paper.style.setProperty("--paper-x", `${x}px`);
    paper.style.setProperty("--paper-y", `${y}px`);
  }

  // ---- drawing -----------------------------------------------------------
  const DOTS = "rgba(29,58,148,0.26)";
  const BUCKETS = 10;
  const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);

  function slash(g: CanvasRenderingContext2D, i: number, len: number) {
    const x = xs[i], y = ys[i];
    const a = c * 0.27, b = c - a;
    g.moveTo(x + a, y + b);
    g.lineTo(x + a + (b - a) * len, y + b - (b - a) * len);
  }

  // Two offscreen layers, so a sweep frame never redraws thousands of marks:
  // the pencil dots (cleared one cell at a time as days get written) and the
  // settled ink (stamped once per day as it cools).
  const dotsCv = document.createElement("canvas");
  const inkCv = document.createElement("canvas");
  const dctx = dotsCv.getContext("2d")!;
  const ictx = inkCv.getContext("2d")!;
  let dotted = 0; // days [0, dotted) have lost their pencil dot
  let inked = 0; // days [0, inked) are stamped onto the ink layer

  function resetLayers() {
    for (const [cv, g] of [[dotsCv, dctx], [inkCv, ictx]] as const) {
      cv.width = canvas.width;
      cv.height = canvas.height;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
    }
    const r = Math.max(0.55, c * 0.085);
    dctx.fillStyle = DOTS;
    dctx.beginPath();
    for (let i = 0; i < total; i++) {
      const cx = xs[i] + c / 2, cy = ys[i] + c / 2;
      dctx.moveTo(cx + r, cy);
      dctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    dctx.fill();
    ictx.lineCap = "round";
    ictx.lineWidth = Math.max(0.9, c * 0.135);
    ictx.strokeStyle = INK_CSS;
    dotted = 0;
    inked = 0;
  }

  // t: ms since the sweep began (Infinity = settled, -Infinity = blank page).
  function draw(t: number) {
    if (!W) return;
    // Bring the layers up to t.
    while (dotted <= T && hit[dotted] * D <= t) {
      dctx.clearRect(xs[dotted], ys[dotted], c, c);
      dotted++;
    }
    if (inked < T && t - hit[inked] * D >= TAU) {
      ictx.beginPath();
      while (inked < T && t - hit[inked] * D >= TAU) slash(ictx, inked++, 1);
      ictx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(dotsCv, 0, 0);
    ctx.drawImage(inkCv, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(0.9, c * 0.135);

    // The still-wet marks, bucketed by how far they have cooled from red to blue.
    for (const b of buckets) b.length = 0;
    for (let i = inked; i < Math.min(dotted, T); i++) {
      const age = t - hit[i] * D;
      buckets[Math.min(BUCKETS - 1, ((age / TAU) * BUCKETS) | 0)].push(i);
    }
    for (let q = 0; q < BUCKETS; q++) {
      const list = buckets[q];
      if (!list.length) continue;
      ctx.strokeStyle = mix(NOW, INK, smooth((q + 0.5) / BUCKETS));
      ctx.beginPath();
      for (const i of list) slash(ctx, i, outCubic(Math.min(1, (t - hit[i] * D) / 150)));
      ctx.stroke();
    }

    // Today lands as a red dot and stays red.
    const age = t - hit[T] * D;
    if (age >= 0) {
      const s = outBack(Math.min(1, age / 320));
      ctx.fillStyle = NOW_CSS;
      ctx.beginPath();
      ctx.arc(xs[T] + c / 2, ys[T] + c / 2, Math.max(2.4, c * 0.42) * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- readout -----------------------------------------------------------
  const dateOf = (i: number) => new Date(start + i * DAY);
  const longDate = (i: number) => {
    const d = dateOf(i);
    return `${WEEKDAYS[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const startDate = (() => {
    const d = dateOf(0);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  })();
  function when(i: number) {
    const n = T - i;
    if (n === 0) return `Today. Counting since ${startDate}.`;
    if (n === 1) return `${longDate(i)}, yesterday.`;
    if (n === -1) return `${longDate(i)}, tomorrow. Not written yet.`;
    if (n > 0) return `${longDate(i)}, ${fmt.format(n)} days ago.`;
    return `${longDate(i)}, in ${fmt.format(-n)} days. Not written yet.`;
  }
  let shownNum = -1;
  let litYear: HTMLElement | null = null;
  // The year being read gets inked in; idle shows none.
  function light(i: number | null) {
    const el = i === null ? null : labels.querySelector<HTMLElement>(`.lg-year[data-k="${kOf[i]}"]`);
    if (el === litYear) return;
    litYear?.classList.remove("is-on");
    el?.classList.add("is-on");
    litYear = el;
  }
  function setNum(i: number) {
    if (i === shownNum) return;
    shownNum = i;
    numEl.textContent = fmt.format(i + 1);
  }
  function tense(i: number) {
    readEl.classList.toggle("is-today", i === T);
    readEl.classList.toggle("is-past", i < T);
    readEl.classList.toggle("is-future", i > T);
  }
  function read(i: number) {
    setNum(i);
    tense(i);
    whenEl.textContent = when(i);
    grid.setAttribute("aria-valuenow", String(i + 1));
    grid.setAttribute("aria-valuetext", `Day ${fmt.format(i + 1)}. ${when(i)}`);
  }
  grid.setAttribute("aria-valuemin", "1");
  grid.setAttribute("aria-valuemax", String(total));

  // ---- cursor (spring) ---------------------------------------------------
  let sel: number | null = null;
  const sp = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  let springRaf = 0;
  let last = 0;
  function place(i: number, jump = false) {
    sp.tx = xs[i];
    sp.ty = ys[i];
    if (jump || reduced()) {
      cancelAnimationFrame(springRaf);
      springRaf = 0;
      sp.x = sp.tx; sp.y = sp.ty; sp.vx = sp.vy = 0;
      cursor.style.transform = `translate(${sp.x}px,${sp.y}px)`;
      return;
    }
    if (!springRaf) {
      last = performance.now();
      springRaf = requestAnimationFrame(step);
    }
  }
  function step(now: number) {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    const k = 640, d = 2 * Math.sqrt(k) * 0.82;
    sp.vx += (k * (sp.tx - sp.x) - d * sp.vx) * dt;
    sp.vy += (k * (sp.ty - sp.y) - d * sp.vy) * dt;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    const done = Math.abs(sp.tx - sp.x) < 0.05 && Math.abs(sp.ty - sp.y) < 0.05 && Math.abs(sp.vx) + Math.abs(sp.vy) < 0.5;
    if (done) { sp.x = sp.tx; sp.y = sp.ty; }
    cursor.style.transform = `translate(${sp.x}px,${sp.y}px)`;
    springRaf = done ? 0 : requestAnimationFrame(step);
  }

  function select(i: number | null) {
    if (i !== null) i = clamp(i, 0, total - 1);
    if (i === sel) return;
    const was = sel;
    sel = i;
    grid.classList.toggle("is-reading", i !== null);
    if (state !== "settled") return;
    read(i ?? T);
    light(i);
    if (i !== null) place(i, was === null);
  }

  // Pointer position -> nearest real day.
  function dayAt(px: number, py: number) {
    const band = clamp(Math.floor(py / ((ROWS + gapRows) * c)), 0, bands - 1);
    const row = clamp(Math.floor((py - band * (ROWS + gapRows) * c) / c), 0, ROWS - 1);
    const colAll = Math.floor(px / c);
    const k = clamp(band * perBand + Math.floor(colAll / 8), 0, years - 1);
    const col = clamp(colAll - (k % perBand) * 8, 0, 6);
    const doy = clamp(row * 7 + col - w0[k], 0, yearLen[k] - 1);
    return clamp(Math.round((jan1[k] + doy * DAY - start) / DAY), 0, total - 1);
  }

  const ac = new AbortController();
  const on = { signal: ac.signal } as AddEventListenerOptions;
  const pointerDay = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return dayAt(e.clientX - r.left, e.clientY - r.top);
  };
  grid.addEventListener("pointermove", (e) => { if (state === "settled") select(pointerDay(e)); }, on);
  grid.addEventListener("pointerdown", (e) => {
    if (state !== "settled") return;
    // a finger keeps reading as it slides off the grid, until it lifts
    if (e.pointerType !== "mouse") {
      try { grid.setPointerCapture(e.pointerId); } catch { /* already released */ }
    }
    select(pointerDay(e));
  }, on);
  grid.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && document.activeElement !== grid) select(null);
  }, on);
  document.addEventListener("pointerdown", (e) => {
    if (!grid.contains(e.target as Node)) select(null);
  }, on);
  grid.addEventListener("blur", () => select(null), on);
  grid.addEventListener("keydown", (e) => {
    if (state !== "settled") return;
    const cur = sel ?? T;
    const moves: Record<string, number> = {
      ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7, PageDown: 365, PageUp: -365,
    };
    let next: number | null;
    if (e.key in moves) next = cur + moves[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = T;
    else if (e.key === "Escape") next = null;
    else return;
    e.preventDefault();
    select(next);
  }, on);
  grid.addEventListener("focus", () => { if (state === "settled" && sel === null) select(T); }, on);

  // ---- the sweep ---------------------------------------------------------
  // blank: pencil dots only, waiting to be tuned in. sweep: the pen runs. settled: written.
  let state: "blank" | "sweep" | "settled" = "blank";
  let t = 0; // ms into the sweep
  let wall = 0; // performance.now() at the last sweep frame
  const DELAY = 260;

  function redraw() {
    resetLayers();
    draw(state === "settled" ? Infinity : state === "blank" ? -Infinity : t);
  }

  function blank() {
    state = "blank";
    t = 0;
    wall = 0;
    select(null);
    grid.classList.remove("is-settled");
    setNum(0);
    tense(T + 1); // nothing written yet: the margin shows a pencil dot
    whenEl.textContent = `Counting since ${startDate}.`;
    grid.removeAttribute("aria-valuenow");
    grid.setAttribute("aria-valuetext", "Not written yet");
    redraw();
  }

  function settle() {
    state = "settled";
    redraw();
    grid.classList.add("is-settled");
    read(sel ?? T);
    light(sel);
    if (sel !== null) place(sel, true);
  }

  function tick(dt: number, live: boolean, visible: boolean) {
    if (reduced()) {
      if (state !== "settled") settle();
      return;
    }
    if (!visible) {
      // Off air: the page goes back to blank, ready to be written again.
      if (state !== "blank") blank();
      return;
    }
    if (state === "blank") {
      if (!live) return;
      state = "sweep";
      t = -DELAY;
      tense(0); // the pen is writing
    }
    if (state !== "sweep" || !live) {
      wall = 0;
      return; // a sweep holds its breath while the signal wobbles
    }
    // Wall time, so a slow device still finishes on time; a long gap (a hidden tab) is skipped.
    const nowMs = performance.now();
    t += wall ? Math.min(250, nowMs - wall) : dt * 1000;
    wall = nowMs;
    draw(t);
    setNum(t <= 0 ? 0 : Math.floor(T * ease(clamp(t / D, 0, 1))));
    if (t >= D + TAU) settle();
  }

  // ---- lifecycle ---------------------------------------------------------
  blank();
  const ro = new ResizeObserver(() => snapPaper());
  ro.observe(paper);
  ro.observe(grid);
  document.fonts?.ready.then(() => { if (!ac.signal.aborted) snapPaper(); });

  return {
    layout(aw, ah) {
      const out = layout(aw, ah);
      snapPaper();
      return out;
    },
    tick,
    day: T + 1,
    destroy() {
      ac.abort();
      ro.disconnect();
      cancelAnimationFrame(springRaf);
    },
  };
}
