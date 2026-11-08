import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "./log.css";
import { person } from "../../content";
import type { Station } from "../types";
import { createDays } from "./log-days";

// Jagrit: set LOG_START to the day you started counting (YYYY-MM-DD).
// 2019-01-01 is a PLACEHOLDER, not a real date. Every number on this station
// (the marks, "Day N", "Counting since ...") is computed from it.
const LOG_START = "2019-01-01";

const YEAR_LABELS = 26; // room above the grid for the year labels (matches .lg-days padding-top)

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// The wave along the deck: a row of pen strokes, ////, three to a cycle.
const TAU = Math.PI * 2;
const wave = (u: number) => {
  const f = ((((u / TAU) * 3) % 1) + 1) % 1;
  return f < 0.82 ? -0.9 + (f / 0.82) * 1.8 : 0.9 - ((f - 0.82) / 0.18) * 1.8;
};

const station: Station = {
  meta: { id: "log", label: "Log", field: "#EBF4EE", ink: "#1D3A94", wave },
  mount(el, ctx) {
    el.innerHTML = `
      <div class="lg-rule" aria-hidden="true"></div>
      <div class="lg">
        <div class="lg-side">
          <h2 class="lg-line big">${esc(person.line)}</h2>
          <div class="lg-read is-today">
            <span class="lg-glyph" aria-hidden="true"></span>
            <p class="lg-daynum">Day <span class="lg-n">1</span></p>
            <p class="lg-when">&nbsp;</p>
            <p class="lg-note">One pen mark for every day since I started counting. The red one is today.</p>
          </div>
        </div>
        <div class="lg-days">
          <div class="lg-grid" data-own tabindex="0" role="slider" aria-label="One mark per day since I started counting">
            <canvas class="lg-canvas" aria-hidden="true"></canvas>
            <div class="lg-labels" aria-hidden="true"></div>
            <span class="lg-today" aria-hidden="true"></span>
            <span class="lg-cursor" aria-hidden="true"></span>
          </div>
        </div>
      </div>`;

    const $ = <T extends HTMLElement = HTMLElement>(s: string) => el.querySelector(s) as T;
    const lg = $(".lg");
    const line = $(".lg-line");
    const read = $(".lg-read");

    const days = createDays(
      {
        paper: el,
        grid: $(".lg-grid"),
        canvas: $<HTMLCanvasElement>(".lg-canvas"),
        labels: $(".lg-labels"),
        today: $(".lg-today"),
        cursor: $(".lg-cursor"),
        num: $(".lg-n"),
        when: $(".lg-when"),
        read,
      },
      LOG_START,
      ctx.reduced,
    );

    // The grid gets whatever room the words leave over.
    const fit = () => {
      const cs = getComputedStyle(lg);
      const innerW = lg.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const innerH = lg.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (innerW <= 0 || innerH <= 0) return;
      const wide = cs.getPropertyValue("--wide").trim() === "1";
      let aw: number, ah: number;
      if (wide) {
        const tmin = parseFloat(cs.getPropertyValue("--tmin")) || 320;
        aw = innerW - tmin - (parseFloat(cs.columnGap) || 0);
        ah = innerH - YEAR_LABELS;
      } else {
        const gap = parseFloat(cs.rowGap) || 0;
        aw = innerW;
        ah = innerH - line.offsetHeight - read.offsetHeight - gap * 2 - YEAR_LABELS;
      }
      const { w, h } = days.layout(aw, ah);
      lg.style.setProperty("--gw", `${w}px`);
      lg.style.setProperty("--gh", `${h + YEAR_LABELS}px`);
    };

    // The words reflow as fonts arrive or the stage changes size; refit then.
    const ro = new ResizeObserver(() => fit());
    ro.observe(lg);
    ro.observe(line);
    ro.observe(read);
    fit();

    return {
      tick(dt, live) {
        days.tick(dt, live, el.classList.contains("on"));
      },
      resize: fit,
      destroy() {
        ro.disconnect();
        days.destroy();
      },
    };
  },
};

export default station;
