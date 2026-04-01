import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";

const focusPoints = [
  "TypeScript-first frontend systems",
  "Readable product code with fewer surprises",
  "Interfaces that feel deliberate, not generic",
];

const quickStats = [
  { label: "Current build", value: "Portfolio + MDX blog" },
  { label: "Approach", value: "Design systems with working code" },
  { label: "Status", value: "Building in public" },
];

export const Hero = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section-frame hero-radial relative overflow-hidden">
      <div className="section-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.35fr_0.9fr] lg:px-10 lg:py-12">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <p className="section-kicker">Rakshit Gumber</p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.06em] text-text sm:text-5xl lg:text-7xl">
            Building calm interfaces with enough structure to stay trustworthy.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
            I build developer-facing experiences, ship TypeScript-heavy product
            work, and write through the implementation details so the reasoning
            stays visible after the feature lands.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-secondary"
            >
              Explore projects
            </Link>
            <Link
              to="/blog"
              search={{ q: "", sort: "newest" }}
              className="border border-border bg-transparent px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-secondary hover:text-text"
            >
              Read the blog
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className="border border-border bg-bg-card/85 px-4 py-4 backdrop-blur-sm"
              >
                <p className="section-kicker">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-text">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.aside
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: "easeOut", delay: 0.06 }}
          className="section-frame relative overflow-hidden bg-bg-card/90 p-6"
        >
          <div className="section-grid pointer-events-none absolute inset-0 opacity-25" />
          <div className="relative">
            <p className="section-kicker">Working principles</p>
            <div className="mt-5 space-y-4">
              {focusPoints.map((item, index) => (
                <div
                  key={item}
                  className="border border-border bg-bg/70 p-4"
                >
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-border bg-bg-secondary/60 p-4">
              <p className="section-kicker">Availability</p>
              <p className="mt-2 text-sm leading-7 text-text-muted">
                Based on Earth, verified by CAPTCHA, currently focused on building
                a sharper portfolio, stronger project pages, and a local-first blog flow.
              </p>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
};
