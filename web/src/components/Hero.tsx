import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-(--hero-height) w-full max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-12 md:flex-row md:items-center md:px-10 lg:px-12">
        <div className="flex flex-1 flex-col justify-center text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-(--secondary-text) sm:text-base">
            I am
          </p>
          <h1 className="mt-4 max-w-[9ch] font-heading text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-(--text-color) sm:text-7xl lg:text-[5.5rem]">
            Rakshit Gumber
          </h1>
          <p className={`mt-5`}>Driven by curiosity, making with passion.</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_42%,transparent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-5 py-3 text-sm font-semibold text-(--text-color) backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
            >
              Let's Work
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-1 items-end justify-center md:mt-0 md:justify-end md:pl-8">
          <div className="relative flex h-full w-full items-end justify-center md:justify-end">
            <img
              src="/images/rakshit.png"
              alt="Rakshit Gumber"
              className="relative h-full max-h-76 w-auto object-contain scale-x-[-1] sm:max-h-96 md:max-h-128 lg:max-h-144"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
