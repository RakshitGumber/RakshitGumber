import Lenis, { type LenisOptions } from "lenis";

type LenisCompatibilityOptions = LenisOptions & {
  smooth?: boolean;
  smoothTouch?: boolean;
};

const lenisOptions: LenisCompatibilityOptions = {
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  smoothTouch: false,
  wheelMultiplier: 0.9,
  smoothWheel: true,
  syncTouch: true,
  touchMultiplier: 1.5,
  infinite: false,
};

export const lenis = new Lenis(lenisOptions as LenisOptions);
