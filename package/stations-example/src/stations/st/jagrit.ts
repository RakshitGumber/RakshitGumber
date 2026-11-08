import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/700.css";
import "./jagrit.css";
import { person } from "../../content";
import { Sfx } from "../sound";
import type { Station } from "../types";
import { JScreen, LINES } from "./jagrit-screen";

// The landing. His game screen, big: the pixel window from the Cartridge
// design with nothing of the console around it. It boots when the dial locks.

// survives a remount of the design
let soundWanted = true;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const station: Station = {
  meta: {
    id: "jagrit",
    label: "Jagrit",
    field: "#2D160C",
    ink: "#91AB7F",
    // a square wave with soft shoulders: an 8-bit voice
    wave: (u) => Math.tanh(4 * Math.sin(u)) * 0.9 + Math.sin(u * 3) * 0.12,
  },

  mount(el, ctx) {
    const [first, ...rest] = person.name.split(" ");
    el.innerHTML = `
    <div class="jg">
      <h2 class="jg-name big"><span>${esc(first)}</span> <span>${esc(rest.join(" "))}</span></h2>
      <div class="jg-well">
        <button type="button" class="jg-screen" aria-label="Jagrit's game screen, off.">
          <canvas aria-hidden="true"></canvas>
        </button>
      </div>
      <div class="jg-foot">
        <p class="jg-hint"><i class="jg-tri" aria-hidden="true"></i><span class="jg-coarse">Tap the screen to talk</span><span class="jg-fine">Click the screen to talk</span></p>
        <button type="button" class="jg-sound" aria-pressed="${soundWanted}">
          <svg viewBox="0 0 11 9" aria-hidden="true" shape-rendering="crispEdges">
            <path d="M0 3h2v3H0zM2 2h1v5H2zM3 1h1v7H3zM4 0h1v9H4z"/>
            <path class="jg-on" d="M6 3h1v3H6zM8 1h1v1H8zM9 2h1v5H9zM8 7h1v1H8z"/>
            <path class="jg-off" d="M6 2h1v1H6zM7 3h1v1H7zM8 4h1v1H8zM9 5h1v1H9zM10 6h1v1h-1zM10 2h1v1h-1zM9 3h1v1H9zM7 5h1v1H7zM6 6h1v1H6z"/>
          </svg>
          <span class="jg-sl">Sound</span>
        </button>
      </div>
    </div>`;

    const root = el.querySelector<HTMLElement>(".jg")!;
    const well = el.querySelector<HTMLElement>(".jg-well")!;
    const btn = el.querySelector<HTMLButtonElement>(".jg-screen")!;
    const canvas = btn.querySelector("canvas")!;
    const soundBtn = el.querySelector<HTMLButtonElement>(".jg-sound")!;

    // no sound until a tap on the screen says someone is listening
    const sfx = new Sfx();
    let armed = false;
    const syncSound = () => {
      sfx.on = armed && soundWanted;
      soundBtn.setAttribute("aria-pressed", String(soundWanted));
    };
    syncSound();

    const portrait = new Image();
    portrait.decoding = "async";
    portrait.src = "/art/portrait.png";

    let live = false;
    let booted = false;

    const screen = new JScreen(canvas, portrait, {
      sfx,
      reduced: ctx.reduced,
      onLine: (page) => {
        const line = LINES[page];
        const last = page === LINES.length - 1;
        btn.setAttribute("aria-label", `Jagrit says, ${page + 1} of ${LINES.length}: ${line} Press to ${last ? "start again" : "continue"}.`);
        ctx.announce(`Jagrit says: ${line}`);
      },
    });

    const refresh = () => {
      screen.invalidate();
      screen.draw(performance.now());
      ctx.wake();
    };

    // ---- size: the window fills the well, snapped to whole device pixels ----
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const W = well.clientWidth;
      const H = well.clientHeight;
      if (!W || !H) return;
      // keep the scene's proportions: no squatter than 5:4, no taller than 3:4
      let w = Math.min(W, 920);
      const h = Math.min(H, w / 0.74);
      if (w / h > 1.25) w = h * 1.25;
      let wd = Math.floor(w * dpr);
      let hd = Math.floor(h * dpr);
      // whole frame pixels, so the bevel lands on the grid
      const U = JScreen.unit(wd, hd);
      wd -= wd % U;
      hd -= hd % U;
      btn.style.width = `${wd / dpr}px`;
      btn.style.height = `${hd / dpr}px`;
      root.style.setProperty("--u", `${U / dpr}px`);
      screen.layout(wd, hd, dpr);
      screen.draw(performance.now());
    };

    // ---- input ----
    const press = () => {
      if (!live) return;
      if (!armed) {
        armed = true;
        syncSound();
        root.classList.add("talked");
      }
      screen.press(performance.now());
      ctx.wake();
    };
    const setPressed = (on: boolean) => {
      if (screen.pressed === on) return;
      screen.pressed = on;
      ctx.wake();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0 && live) setPressed(true);
    };
    const onRelease = () => setPressed(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !e.repeat && live) setPressed(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") setPressed(false);
    };
    const onSound = () => {
      soundWanted = !soundWanted;
      syncSound();
      if (soundWanted && armed) sfx.press();
    };

    btn.addEventListener("click", press);
    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("keydown", onKeyDown);
    btn.addEventListener("keyup", onKeyUp);
    btn.addEventListener("blur", onRelease);
    window.addEventListener("pointerup", onRelease);
    window.addEventListener("pointercancel", onRelease);
    soundBtn.addEventListener("click", onSound);
    portrait.addEventListener("load", refresh);

    let alive = true;
    if (document.fonts) {
      Promise.all([document.fonts.load(`400 16px "Pixelify Sans"`), document.fonts.load(`700 16px "Pixelify Sans"`)])
        .catch(() => undefined)
        .then(() => {
          if (alive) refresh();
        });
    }

    fit();

    return {
      tick(_dt, isLive) {
        const now = performance.now();
        if (isLive !== live) {
          if (isLive) {
            screen.power(now, !booted);
            booted = true;
          } else screen.pressed = false;
          live = isLive;
          btn.classList.toggle("is-on", live);
        }
        if (live) screen.draw(now);
      },
      resize: fit,
      destroy() {
        alive = false;
        btn.removeEventListener("click", press);
        btn.removeEventListener("pointerdown", onDown);
        btn.removeEventListener("keydown", onKeyDown);
        btn.removeEventListener("keyup", onKeyUp);
        btn.removeEventListener("blur", onRelease);
        window.removeEventListener("pointerup", onRelease);
        window.removeEventListener("pointercancel", onRelease);
        soundBtn.removeEventListener("click", onSound);
        portrait.removeEventListener("load", refresh);
        sfx.close();
      },
    };
  },
};

export default station;
