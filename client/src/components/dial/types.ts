// The contract every station implements. The shell (index.ts) owns the dial,
// the deck, the static and the URL. A station owns everything inside its own
// <section>, and nothing outside it.

export type Wave = (u: number) => number;

export type Meta = {
  id: string;
  /** Short name on the drum. */
  label: string;
  /** The page colour while this station is on air. Also the deck's tick colour. */
  field: string;
  /** The deck's background colour while this station is on air. */
  ink: string;
  /** Bold gradient on the channel badge: [from, to]. */
  glow: [string, string];
  /** Shape of the waveform drawn along the top of the deck. u is radians. */
  wave: Wave;
};

export type Ctx = {
  /** prefers-reduced-motion, live. */
  reduced: () => boolean;
  /** Ask for animation frames (needed under reduced motion, where the loop sleeps). */
  wake: () => void;
  /** Say something to screen readers. */
  announce: (text: string) => void;
};

export type Handle = {
  /**
   * Called every frame for every station.
   * live: this station is tuned in and locked (on air, fully visible).
   * Do nothing expensive when live is false.
   */
  tick?(dt: number, live: boolean): void;
  /** The stage changed size. */
  resize?(): void;
  /** Undo everything mount did outside the section (listeners, timers, audio). */
  destroy?(): void;
};

export type Station = {
  meta: Meta;
  /**
   * Fill the section. The section is absolutely positioned over the whole
   * stage (above the deck) and is a size container (cqw/cqh work). It starts
   * with padding var(--top) var(--pad); override it if the world is full bleed.
   *
   * Pointer drags anywhere on the stage tune the dial. Put data-own on any
   * element that needs its own drags or arrow keys (a game board, a canvas).
   */
  mount(section: HTMLElement, ctx: Ctx): Handle;
};
