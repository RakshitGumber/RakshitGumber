import "./opinions.css";
import { opinions } from "../../content";
import type { Station } from "../types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Ported from Tuner. The opinion is the big type; each new one arrives as a
// small re-tune: the weight drops to a hairline, shivers, and slams back.
const station: Station = {
  meta: {
    id: "opinions",
    label: "Opinions",
    field: "#5A3FD6",
    ink: "#FFF6E5",
    wave: (u) => (u / (Math.PI * 2) - Math.floor(u / (Math.PI * 2))) * 2 - 1,
  },
  mount(el, ctx) {
    el.innerHTML = `
      <h2 class="label">Opinions</h2>
      <blockquote class="big quote"><p>${esc(opinions[0])}</p></blockquote>
      <div class="ctl det">
        <span class="count">1 of ${opinions.length}</span>
        <button type="button" class="next">Next</button>
        <button type="button" class="pause" aria-pressed="false">Pause</button>
      </div>`;
    const quote = el.querySelector<HTMLElement>(".quote")!;
    const quoteP = quote.querySelector("p")!;
    const countEl = el.querySelector<HTMLElement>(".count")!;
    const nextBtn = el.querySelector<HTMLButtonElement>(".next")!;
    const pauseBtn = el.querySelector<HTMLButtonElement>(".pause")!;

    let op = 0;
    let clock = 0;
    let dip = -1; // -1 idle, else 0..1 through a re-tune
    let paused = false;

    const set = (i: number) => {
      op = (i + opinions.length) % opinions.length;
      quoteP.textContent = opinions[op];
      countEl.textContent = `${op + 1} of ${opinions.length}`;
      ctx.announce(opinions[op]);
    };
    const settle = () => {
      dip = -1;
      quote.style.removeProperty("--dip");
      quote.style.translate = "";
    };
    const next = () => {
      clock = 0;
      if (ctx.reduced()) set(op + 1);
      else if (dip < 0) dip = 0;
      ctx.wake();
    };
    const pause = () => {
      paused = !paused;
      pauseBtn.textContent = paused ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-pressed", String(paused));
    };
    nextBtn.addEventListener("click", next);
    pauseBtn.addEventListener("click", pause);

    return {
      tick(dt, live) {
        if (!live) {
          if (dip >= 0) settle();
          return;
        }
        if (!paused && dip < 0 && !ctx.reduced()) {
          clock += dt;
          if (clock > 7) next();
        }
        if (dip < 0) return;
        const before = dip;
        dip += dt / 0.9;
        if (before < 0.5 && dip >= 0.5) set(op + 1);
        if (dip >= 1) return settle();
        const d = Math.sin(Math.PI * dip);
        quote.style.setProperty("--dip", d.toFixed(3));
        quote.style.translate = `${((Math.random() - 0.5) * 10 * d).toFixed(1)}px 0`;
      },
      destroy() {
        nextBtn.removeEventListener("click", next);
        pauseBtn.removeEventListener("click", pause);
      },
    };
  },
};

export default station;
