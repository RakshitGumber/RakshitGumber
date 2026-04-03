import { motion, useReducedMotion } from "framer-motion";

const mobileNameLineClasses =
  "block text-[clamp(4.25rem,18vw,5.8rem)] font-bold leading-[0.8] tracking-[-0.09em] text-text-invert";

export const Hero = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative h-[600px] w-full overflow-hidden">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="relative z-30 max-w-5xl px-[28px] pt-24 text-left sm:px-[36px] sm:pt-16 md:px-[44px] md:pt-[72px] lg:px-[52px] lg:pt-20"
      >
        <div className="max-w-[24rem] sm:max-w-none">
          <p className="relative z-30 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-text-muted sm:text-sm">
            I am
          </p>

          <div className="relative mt-2 sm:mt-3">
            <div className="relative z-10">
              <h1 className="[text-shadow:0_10px_32px_rgba(11,15,20,0.42)]">
                <span className="hidden text-[5.4rem] font-bold leading-[0.82] tracking-[-0.09em] text-text-invert sm:block md:text-[6.3rem] lg:text-[7.4rem]">
                  Rakshit Gumber
                </span>

                <span className="sm:hidden">
                  <span className={mobileNameLineClasses}>Rakshit</span>
                  <span className={mobileNameLineClasses}>Gumber</span>
                </span>
              </h1>
            </div>
          </div>
        </div>

        <p className="relative z-30 mt-6 max-w-[18rem] text-base leading-7 text-text-muted [text-shadow:0_8px_24px_rgba(11,15,20,0.32)] sm:mt-7 sm:max-w-3xl sm:text-[1.6rem] sm:leading-9 lg:text-[2rem] lg:leading-10">
          Driven by curiosity, building with passion.
        </p>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
        className="pointer-events-none absolute bottom-0 right-[-8px] z-10 sm:right-[20px] md:right-[28px] lg:right-[36px]"
      >
        <img
          src="/images/rakshit.png"
          alt="Rakshit Gumber portrait"
          className="h-[500px] w-auto -scale-x-100 object-contain drop-shadow-[0_32px_72px_rgba(11,15,20,0.48)] sm:h-[520px] md:h-[620px] lg:h-[740px]"
        />
      </motion.div>
    </section>
  );
};
