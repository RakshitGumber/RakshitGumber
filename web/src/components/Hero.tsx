import { Link } from "@tanstack/react-router";

export const Hero = () => {
  return (
    <section className="relative h-110 w-full overflow-hidden flex flex-col justify-center gap-4 px-5">
      <p className="text-xl font-bold capitalize tracking-wider text-muted">
        I'm
      </p>
      <h1 className="w-[9ch] font-title text-6xl font-semibold tracking-wide text-(--text-color) sm:text-7xl lg:text-[5.5rem] -translate-x-0.5">
        Rakshit Gumber
      </h1>
      <p className="text-xl font-semibold capitalize tracking-wide text-muted">
        Driven by curiosity, making with passion.
      </p>

      <div className="flex pt-6">
        <Link
          to="/contact"
          className="bg-accent px-6 py-4 text-md rounded-2xl font-bold capitalize"
        >
          Let's Work
        </Link>
      </div>
    </section>
  );
};
