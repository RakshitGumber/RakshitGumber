import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

type BlogListHeroProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  postCount: number;
  featuredCount?: number;
  tagCount?: number;
  className?: string;
};

const statCard =
  "border border-border bg-bg-card/85 px-4 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.05)] backdrop-blur-sm";

export const BlogListHero = ({
  title = "Notes with fewer assumptions and more proof.",
  description = "A compact archive for local MDX posts, implementation notes, and the pieces that are worth reusing the next time around.",
  eyebrow = "Blog",
  postCount,
  featuredCount = 0,
  tagCount = 0,
  className,
}: BlogListHeroProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className={clsx(
        "hero-radial relative overflow-hidden border-b border-border bg-bg-card/40",
        className,
      )}
    >
      <div className="section-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="page-shell relative py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.45fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="section-kicker inline-flex items-center gap-2 border border-border bg-bg-card/80 px-3 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {eyebrow}
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-text sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className={statCard}>
                <p className="section-kicker">Posts</p>
                <p className="mt-1 text-xl font-semibold text-text">{postCount}</p>
              </div>
              <div className={statCard}>
                <p className="section-kicker">Featured</p>
                <p className="mt-1 text-xl font-semibold text-text">
                  {featuredCount}
                </p>
              </div>
              <div className={statCard}>
                <p className="section-kicker">Tags</p>
                <p className="mt-1 text-xl font-semibold text-text">{tagCount}</p>
              </div>
            </div>
          </div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            className="relative"
          >
            <div className="absolute inset-0 translate-x-3 translate-y-3 border border-border bg-bg-secondary/50" />
            <div className="relative border border-border bg-bg-card/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <p className="section-kicker">Working set</p>
                <span className="rounded-full border border-accent/25 bg-accent-tint px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-accent">
                  Local MDX
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="border-l-4 border-accent pl-4">
                  <p className="text-sm font-semibold text-text">
                    Content is parsed from filename-derived slugs and typed frontmatter.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    Adding another post stays a content change instead of a code chase.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={statCard}>
                    <p className="section-kicker">Featured ratio</p>
                    <p className="mt-1 text-lg font-semibold text-text">
                      {postCount
                        ? `${Math.round((featuredCount / postCount) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                  <div className={statCard}>
                    <p className="section-kicker">Surface</p>
                    <p className="mt-1 text-lg font-semibold text-text">
                      Editorial, but compact
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
