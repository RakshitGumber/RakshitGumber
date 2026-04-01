import Lenis from "lenis";

export const lenis = new Lenis({
  duration: 1.4,

  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

  wheelMultiplier: 0.9,

  smoothWheel: true,
});
