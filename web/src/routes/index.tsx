import { Link, createFileRoute } from "@tanstack/react-router";

import { Hero } from "@/components/Hero";
import { BlogCard } from "@/features/blog/components/BlogCard";
import { getLatestPosts } from "@/features/blog/content";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const featuredProjects = [
  {
    name: "Home Screen",
    summary:
      "A browser homescreen experiment that swaps blank tabs for a friendlier workspace anchored in utility and personality.",
    status: "Currently building",
    stack: ["TypeScript", "UI systems", "Product iteration"],
  },
  {
    name: "Portfolio Website",
    summary:
      "The site you are looking at: a local-first portfolio with responsive sections, route-driven navigation, and MDX-based writing.",
    status: "Shipping now",
    stack: ["React 19", "TanStack Router", "Tailwind 4"],
  },
];

const contactLinks = [
  { href: "https://github.com/RakshitGumber", label: "GitHub" },
  {
    href: "https://www.linkedin.com/in/gumber-rakshit",
    label: "LinkedIn",
  },
  { href: "https://x.com/Gumber_Rakshit", label: "Twitter" },
];

function HomePage() {
  const latestPosts = getLatestPosts(3);

  return (
    <div className="page-shell space-y-8">
      <Hero />

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="section-frame px-6 py-6 sm:px-8">
          <p className="section-kicker">Currently working on</p>
          <h2 className="section-heading mt-4 text-3xl sm:text-4xl">
            Shipping the portfolio as a proof-of-work surface.
          </h2>
          <p className="section-copy mt-4">
            The current build focuses on three things: a calm presentation layer,
            a blog system that stays local to the repo, and a codebase that stays
            easy to extend without introducing a CMS or database.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="border border-border bg-bg-card px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-secondary"
            >
              View selected work
            </Link>
            <Link
              to="/blog"
              search={{ q: "", sort: "newest" }}
              className="border border-border bg-transparent px-4 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-secondary hover:text-text"
            >
              See writing
            </Link>
          </div>
        </div>

        <div className="section-frame section-grid px-6 py-6 sm:px-8">
          <p className="section-kicker">What this site should signal</p>
          <div className="mt-5 space-y-4">
            <div className="border border-border bg-bg-card/90 p-4">
              <p className="text-sm font-semibold text-text">Curiosity, but shipped</p>
              <p className="mt-2 text-sm leading-7 text-text-muted">
                Ideas matter only when the implementation is stable enough to reuse.
              </p>
            </div>
            <div className="border border-border bg-bg-card/90 p-4">
              <p className="text-sm font-semibold text-text">Writing as proof</p>
              <p className="mt-2 text-sm leading-7 text-text-muted">
                Notes, tradeoffs, and details stay visible instead of disappearing into commits.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-frame px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Selected work</p>
            <h2 className="section-heading mt-4 text-3xl sm:text-4xl">
              A focused set of projects instead of a long archive.
            </h2>
          </div>
          <Link
            to="/projects"
            className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Open project index
          </Link>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {featuredProjects.map((project) => (
            <article
              key={project.name}
              className="section-frame hero-radial relative overflow-hidden px-5 py-5"
            >
              <div className="section-grid pointer-events-none absolute inset-0 opacity-25" />
              <div className="relative">
                <p className="section-kicker">{project.status}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-text">
                  {project.name}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-muted">
                  {project.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-bg-secondary px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-muted"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">I wrote about</p>
            <h2 className="section-heading mt-4 text-3xl sm:text-4xl">
              Small implementation notes that are easier to trust the second time.
            </h2>
          </div>
          <Link
            to="/blog"
            search={{ q: "", sort: "newest" }}
            className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Browse all posts
          </Link>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="section-frame px-6 py-6 sm:px-8">
        <p className="section-kicker">Contact</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="section-heading text-3xl sm:text-4xl">
              If the work feels aligned, reach out.
            </h2>
            <p className="section-copy mt-4">
              The portfolio is intentionally compact. If you want a deeper walkthrough,
              the best place to start is the project work or the blog notes behind it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {contactLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="border border-border bg-bg-card px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-secondary"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-3 border border-border px-6 py-5 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Caffeine overdose built this.</p>
        <a
          href="https://github.com/RakshitGumber"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-text transition-colors hover:text-accent"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
