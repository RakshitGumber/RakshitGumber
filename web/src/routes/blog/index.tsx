import { useDeferredValue, useTransition } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { BlogCard } from "@/features/blog/components/BlogCard";
import { BlogListHero } from "@/features/blog/components/BlogListHero";
import { getBlogIndex, getFilteredPosts } from "@/features/blog/content";
import type { BlogSort } from "@/features/blog/types";

type BlogSearch = {
  q: string;
  sort: BlogSort;
};

const validateSearch = (search: Record<string, unknown>): BlogSearch => ({
  q: typeof search.q === "string" ? search.q : "",
  sort:
    search.sort === "featured" ||
    search.sort === "oldest" ||
    search.sort === "newest"
      ? search.sort
      : "newest",
});

export const Route = createFileRoute("/blog/")({
  validateSearch,
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const deferredQuery = useDeferredValue(search.q);
  const [, startTransition] = useTransition();
  const blogIndex = getBlogIndex();
  const posts = getFilteredPosts(deferredQuery, search.sort);

  const updateSearch = (nextSearch: Partial<BlogSearch>) => {
    startTransition(() => {
      void navigate({
        search: (previous) => ({
          ...previous,
          q: nextSearch.q ?? previous.q ?? "",
          sort: nextSearch.sort ?? previous.sort ?? "newest",
        }),
      });
    });
  };

  return (
    <div className="space-y-8">
      <BlogListHero
        postCount={blogIndex.posts.length}
        featuredCount={blogIndex.featuredPosts.length}
        tagCount={blogIndex.tags.length}
      />

      <div className="page-shell space-y-6">
        <section className="section-frame px-6 py-6 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="section-kicker">Find a post</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-text">
                Search the archive and sort it the way you read.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <label className="grid gap-2">
                <span className="section-kicker">Search</span>
                <input
                  type="search"
                  value={search.q}
                  onChange={(event) => {
                    updateSearch({ q: event.target.value });
                  }}
                  placeholder="Search by title, tag, or summary"
                  className="border border-border bg-bg-card px-4 py-3 text-sm text-text placeholder:text-text-muted/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
                />
              </label>
              <label className="grid gap-2">
                <span className="section-kicker">Sort</span>
                <select
                  value={search.sort}
                  onChange={(event) =>
                    updateSearch({ sort: event.target.value as BlogSort })
                  }
                  className="border border-border bg-bg-card px-4 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="featured">Featured first</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        {posts.length ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </section>
        ) : (
          <section className="section-frame px-6 py-10 text-center sm:px-8">
            <p className="section-kicker">No matches</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-text">
              Nothing matched that query yet.
            </h2>
            <p className="section-copy mx-auto mt-4">
              Try a broader term or switch the sort order. The archive is local,
              so every new MDX file appears here without extra wiring.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
