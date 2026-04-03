import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { Navbar } from "@/components/Navbar";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <Navbar />
      <div className="mt-24">
        <Outlet />
      </div>
    </>
  );
}

function NotFoundComponent() {
  const heroRadialStyle = {
    backgroundImage:
      "radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 28%, transparent), transparent 42%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--text-invert) 8%, transparent), transparent 34%)",
  } as const;

  return (
    <div className="mx-auto w-[min(100%-(var(--page-gutter)*2),var(--page-width))]">
      <section
        className="relative overflow-hidden border border-border bg-bg-card/70 px-6 py-14 shadow-[var(--shadow-sm)] backdrop-blur-sm sm:px-10 sm:py-20"
        style={heroRadialStyle}
      >
        <div className="section-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative max-w-2xl">
          <p className="section-kicker">404</p>
          <h1 className="section-heading mt-4">That page does not exist.</h1>
          <p className="section-copy mt-4">
            The route is missing or the content has moved. Use the primary nav
            or jump back into the portfolio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="border border-border bg-bg-card px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-secondary"
            >
              Back to work
            </Link>
            <Link
              to="/blog"
              search={{ q: "", sort: "newest" }}
              className="border border-border bg-transparent px-4 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-secondary hover:text-text"
            >
              Browse blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
