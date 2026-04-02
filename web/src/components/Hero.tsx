import { motion, useReducedMotion } from "framer-motion";

export const Hero = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative h-[500px] w-full overflow-hidden px-[28px] sm:px-[36px] md:px-[44px] lg:px-[52px]">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="relative z-10 max-w-4xl pt-12 sm:pt-16 md:pt-[72px] lg:pt-20"
      >
        <h1 className="text-5xl font-bold leading-[0.9] tracking-[-0.06em] text-text-invert sm:text-6xl md:text-7xl lg:text-[5.75rem]">
          I am Rakshit Gumber
        </h1>
        <p className="mt-7 max-w-3xl text-xl leading-8 text-[color-mix(in_srgb,var(--text-invert)_78%,white)] sm:text-2xl sm:leading-9 lg:text-[1.75rem] lg:leading-10">
          Driven by curiosity, building with passion.
        </p>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
        className="pointer-events-none absolute bottom-0 right-[28px] sm:right-[36px] md:right-[44px] lg:right-[52px]"
      >
        <img
          src="/images/rakshit.png"
          alt="Rakshit Gumber portrait"
          className="h-[380px] w-auto -scale-x-100 object-contain drop-shadow-[0_24px_48px_rgba(11,15,20,0.32)] sm:h-[460px] md:h-[560px] lg:h-[680px]"
        />
      </motion.div>
    </section>
  );
};
