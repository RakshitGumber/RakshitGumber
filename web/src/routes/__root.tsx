import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { Navbar } from "@/components/Navbar";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <main className="pb-16 pt-24 sm:pt-28">
        <Outlet />
      </main>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="page-shell">
      <section className="section-frame hero-radial relative overflow-hidden px-6 py-14 sm:px-10 sm:py-20">
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
