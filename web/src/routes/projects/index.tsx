import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

const projects = [
  {
    name: "Home Screen",
    summary:
      "A friendly browser start page with stronger information density, softer personality, and fewer wasted clicks.",
    stack: ["TypeScript", "Frontend architecture", "Interaction design"],
  },
  {
    name: "Portfolio Website",
    summary:
      "A local-first portfolio with MDX writing, TanStack Router navigation, and a reusable theme-token layer.",
    stack: ["React", "Tailwind 4", "MDX"],
  },
];

function ProjectsPage() {
  const heroRadialStyle = {
    backgroundImage:
      "radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 28%, transparent), transparent 42%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--text-invert) 8%, transparent), transparent 34%)",
  } as const;

  return (
    <div className="mx-auto w-[min(100%-(var(--page-gutter)*2),var(--page-width))] space-y-8">
      <section
        className="relative overflow-hidden border border-border bg-bg-card/70 px-6 py-10 shadow-[var(--shadow-sm)] backdrop-blur-sm sm:px-8 sm:py-12"
        style={heroRadialStyle}
      >
        <div className="section-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative max-w-3xl">
          <p className="section-kicker">Projects</p>
          <h1 className="section-heading mt-4">
            Focused work, not a long screenshot wall.
          </h1>
          <p className="section-copy mt-4">
            This route stays intentionally compact for now. It carries the same shell
            and theme language as the rest of the site while leaving room for fuller
            case studies later.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.name}
            className="border border-border bg-bg-card/70 px-6 py-6 shadow-[var(--shadow-sm)] backdrop-blur-sm sm:px-8"
          >
            <p className="section-kicker">Selected work</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-text">
              {project.name}
            </h2>
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
          </article>
        ))}
      </section>
    </div>
  );
}
