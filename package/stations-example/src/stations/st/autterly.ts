import "./autterly.css";
import { works } from "../../content";
import type { Station } from "../types";

const work = works.find((w) => w.id === "autterly")!;

// One request at a time goes round the loop: you ask, it remembers, it reaches
// for a tool, it acts. The whole ring is drawn inside the phone on purpose.
const ASKS = [
  { ask: "Play the music.", act: ["Plays", "the music"], reply: "Playing." },
  { ask: "Open my notes.", act: ["Opens", "the app"], reply: "Opened." },
  { ask: "Sort the junk.", act: ["Sorts", "the junk"], reply: "Sorted." },
];

const R = 64;
const CX = 150;
const CY = 104;
// node angles, clockwise from the top: you, memory, tools, act
const NODES = [-90, 0, 90, 180];
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
};

const TYPE = 0.9; // typing the request
const RUN = 2.6; // round to the act node
const HOLD = 1.8; // reply on screen
const BACK = 0.7; // close the loop
const CYCLE = TYPE + RUN + HOLD + BACK;

const station: Station = {
  meta: {
    id: "autterly",
    label: "Autterly",
    field: "#DCE3EC",
    ink: "#0B1A30",
    wave: (u) => 1.5 * Math.sin(u * 1.8) * Math.sin(u * 0.3) ** 2,
  },
  mount(el, ctx) {
    const [mx, my] = at(0);
    const [tx, ty] = at(90);
    const [ax, ay] = at(180);
    const [ux, uy] = at(-90);
    el.innerHTML = `
      <div class="au-copy">
        <h2 class="au-name">${work.title}</h2>
        <p class="au-what">${work.what}. <span>${work.status}.</span></p>
        <p class="au-line">${work.line}</p>
        <p class="au-detail det">${work.detail}</p>
      </div>
      <div class="au-dev">
      <div class="au-phone" aria-hidden="true">
        <div class="au-bar">
          <span class="au-time"></span>
          <span class="au-sig"><i></i><i></i><i></i><i></i></span>
        </div>
        <svg class="au-loop" viewBox="0 0 300 208">
          <circle class="au-ring" cx="${CX}" cy="${CY}" r="${R}" />
          <path class="au-trail" d="" />
          <g class="au-node" data-n="0"><circle cx="${ux}" cy="${uy}" r="6" /><text x="${ux}" y="${uy - 15}" text-anchor="middle">You ask</text></g>
          <g class="au-node" data-n="1"><circle cx="${mx}" cy="${my}" r="6" /><text x="${mx + 14}" y="${my + 4}">Memory</text></g>
          <g class="au-node" data-n="2"><circle cx="${tx}" cy="${ty}" r="6" /><text x="${tx}" y="${ty + 24}" text-anchor="middle">Tools</text></g>
          <g class="au-node" data-n="3"><circle cx="${ax}" cy="${ay}" r="6" /><text class="au-act" x="${ax - 14}" y="${ay - 3}" text-anchor="end"><tspan x="${ax - 14}"></tspan><tspan x="${ax - 14}" dy="15"></tspan></text></g>
          <circle class="au-dot" r="5" cx="${ux}" cy="${uy}" />
        </svg>
        <div class="au-chat">
          <p class="au-ask"></p>
          <p class="au-reply"></p>
        </div>
      </div>
      <p class="au-stays det">The loop stays on the phone.</p>
      </div>`;

    const $ = <T extends Element>(s: string) => el.querySelector(s) as T;
    const time = $<HTMLElement>(".au-time");
    const nodes = [...el.querySelectorAll<SVGGElement>(".au-node")];
    const actT = [...el.querySelectorAll<SVGTSpanElement>(".au-act tspan")];
    const dot = $<SVGCircleElement>(".au-dot");
    const trail = $<SVGPathElement>(".au-trail");
    const askEl = $<HTMLElement>(".au-ask");
    const replyEl = $<HTMLElement>(".au-reply");

    let t = 0;
    let k = 0;
    let key = "";
    let clockKey = "";

    const setClock = () => {
      const d = new Date();
      const s = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
      if (s !== clockKey) time.textContent = clockKey = s;
    };

    // angle of the dot in degrees from the top, and how far the trail reaches
    const draw = (deg: number, from: number) => {
      const [x, y] = at(deg);
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", y.toFixed(2));
      const span = deg - from;
      if (span <= 0.5) {
        trail.setAttribute("d", "");
        return;
      }
      const [sx, sy] = at(from);
      trail.setAttribute("d", `M${sx.toFixed(2)} ${sy.toFixed(2)} A${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`);
    };

    const render = (phase: string, typed: number, deg: number, from: number) => {
      const a = ASKS[k];
      const nextKey = `${k}:${phase}:${typed}:${Math.round(deg)}`;
      if (nextKey === key) return;
      key = nextKey;
      actT[0].textContent = a.act[0];
      actT[1].textContent = a.act[1];
      askEl.textContent = a.ask.slice(0, typed);
      askEl.classList.toggle("on", typed > 0);
      replyEl.textContent = a.reply;
      replyEl.classList.toggle("on", phase === "hold");
      // a node lights once the dot has reached it
      nodes.forEach((n, i) => n.classList.toggle("on", phase !== "idle" && deg >= NODES[i] - 0.5 && (i > 0 || typed > 0)));
      draw(deg, from);
    };

    return {
      tick(dt, live) {
        if (!live) {
          t = 0;
          render("idle", 0, -90, -90);
          return;
        }
        setClock();
        const a = ASKS[k];
        if (ctx.reduced()) {
          render("hold", a.ask.length, 180, -90);
          return;
        }
        t += dt;
        if (t < TYPE) render("type", Math.ceil((t / TYPE) * a.ask.length), -90, -90);
        else if (t < TYPE + RUN) {
          const u = (t - TYPE) / RUN;
          const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
          render("run", a.ask.length, -90 + 270 * e, -90);
        } else if (t < TYPE + RUN + HOLD) render("hold", a.ask.length, 180, -90);
        else if (t < CYCLE) {
          const u = (t - TYPE - RUN - HOLD) / BACK;
          render("back", a.ask.length, 180 + 90 * u * u, 180 + 90 * u * u);
        } else {
          t = 0;
          k = (k + 1) % ASKS.length;
          ctx.announce(`${ASKS[k].ask} ${ASKS[k].reply}`);
        }
      },
    };
  },
};

export default station;
