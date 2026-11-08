import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "./mail.css";
import { person } from "../../content";
import type { Station } from "../types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// An airmail envelope addressed to him. Copying the address postmarks the stamp.
const station: Station = {
  meta: {
    id: "mail",
    label: "Mail",
    field: "#F4EEE1",
    ink: "#24418F",
    wave: (u) => Math.exp(-1 * ((((u / (Math.PI * 2)) % 1) - 0.5) * 7) ** 2) * 1.7 - 0.5,
  },
  mount(el, ctx) {
    const gh = person.github.replace(/^https?:\/\//, "");
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    el.innerHTML = `
      <div class="ml-env">
        <p class="ml-air" aria-hidden="true">By air mail</p>
        <div class="ml-stampwrap" aria-hidden="true">
          <div class="ml-stamp"><img src="/art/portrait.png" width="64" height="64" alt="" draggable="false" /></div>
          <svg class="ml-post" viewBox="0 0 220 110">
            <defs><path id="ml-arc" d="M18 55 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" /></defs>
            <circle cx="55" cy="55" r="44" />
            <circle cx="55" cy="55" r="30" />
            <text><textPath href="#ml-arc" startOffset="2">Open to talk, always · Open to talk</textPath></text>
            <text class="ml-date" x="55" y="59" text-anchor="middle">${today}</text>
            <path d="M104 38 q12 -7 24 0 t24 0 t24 0 t24 0 t24 0" />
            <path d="M104 55 q12 -7 24 0 t24 0 t24 0 t24 0 t24 0" />
            <path d="M104 72 q12 -7 24 0 t24 0 t24 0 t24 0 t24 0" />
          </svg>
        </div>
        <h2 class="ml-head">${esc(person.open)}</h2>
        <address class="ml-to">
          <span class="ml-k">To</span>
          <span class="ml-name">${person.name}</span>
          <a class="ml-mail" href="mailto:${person.mail}">${person.mail}</a>
          <a class="ml-gh" href="${person.github}" rel="noopener" target="_blank">${gh}</a>
        </address>
        <div class="ml-act">
          <button type="button" class="ml-copy">Copy address</button>
          <p class="ml-note det">Write about a game, an app, or something I got wrong.</p>
        </div>
        <p class="ml-ps"><span>P.S.</span> ${esc(person.close)}</p>
      </div>`;

    const stamp = el.querySelector<HTMLElement>(".ml-stampwrap")!;
    const btn = el.querySelector<HTMLButtonElement>(".ml-copy")!;
    let timer = 0;

    const copy = async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(person.mail);
        ok = true;
      } catch {
        /* clipboard blocked: the mailto link still works */
      }
      clearTimeout(timer);
      if (!ok) {
        btn.textContent = "Select the address above";
      } else {
        btn.textContent = "Copied. Talk soon.";
        // restart the postmark even if it was already there
        stamp.classList.remove("sent");
        void stamp.offsetWidth;
        stamp.classList.add("sent");
        ctx.announce(`Copied ${person.mail}.`);
      }
      timer = window.setTimeout(() => (btn.textContent = "Copy address"), 2600);
    };
    btn.addEventListener("click", copy);

    let wasLive = false;
    return {
      tick(_dt, live) {
        // the stamp is pressed on fresh each time you tune in
        if (live && !wasLive) stamp.classList.add("in");
        if (!live && wasLive) stamp.classList.remove("in", "sent");
        wasLive = live;
      },
      destroy() {
        clearTimeout(timer);
        btn.removeEventListener("click", copy);
      },
    };
  },
};

export default station;
