# Stations

A reusable radio dial shell. You pass stations in; it owns the drum, the static,
the colour morph, and the lock-on. Vite and plain TypeScript, no framework.

The demo under `src/main.ts` is Jagrit's eight-station portfolio. The pixel art
in that copy is stand-in art from `scripts/make-art.py`.

## Use as a package

```ts
import { mount, type Station } from "stations";

const home: Station = {
  meta: {
    id: "home",
    label: "Home",
    field: "#2D160C",
    ink: "#91AB7F",
    wave: (u) => Math.sin(u),
  },
  mount(section, ctx) {
    section.innerHTML = `<h2 class="big">Hello</h2>`;
    return {};
  },
};

const unmount = mount(document.getElementById("app")!, {
  title: "Your Name",
  stations: [home],
});
```

`mount` returns a cleanup. Put `data-own` on any element that needs its own
drags or arrow keys. Use class `big` on the headline that should shiver under
static, and `det` on details that print in once the station locks.

## Run the demo

```sh
bun install
bun run dev    # http://localhost:5180
bun run build
```

## Controls

- Drag sideways, scroll, or use the arrow keys (Home / End jump to the ends).
- Preset buttons under the dial tune straight to a station.
- `?s=<id>` opens on a station. Back and forward retune the dial.
- Respects `prefers-reduced-motion`.

## Package layout

- `src/stations/index.ts`: the dial shell (the reusable API).
- `src/stations/types.ts`: `Station`, `Meta`, `Ctx`, `Handle`.
- `src/stations/shell.css`: shared frame styles.
- `src/stations/st/`: demo station modules (one world each).
- `src/content.ts`: demo copy.
- `src/stations/sound.ts`: synthesised SFX for the demo landing station.
