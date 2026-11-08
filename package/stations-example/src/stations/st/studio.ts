import "@fontsource-variable/archivo/wdth.css";
import "./studio.css";
import { person, works } from "../../content";
import type { Station } from "../types";
import { createMachine, type Sprite, type PartKey } from "./studio-machine";

// World's Smallest Studio, as a drawing sheet. The drawing on it is the
// exploded machine the studio builds with; the title block carries the facts.
// On air, the machine comes apart on a spring. Pull it apart or push it back
// together with a vertical drag on the drawing, a tap, or the button.

const wss = works.find((w) => w.id === "wss")!;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

// "The studio I build my apps under. Apps should match. ..." → one note each.
const NOTES = wss.detail.split(/(?<=\.)\s+/);

// The 64 px portrait (stand-in art), shown at 2x or 3x and nothing in between.
const PORTRAIT = { src: "/art/portrait.png", px: 64 };

// Pixel-art parts go here when he draws them. Anything left out stays drawn
// in ink. See Sprite in studio-machine.ts for what the numbers mean.
const SPRITES: Partial<Record<PartKey, Sprite>> = {};

const ZONES_X = 8;
const ZONES_Y = 4;

const statusGlyph = `<svg class="glyph" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M7 1.4A5.6 5.6 0 0 0 7 12.6Z" fill="currentColor"/></svg>`;
const pullGlyph = `<svg class="glyph" viewBox="0 0 16 20" aria-hidden="true"><path d="M8 1.5v6M8 12.5v6M4 5.5 8 1.5l4 4M4 14.5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 9.2h12M2 10.8h12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;

function template() {
  const nums = Array.from({ length: ZONES_X }, (_, i) => `<span>${ZONES_X - i}</span>`).join("");
  const lets = Array.from({ length: ZONES_Y }, (_, i) => `<span>${"DCBA"[i + 4 - ZONES_Y]}</span>`).join("");
  return `
<div class="sheet">
  <div class="zone zt" aria-hidden="true">${nums}</div>
  <div class="zone zb" aria-hidden="true">${nums}</div>
  <div class="zone zl" aria-hidden="true">${lets}</div>
  <div class="zone zr" aria-hidden="true">${lets}</div>
  <div class="in">
    <section class="notes det" aria-labelledby="ss-notes-h">
      <h3 class="nh" id="ss-notes-h">Notes</h3>
      <ol>${NOTES.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>
    </section>
    <figure class="fig">
      <div class="dwg">
        <svg class="mx" aria-hidden="true"></svg>
        <img class="op" src="${PORTRAIT.src}" alt="" width="${PORTRAIT.px}" height="${PORTRAIT.px}" decoding="async"/>
      </div>
      <figcaption class="sr">Exploded view of what the studio builds with. Operator: Jagrit, played by a stand-in pixel robot. Pixel art: a slime standing on a game tile. TypeScript, Python and Rust: a key plate, a coil spring and a gear, obsessed with all three. Game development: the chassis everything sits on. Core: turning into a better learner every day.</figcaption>
      <div class="foot">
        <span class="figno"><b>Fig. 1</b> What the studio builds with.</span>
        <span class="hint" aria-hidden="true">Or pull the drawing up and down.</span>
        <span class="scale" aria-hidden="true">${"<b><i></i></b>".repeat(5)}</span>
        <button class="pull" type="button">${pullGlyph}<span class="pl">Take it apart</span></button>
      </div>
    </figure>
    <footer class="tb">
      <div class="tb-head">
        <h2 class="name big">${esc(wss.title)}</h2>
        <p class="line">${esc(wss.line)}</p>
      </div>
      <dl class="cells">
        <div class="c c-st"><dt>Status</dt><dd>${statusGlyph}${esc(wss.status)}</dd></div>
        <div class="c c-by"><dt>Drawn by</dt><dd>${esc(person.first)}</dd></div>
        <div class="c c-url"><dt>Link</dt><dd><a href="${esc(wss.url ?? "")}" rel="noopener">${esc(host(wss.url ?? ""))}</a></dd></div>
      </dl>
    </footer>
  </div>
</div>`;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Past either stop the drawing gives, less and less: a hand pulling on a part.
const rubber = (raw: number) => {
  const L = 0.2;
  if (raw > 1) return 1 + L * (1 - Math.exp(-(raw - 1) / L));
  if (raw < 0) return -L * (1 - Math.exp(raw / L));
  return raw;
};

const station: Station = {
  meta: {
    id: "studio",
    label: "Studio",
    field: "#EDF1F4",
    ink: "#16295E",
    // gear teeth: flat lands and straight flanks, the spur gear's profile unrolled
    wave: (u) => 0.72 * clamp((2.4 * 2 * Math.asin(Math.sin(u * 2))) / Math.PI, -1, 1),
  },

  mount(section, ctx) {
    section.innerHTML = template();
    const $ = <T extends Element>(s: string) => section.querySelector(s) as T;
    const dwg = $<HTMLDivElement>(".dwg");
    const svg = $<SVGSVGElement>(".mx");
    const op = $<HTMLImageElement>(".op");
    const pull = $<HTMLButtonElement>(".pull");
    const pullLabel = $<HTMLSpanElement>(".pl");
    const cells = [...section.querySelectorAll<HTMLElement>(".scale i")];

    const machine = createMachine({ svg, op, sprites: SPRITES });

    let rm = ctx.reduced();
    let x = rm ? 1 : 0; // explode amount: 0 together, 1 apart
    let v = 0;
    let target = x;
    let away = true; // not on air since it was last hidden
    let drafted = false;
    let wait = 0; // seconds until it comes apart after a lock
    let draftLeft = 0;
    let blinkIn = 3.4;
    let blinkOff = 0;
    let span = 300; // px of drag from together to apart
    let alive = true;

    const setLabel = () => {
      const t = target > 0.5 ? "Put it together" : "Take it apart";
      if (pullLabel.textContent !== t) pullLabel.textContent = t;
    };
    setLabel();

    const paint = (force = false) => {
      const E = machine.update(x, force);
      if (E) for (let k = 0; k < 5; k++) cells[k].style.transform = `scaleX(${E[4 - k].toFixed(3)})`;
    };

    // ---- layout
    let lastW = 0;
    let lastH = 0;
    const layout = (force = false) => {
      const w = dwg.clientWidth;
      const h = dwg.clientHeight;
      if (!w || !h) return;
      if (!force && w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      // narrow or short drawings use the compact callouts (shorter notes, smaller type)
      const phone = w < 560 || h < 520;
      machine.layout(w, h, phone, {
        opPx: PORTRAIT.px * (!phone && h > 700 ? 3 : 2),
        labelRoom: phone ? 92 : 250,
        gutter: phone ? 6 : 16,
      });
      span = clamp(h * 0.5, 180, 360);
      paint(true);
    };
    layout(true);
    // before its first lock the sheet is blank; the drawing is drafted on air
    if (!rm) {
      svg.classList.add("blank");
      op.classList.add("blank");
    }
    document.fonts?.ready.then(() => {
      if (alive) machine.remeasure();
    });
    const ro = new ResizeObserver(() => layout());
    ro.observe(dwg);

    // ---- toggling
    const setTarget = (t: number, vel = 0) => {
      target = t;
      wait = 0;
      setLabel();
      if (rm) {
        x = t;
        v = 0;
        paint();
        return;
      }
      v = vel;
      ctx.wake();
    };
    const toggle = () => setTarget(target > 0.5 ? 0 : 1);

    pull.addEventListener("click", toggle);
    // Up pulls it apart, Down pushes it together; Left and Right still tune.
    const onPullKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      e.stopPropagation();
      setTarget(e.key === "ArrowUp" ? 1 : 0);
    };
    pull.addEventListener("keydown", onPullKey);

    // ---- pulling on the drawing: vertical drags are ours, sideways ones tune
    type Down = { id: number; x0: number; y0: number; t0: number; p0: number; on: boolean; s: { t: number; p: number }[] };
    let down: Down | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), p0: x, on: false, s: [] };
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      if (e.buttons === 0 && e.pointerType === "mouse") {
        down = null;
        return;
      }
      const dx = e.clientX - down.x0;
      const dy = e.clientY - down.y0;
      if (!down.on) {
        if (Math.abs(dy) < 7 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
        down.on = true;
        down.y0 = e.clientY;
        down.p0 = x;
        wait = 0;
        try {
          dwg.setPointerCapture(e.pointerId);
        } catch {
          /* released already */
        }
        dwg.classList.add("pulling");
      }
      // the gesture is ours now: keep it from the dial
      e.stopPropagation();
      x = rubber(down.p0 - (e.clientY - down.y0) / span);
      v = 0;
      const now = performance.now();
      down.s.push({ t: now, p: x });
      while (down.s.length > 2 && now - down.s[0].t > 90) down.s.shift();
      const t = x > 0.5 ? 1 : 0;
      if (t !== target) {
        target = t;
        setLabel();
      }
      paint();
      ctx.wake();
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const d = down;
      down = null;
      dwg.classList.remove("pulling");
      if (!d.on) {
        const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0);
        if (e.type === "pointerup" && moved < 6 && performance.now() - d.t0 < 400) toggle();
        return;
      }
      let vel = 0;
      const s = d.s;
      if (s.length > 1) {
        const a = s[0];
        const b = s[s.length - 1];
        if (b.t - a.t > 8 && performance.now() - b.t < 80) vel = (b.p - a.p) / ((b.t - a.t) / 1000);
      }
      vel = clamp(vel, -9, 9);
      setTarget(vel > 1.4 ? 1 : vel < -1.4 ? 0 : x > 0.5 ? 1 : 0, vel);
    };
    dwg.addEventListener("pointerdown", onDown);
    dwg.addEventListener("pointermove", onMove);
    dwg.addEventListener("pointerup", onUp);
    dwg.addEventListener("pointercancel", onUp);
    dwg.addEventListener("lostpointercapture", onUp);

    const unblank = () => {
      svg.classList.remove("blank");
      op.classList.remove("blank");
    };
    const stopDrafting = () => {
      svg.classList.remove("drafting");
      op.classList.remove("arriving");
      draftLeft = 0;
    };

    return {
      tick(dt, live) {
        if (!section.classList.contains("on")) {
          // off air: reset quietly so the next tune-in shows it coming apart
          if (!away) {
            away = true;
            down = null;
            dwg.classList.remove("pulling");
            stopDrafting();
            machine.setBlink(false);
            if (!rm) {
              x = target = 0;
              v = 0;
              wait = 0;
              setLabel();
              paint();
            }
          }
          return;
        }
        if (!live) return;

        const r = ctx.reduced();
        if (r !== rm) {
          rm = r;
          if (rm) {
            unblank();
            stopDrafting();
            machine.setBlink(false);
            x = target = 1;
            v = 0;
            wait = 0;
            setLabel();
            paint();
          }
        }
        if (away) {
          away = false;
          if (rm) {
            unblank();
            x = target = 1;
            setLabel();
            paint();
          } else if (!drafted) {
            // first time on air: draft the drawing in, then take it apart
            drafted = true;
            unblank();
            svg.classList.add("drafting");
            op.classList.add("arriving");
            // the gear and spring are redrawn every frame they move, which would
            // restart their draw-in: it comes apart once the ink is down
            draftLeft = 1.8;
            wait = 1.8;
          } else wait = 0.35;
        }
        if (rm) return;

        if (draftLeft > 0) {
          draftLeft -= dt;
          if (draftLeft <= 0) stopDrafting();
        }
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) setTarget(1);
        }

        // a slightly underdamped spring: parts land, overshoot a hair, settle
        if (!down?.on && (x !== target || v !== 0)) {
          const k = 64;
          const c = 2 * 0.58 * Math.sqrt(k);
          const step = Math.min(dt, 1 / 20);
          const n = Math.max(1, Math.ceil(step * 240));
          const h = step / n;
          for (let i = 0; i < n; i++) {
            v += (k * (target - x) - c * v) * h;
            x += v * h;
          }
          if (Math.abs(target - x) < 0.0005 && Math.abs(v) < 0.002) {
            x = target;
            v = 0;
          }
          paint();
        }

        // the slime blinks: the only idle motion on the sheet
        if (blinkOff > 0) {
          blinkOff -= dt;
          if (blinkOff <= 0) machine.setBlink(false);
        } else {
          blinkIn -= dt;
          if (blinkIn <= 0) {
            machine.setBlink(true);
            blinkOff = 0.14;
            blinkIn = 2.6 + Math.random() * 2.8;
          }
        }
      },
      resize() {
        layout();
      },
      destroy() {
        alive = false;
        ro.disconnect();
        pull.removeEventListener("click", toggle);
        pull.removeEventListener("keydown", onPullKey);
        dwg.removeEventListener("pointerdown", onDown);
        dwg.removeEventListener("pointermove", onMove);
        dwg.removeEventListener("pointerup", onUp);
        dwg.removeEventListener("pointercancel", onUp);
        dwg.removeEventListener("lostpointercapture", onUp);
      },
    };
  },
};

export default station;
