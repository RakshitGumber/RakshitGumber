import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import "./chiki.css";
import { works } from "../../content";
import type { Station } from "../types";
import { DIR_NAME, DX, DY, LEVELS, awake, home, slide, type Dir, type Level, type XY } from "./chiki-game";
import {
  C,
  CELL,
  FRAME,
  LOGO_H,
  LOGO_W,
  PAINTS,
  boardArt,
  drawBoard,
  drawLogo,
  type Eyes,
  type Particle,
  type PieceDraw,
} from "./chiki-draw";

// Chiki: a small board in the spirit of the jam game. Blocks slide to the wall
// straight through each other, and whatever they pass through gets knocked
// back a step. The board is quiet when every block is asleep in its own bed.

const work = works.find((w) => w.id === "chiki")!;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

type Spring = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; on: boolean };
type Slide = {
  i: number;
  d: Dir;
  from: XY;
  dist: number;
  t: number;
  dur: number;
  knocks: { j: number; step: number; fired: boolean }[];
};

const station: Station = {
  meta: {
    id: "chiki",
    label: "Chiki",
    field: C.field,
    ink: C.ink,
    // a sine in four steps: the signal of something that snaps into place
    wave: (u) => Math.round(Math.sin(u) * 2) / 2,
  },

  mount(sec, ctx) {
    sec.innerHTML = `
    <div class="ck">
      <div class="ck-info">
        <div class="ck-head">
          <h2 class="big ck-logo"><span class="sr">${work.title}</span><canvas aria-hidden="true"></canvas></h2>
          <p class="ck-tags"><span class="ck-what">${work.what}</span><span class="ck-status">${work.status}</span></p>
        </div>
        <p class="ck-line">${work.line}</p>
        <p class="ck-detail det">${work.detail} <span class="ck-note">The board here is a small one in its spirit, not the game itself.</span></p>
      </div>
      <div class="ck-play">
        <div class="ck-wrap">
          <div class="ck-board" data-own role="group" aria-roledescription="puzzle board" aria-describedby="ck-how">
            <canvas aria-hidden="true"></canvas>
          </div>
        </div>
        <div class="ck-bar">
          <div class="ck-lv" role="group" aria-label="Boards">
            ${LEVELS.map((_, i) => `<button type="button" class="ck-pip" data-lv="${i}">${i + 1}</button>`).join("")}
          </div>
          <p class="ck-stat" aria-hidden="true"><span class="ck-awake"></span><span class="ck-moves"></span></p>
          <div class="ck-act">
            <button type="button" class="ck-btn ck-undo" aria-keyshortcuts="Z">Undo</button>
            <button type="button" class="ck-btn ck-reset" aria-keyshortcuts="R">Reset</button>
            <button type="button" class="ck-btn ck-next" hidden>Next</button>
          </div>
        </div>
        <p class="ck-how" id="ck-how">Swipe a block. It slides to the wall straight through the others, knocking each one back a step. Put every block in its bed.<span class="ck-keys"> Keys: <kbd>Tab</kbd> picks a block, arrows push it, <kbd>Z</kbd> undoes, <kbd>R</kbd> resets.</span></p>
      </div>
    </div>`;

    const $ = <T extends Element>(s: string) => sec.querySelector(s) as T;
    const logoCv = $<HTMLCanvasElement>(".ck-logo canvas");
    const head = $<HTMLElement>(".ck-head");
    const wrap = $<HTMLElement>(".ck-wrap");
    const board = $<HTMLElement>(".ck-board");
    const cv = $<HTMLCanvasElement>(".ck-board canvas");
    const g = cv.getContext("2d")!;
    const lg = logoCv.getContext("2d")!;
    const lvNav = $<HTMLElement>(".ck-lv");
    const pips = [...sec.querySelectorAll<HTMLButtonElement>(".ck-pip")];
    const awakeEl = $<HTMLElement>(".ck-awake");
    const movesEl = $<HTMLElement>(".ck-moves");
    const undoBtn = $<HTMLButtonElement>(".ck-undo");
    const resetBtn = $<HTMLButtonElement>(".ck-reset");
    const nextBtn = $<HTMLButtonElement>(".ck-next");

    /* ---------------------------------------------------------- state */
    let lv = 0;
    let L: Level = LEVELS[0];
    let pos: XY[] = [];
    let hist: XY[][] = [];
    let moves = 0;
    let won = false;
    let celebrated = false;
    const solved = LEVELS.map(() => false);
    let sel = 0;
    let btns: HTMLButtonElement[] = [];

    // what is on screen, in cells
    let vis: Spring[] = [];
    let sq: { v: number; vel: number; d: Dir }[] = [];
    let shock: number[] = [];
    let blink: number[] = [];
    let jit: { t: number; x: number; y: number; next: number }[] = [];
    let anim: Slide | null = null;
    let parts: Particle[] = [];
    let shakeT = 0;
    let shakeD: Dir = 0;
    let banner = 0;
    let bannerV = 0;
    let calm = 0;
    let zT = 0;
    let clock = 0;
    let live = false;
    let dirty = true;
    let byKey = false; // the last move came from the keyboard

    // geometry
    let k = 4; // device px per art px on the board
    let dpr = 1;
    let art = boardArt(6, 6);

    const rm = () => ctx.reduced();
    const instant = () => rm() || !live;
    const name = (i: number) => PAINTS[i].name;

    /* ---------------------------------------------------------- level */
    const spring = (x: number, y: number): Spring => ({ x, y, vx: 0, vy: 0, tx: x, ty: y, on: false });

    const buildButtons = () => {
      btns.forEach((b) => b.remove());
      btns = pos.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ck-pc";
        b.style.setProperty("--pc", PAINTS[i].light);
        b.addEventListener("focus", () => {
          sel = i;
          dirty = true;
          ctx.wake();
        });
        board.appendChild(b);
        return b;
      });
    };

    const load = (n: number, drop = true) => {
      lv = n;
      L = LEVELS[n];
      pos = L.start.map((p) => [p[0], p[1]] as XY);
      hist = [];
      moves = 0;
      won = false;
      celebrated = false;
      anim = null;
      parts = [];
      banner = 0;
      bannerV = 0;
      calm = 0;
      // the first board points at the block to throw
      sel = n === 0 ? 1 : 0;
      const fall = drop && !instant();
      vis = pos.map(([x, y], i) => {
        const s = spring(x, y);
        if (fall) {
          // blocks drop in from above, one after another
          s.y = y - 3 - i * 1.4 - y * 0.15;
          s.vy = 2;
          s.on = true;
        }
        return s;
      });
      sq = pos.map(() => ({ v: 0, vel: 0, d: 2 as Dir }));
      shock = pos.map(() => 0);
      blink = pos.map(() => 1 + Math.random() * 3);
      jit = pos.map(() => ({ t: 0, x: 0, y: 0, next: 0.6 + Math.random() }));
      art = boardArt(L.w, L.h);
      buildButtons();
      layoutBoard();
      sync();
      dirty = true;
      ctx.wake();
    };

    /* ---------------------------------------------------------- ui */
    const cellLabel = (p: XY) => `row ${p[1] + 1}, column ${p[0] + 1}`;
    const sync = () => {
      const n = awake(L, pos);
      // the board reads as quiet once the last block has landed, not before
      const quiet = won && celebrated;
      awakeEl.textContent = quiet ? "Quiet" : `${n} awake`;
      movesEl.textContent = plural(moves, "move");
      undoBtn.disabled = !hist.length || won;
      resetBtn.disabled = !hist.length && !won;
      const last = lv === LEVELS.length - 1;
      nextBtn.hidden = !quiet;
      nextBtn.textContent = last ? "Again" : "Next";
      nextBtn.setAttribute("aria-label", last ? "Play board 1 again" : `Next board, ${lv + 2}`);
      pips.forEach((p, i) => {
        if (i === lv) p.setAttribute("aria-current", "step");
        else p.removeAttribute("aria-current");
        p.classList.toggle("done", solved[i]);
        p.setAttribute("aria-label", `Board ${i + 1}${solved[i] ? ", quiet" : ""}`);
      });
      board.setAttribute("aria-label", `Board ${lv + 1} of ${LEVELS.length}. ${quiet ? "Quiet." : `${n} awake, ${plural(moves, "move")}.`}`);
      btns.forEach((b, i) => {
        b.setAttribute(
          "aria-label",
          home(L, pos, i)
            ? `${cap(name(i))} block, asleep in its bed, ${cellLabel(pos[i])}`
            : `${cap(name(i))} block, awake, ${cellLabel(pos[i])}. Its bed: ${cellLabel(L.beds[i])}`,
        );
      });
      sec.classList.toggle("ck-won", quiet);
    };

    /* ---------------------------------------------------------- moves */
    const snap = () => {
      anim = null;
      vis.forEach((s, i) => {
        s.x = s.tx = pos[i][0];
        s.y = s.ty = pos[i][1];
        s.vx = s.vy = 0;
        s.on = false;
      });
      sq.forEach((q) => (q.v = q.vel = 0));
    };

    const burst = (x: number, y: number, n: number, cols: string[], sp: number, life: number, dir?: [number, number]) => {
      if (instant()) return;
      for (let q = 0; q < n; q++) {
        const a = dir ? Math.atan2(dir[1], dir[0]) + (Math.random() - 0.5) * 1.4 : Math.random() * Math.PI * 2;
        const v = sp * (0.5 + Math.random() * 0.7);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, c: cols[q % cols.length] });
      }
    };

    const celebrate = () => {
      celebrated = true;
      bannerY = bandY();
      sync();
      ctx.announce(`Quiet. Board ${lv + 1} done in ${plural(moves, "move")}.`);
      if (instant()) {
        banner = 1;
        calm = 1;
      } else {
        banner = 0.01;
        bannerV = 9;
        calm = 0;
        zT = 0.4;
        pos.forEach(([x, y]) => burst(x * CELL + 6, y * CELL + 6, 4, [C.cream, C.lilac], 30, 0.45));
      }
      dirty = true;
      // keyboard players land on the way forward
      if (byKey && board.contains(document.activeElement)) nextBtn.focus({ preventScroll: true });
    };

    const checkWin = () => {
      if (won || awake(L, pos)) return;
      won = true;
      solved[lv] = true;
      if (instant()) celebrate();
    };

    const bump = (i: number, d: Dir) => {
      ctx.announce(`${cap(name(i))} can't go ${DIR_NAME[d]}.`);
      if (instant()) return;
      // lean into the wall and spring back
      const s = vis[i];
      s.vx += DX[d] * 3.2;
      s.vy += DY[d] * 3.2;
      s.on = true;
      shock[i] = 0.18;
      dirty = true;
    };

    const act = (i: number, d: Dir) => {
      if (won || i < 0 || i >= pos.length) return;
      snap();
      sel = i;
      const res = slide(L, pos, i, d);
      if (!res) {
        bump(i, d);
        ctx.wake();
        return;
      }
      hist.push(pos.map((p) => [p[0], p[1]] as XY));
      const from = pos[i];
      pos = res.pos;
      moves++;
      const n = awake(L, pos);
      let say = `${cap(name(i))} ${DIR_NAME[d]}`;
      if (res.knocked.length) say += `, through ${res.knocked.map((q) => name(q.j)).join(" and ")}`;
      say += n ? `. ${n} awake.` : ".";
      ctx.announce(say);
      if (instant()) snap();
      else {
        anim = {
          i,
          d,
          from: [from[0], from[1]],
          dist: res.path.length,
          t: 0,
          dur: 0.05 + 0.042 * res.path.length,
          knocks: res.knocked.map((q) => ({ ...q, fired: false })),
        };
        // the knocked keep their place until the mover reaches them
        res.knocked.forEach(({ j }) => {
          vis[j].tx = pos[j][0];
          vis[j].ty = pos[j][1];
        });
      }
      sync();
      checkWin();
      dirty = true;
      ctx.wake();
      if (instant()) draw();
    };

    const undo = () => {
      if (!hist.length || won) return;
      pos = hist.pop()!;
      moves--;
      parts = [];
      snap();
      sync();
      ctx.announce(`Undone. ${awake(L, pos)} awake.`);
      dirty = true;
      draw();
    };

    const reset = () => {
      load(lv);
      ctx.announce(`Board ${lv + 1}, from the start.`);
      draw();
    };

    /* ---------------------------------------------------------- simulate */
    const stepSpring = (s: Spring, dt: number, kk: number, z: number) => {
      const c = 2 * Math.sqrt(kk) * z;
      const sub = Math.max(1, Math.ceil(dt * 240));
      const h = dt / sub;
      for (let q = 0; q < sub; q++) {
        s.vx += (kk * (s.tx - s.x) - c * s.vx) * h;
        s.vy += (kk * (s.ty - s.y) - c * s.vy) * h;
        s.x += s.vx * h;
        s.y += s.vy * h;
      }
      if (Math.abs(s.tx - s.x) < 0.004 && Math.abs(s.ty - s.y) < 0.004 && Math.abs(s.vx) + Math.abs(s.vy) < 0.05) {
        s.x = s.tx;
        s.y = s.ty;
        s.vx = s.vy = 0;
        s.on = false;
      }
    };

    const update = (dt: number) => {
      clock += dt;
      let busy = false;
      if (anim) {
        busy = true;
        const a = anim;
        a.t += dt;
        const u = Math.min(1, a.t / a.dur);
        // it leaves already moving and keeps speeding up into the wall
        const along = a.dist * (0.3 * u + 0.7 * u * u);
        const m = vis[a.i];
        m.x = a.from[0] + DX[a.d] * along;
        m.y = a.from[1] + DY[a.d] * along;
        for (const q of a.knocks) {
          if (q.fired || along < q.step + 0.45) continue;
          q.fired = true;
          // passing through: the other block is shoved back, hard
          const s = vis[q.j];
          s.on = true;
          s.vx = -DX[a.d] * 7;
          s.vy = -DY[a.d] * 7;
          shock[q.j] = 0.32;
          shock[a.i] = 0.2;
          const cx = (pos[q.j][0] + DX[a.d]) * CELL + 6;
          const cy = (pos[q.j][1] + DY[a.d]) * CELL + 6;
          burst(cx, cy, 6, [C.cream, PAINTS[q.j].light, PAINTS[a.i].light], 40, 0.3);
        }
        if (u >= 1) {
          anim = null;
          m.x = m.tx = pos[a.i][0];
          m.y = m.ty = pos[a.i][1];
          // impact: squash against the wall, dust off the leading edge, a 1px shake
          sq[a.i] = { v: 1, vel: 0, d: a.d };
          shakeT = 0.08;
          shakeD = a.d;
          const ex = pos[a.i][0] * CELL + 6 + DX[a.d] * 6;
          const ey = pos[a.i][1] * CELL + 6 + DY[a.d] * 6;
          const px = DY[a.d] ? 5 : 0;
          const py = DX[a.d] ? 5 : 0;
          burst(ex - px, ey - py, 3, [C.lilac, C.cream], 24, 0.32, [-DX[a.d] - px / 5, -DY[a.d] - py / 5]);
          burst(ex + px, ey + py, 3, [C.lilac, C.cream], 24, 0.32, [-DX[a.d] + px / 5, -DY[a.d] + py / 5]);
        }
      }
      vis.forEach((s) => {
        if (!s.on) return;
        busy = true;
        stepSpring(s, dt, 420, 0.38);
      });
      sq.forEach((q) => {
        if (!q.v && !q.vel) return;
        const kk = 700;
        q.vel += (-kk * q.v - 2 * Math.sqrt(kk) * 0.3 * q.vel) * dt;
        q.v += q.vel * dt;
        if (Math.abs(q.v) < 0.02 && Math.abs(q.vel) < 0.3) q.v = q.vel = 0;
      });
      if (shakeT > 0) shakeT = Math.max(0, shakeT - dt);
      shock = shock.map((t) => Math.max(0, t - dt));
      for (const q of parts) {
        q.life -= dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.z) q.x += Math.sin(clock * 3 + q.max * 9) * 2 * dt;
        else {
          q.vx *= 1 - 6 * dt;
          q.vy *= 1 - 6 * dt;
        }
      }
      parts = parts.filter((q) => q.life > 0);

      // the win lands once everything has stopped moving
      if (won && !celebrated && !busy) celebrate();
      if (celebrated && (banner !== 1 || bannerV)) {
        const kk = 260;
        bannerV += (kk * (1 - banner) - 2 * Math.sqrt(kk) * 0.35 * bannerV) * dt;
        banner += bannerV * dt;
        if (Math.abs(1 - banner) < 0.002 && Math.abs(bannerV) < 0.02) {
          banner = 1;
          bannerV = 0;
        }
      }
      if (celebrated && calm < 1) calm = Math.min(1, calm + dt * 1.4);
      if (celebrated) {
        // sleepers breathe out z's
        zT -= dt;
        if (zT <= 0) {
          zT = 0.7 + Math.random() * 0.5;
          const i = Math.floor(Math.random() * pos.length);
          parts.push({ x: pos[i][0] * CELL + 8, y: pos[i][1] * CELL - 1, vx: 3, vy: -7, life: 1.3, max: 1.3, c: PAINTS[i].light, z: true });
        }
      }

      // awake blocks fidget; sleeping ones keep still
      pos.forEach((_, i) => {
        blink[i] -= dt;
        if (blink[i] < -0.12) blink[i] = 1.8 + Math.random() * 2.6;
        const j = jit[i];
        if (j.t > 0) {
          j.t -= dt;
          if (j.t <= 0) j.x = j.y = 0;
        }
        j.next -= dt;
        if (j.next <= 0) {
          j.next = 0.45 + Math.random() * 1.1;
          if (!home(L, pos, i) && !won && !busy) {
            j.t = 0.07;
            j.x = Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0;
            j.y = j.x ? 0 : -1;
          }
        }
      });
    };

    /* ---------------------------------------------------------- draw */
    let lastKey = "";
    const pieceDraw = (i: number): PieceDraw => {
      const s = vis[i];
      let x = Math.round(s.x * CELL) + 1;
      let y = Math.round(s.y * CELL) + 1;
      let w = 10;
      let h = 10;
      const a = anim && anim.i === i ? anim : null;
      const q = sq[i];
      if (a) {
        // stretched with speed: two pixels longer, two thinner
        if (DX[a.d]) {
          w += 2;
          if (a.d === 1) x -= 2;
          h -= 2;
          y += 1;
        } else {
          h += 2;
          if (a.d === 2) y -= 2;
          w -= 2;
          x += 1;
        }
      } else if (q.v) {
        // squashed against the wall it hit, anchored at the wall side
        const sa = Math.round(q.v * 3);
        const e = Math.round(q.v * 1.5);
        if (DX[q.d]) {
          w -= sa;
          if (q.d === 1) x += sa;
          h += 2 * e;
          y -= e;
        } else {
          h -= sa;
          if (q.d === 2) y += sa;
          w += 2 * e;
          x -= e;
        }
      }
      if (!rm()) {
        x += jit[i].x;
        y += jit[i].y;
      }
      let eyes: Eyes = "open";
      if (shock[i] > 0) eyes = "shock";
      else if (home(L, pos, i) && !a && !s.on) eyes = "shut";
      else if (!rm() && blink[i] < 0) eyes = "blink";
      return { x, y, w, h, eyes, lx: a ? DX[a.d] : 0, ly: a ? DY[a.d] : 0 };
    };

    const draw = () => {
      if (!cv.width) return;
      const pieces = pos.map((_, i) => pieceDraw(i));
      const order = pos.map((_, i) => i).filter((i) => !anim || anim.i !== i);
      if (anim) order.push(anim.i);
      const sh = shakeT > 0 ? 1 : 0;
      const selPulse = rm() || !live ? 0 : Math.floor(clock * 2.4) % 2;
      let hint = null;
      if (lv === 0 && moves === 0 && !won && !anim && !vis.some((s) => s.on)) {
        const r = slide(L, pos, 1, 1);
        if (r) hint = { from: L.start[1], to: r.pos[1], phase: rm() ? 0 : clock * 6 };
      }
      const key = JSON.stringify([pieces, order, sel, selPulse, sh, banner, calm, hint && Math.floor(hint.phase)]);
      if (key === lastKey && !parts.length) return;
      lastKey = key;
      drawBoard(g, k, {
        cols: L.w,
        rows: L.h,
        walls: L.walls,
        beds: L.beds,
        pieces,
        order,
        sel,
        selPulse,
        showSel: !won,
        parts,
        shakeX: sh * DX[shakeD],
        shakeY: sh * DY[shakeD],
        hint,
        banner: celebrated ? banner : 0,
        bannerY,
        calm,
      });
      // the invisible buttons ride on top of their blocks
      const u = (CELL * k) / dpr;
      btns.forEach((b, i) => {
        const s = vis[i];
        b.style.transform = `translate(${((FRAME + s.x * CELL) * k) / dpr}px, ${((FRAME + s.y * CELL) * k) / dpr}px)`;
        b.style.width = b.style.height = `${u}px`;
      });
    };

    // the banner settles in the two-row band nearest the middle with no block in it,
    // so the sleepers stay in view
    const bandY = () => {
      let best = L.h / 2;
      let bestD = Infinity;
      for (let r = 0; r < L.h - 1; r++) {
        if (pos.some((p) => p[1] === r || p[1] === r + 1)) continue;
        const d = Math.abs(r + 1 - L.h / 2);
        if (d < bestD) {
          bestD = d;
          best = r + 1;
        }
      }
      return best * CELL;
    };
    let bannerY = 0;

    /* ---------------------------------------------------------- layout */
    const layoutBoard = () => {
      dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      k = Math.max(1, Math.floor(Math.min(w / art.w, h / art.h) * dpr));
      cv.width = art.w * k;
      cv.height = art.h * k;
      board.style.width = `${(art.w * k) / dpr}px`;
      board.style.height = `${(art.h * k) / dpr}px`;
      sec.style.setProperty("--ck-bw", `${(art.w * k) / dpr}px`);
      lastKey = "";
    };

    const layoutLogo = () => {
      const wide = sec.clientWidth >= 860 && sec.clientHeight >= 520;
      const iw = head.clientWidth;
      const short = !wide && sec.clientHeight < 600;
      const want = wide ? Math.min(iw * 0.92, ((sec.clientHeight * 0.22) / LOGO_H) * LOGO_W) : Math.min(iw * (short ? 0.36 : 0.46), 190);
      const lk = Math.max(1, Math.floor((want / LOGO_W) * dpr));
      logoCv.width = LOGO_W * lk;
      logoCv.height = LOGO_H * lk;
      logoCv.style.width = `${(LOGO_W * lk) / dpr}px`;
      logoCv.style.height = `${(LOGO_H * lk) / dpr}px`;
      drawLogo(lg, lk);
    };

    const resize = () => {
      layoutBoard();
      layoutLogo();
      dirty = true;
      draw();
    };

    /* ---------------------------------------------------------- input */
    const pieceAt = (x: number, y: number) => pos.findIndex((p) => p[0] === x && p[1] === y);
    const cellAt = (cx: number, cy: number): XY => {
      const r = cv.getBoundingClientRect();
      const ax = ((cx - r.left) / r.width) * art.w - FRAME;
      const ay = ((cy - r.top) / r.height) * art.h - FRAME;
      return [Math.floor(ax / CELL), Math.floor(ay / CELL)];
    };
    const select = (i: number) => {
      sel = i;
      dirty = true;
      btns[i]?.focus({ preventScroll: true });
    };

    let gest: { id: number; x0: number; y0: number; cell: XY; piece: number; used: boolean } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      byKey = false;
      const cell = cellAt(e.clientX, e.clientY);
      const piece = pieceAt(cell[0], cell[1]);
      gest = { id: e.pointerId, x0: e.clientX, y0: e.clientY, cell, piece, used: false };
      try {
        board.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
      if (piece >= 0) select(piece);
      ctx.wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!gest || e.pointerId !== gest.id || gest.used) return;
      const dx = e.clientX - gest.x0;
      const dy = e.clientY - gest.y0;
      const th = Math.max(12, ((CELL * k) / dpr) * 0.28);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
      gest.used = true;
      const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
      act(gest.piece >= 0 ? gest.piece : sel, d);
    };
    const onUp = (e: PointerEvent) => {
      if (!gest || e.pointerId !== gest.id) return;
      const g0 = gest;
      gest = null;
      if (g0.used || e.type === "pointercancel" || g0.piece >= 0 || won) return;
      // a tap on an empty cell in line with the chosen block sends it that way
      const [cx, cy] = g0.cell;
      const [sx, sy] = pos[sel];
      if (cx === sx && cy !== sy) act(sel, cy < sy ? 0 : 2);
      else if (cy === sy && cx !== sx) act(sel, cx < sx ? 3 : 1);
    };
    const KEYS: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const d = KEYS[e.key];
      if (d !== undefined) {
        e.preventDefault();
        byKey = true;
        act(sel, d);
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "z" || key === "u" || e.key === "Backspace") {
        e.preventDefault();
        undo();
      } else if (key === "r") {
        e.preventDefault();
        reset();
        btns[sel]?.focus({ preventScroll: true });
      }
    };
    const onLv = (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".ck-pip");
      if (!b) return;
      load(Number(b.dataset.lv));
      ctx.announce(`Board ${lv + 1}. ${awake(L, pos)} awake.`);
      draw();
    };
    const onNext = () => {
      const n = (lv + 1) % LEVELS.length;
      load(n);
      ctx.announce(`Board ${n + 1}. ${awake(L, pos)} awake.`);
      draw();
      btns[0]?.focus({ preventScroll: true });
    };

    board.addEventListener("pointerdown", onDown);
    board.addEventListener("pointermove", onMove);
    board.addEventListener("pointerup", onUp);
    board.addEventListener("pointercancel", onUp);
    board.addEventListener("keydown", onKey);
    lvNav.addEventListener("click", onLv);
    undoBtn.addEventListener("click", undo);
    resetBtn.addEventListener("click", reset);
    nextBtn.addEventListener("click", onNext);

    load(0, false);
    requestAnimationFrame(resize);

    return {
      tick(dt, isLive) {
        if (isLive !== live) {
          live = isLive;
          if (!live) {
            // off air: everything lands where it belongs and holds still
            snap();
            if (won && !celebrated) celebrate();
            parts = [];
            draw();
          }
          dirty = true;
        }
        if (!live) return;
        if (rm()) {
          if (dirty) {
            dirty = false;
            draw();
          }
          return;
        }
        update(dt);
        dirty = false;
        draw();
      },
      resize,
    };
  },
};

export default station;
