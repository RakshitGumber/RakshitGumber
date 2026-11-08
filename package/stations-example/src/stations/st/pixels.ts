import "./pixels.css";
import type { Station } from "../types";

// Ported from Tuner unchanged in spirit: the slime sits on a field that is
// exactly its own background, the island stands beside the words, the mushroom
// runs. The art is stand-in art from scripts/make-art.py; keep the sizes.
const art = {
  island: { src: "/art/island.png", w: 384, h: 384 },
  slime: { src: "/art/slime.gif", w: 480, h: 480 },
};
const station: Station = {
  meta: {
    id: "pixels",
    label: "Pixels",
    field: "#FBF236",
    ink: "#222034",
    wave: (u) => Math.round(Math.sin(Math.floor(u * 2.5) / 2.5) * 3) / 3,
  },
  mount(el) {
    el.innerHTML = `
      <div class="copy">
        <h2 class="big">Pixels</h2>
        <p class="lead">A page without my pixel art feels wrong.</p>
        <p class="body det">Stand-in art for now: a floating island, a slime mid-bounce, and a mushroom in a hurry.</p>
      </div>
      <img class="cube art" src="${art.island.src}" width="${art.island.w}" height="${art.island.h}" alt="An isometric floating island with a tree, a pond and a flag." draggable="false" />
      <img class="cat art" src="${art.slime.src}" width="${art.slime.w}" height="${art.slime.h}" alt="A pixel slime, mid-bounce." draggable="false" />
      <span class="ghost art" role="img" aria-label="A pixel mushroom, running."></span>`;
    return {};
  },
};

export default station;
