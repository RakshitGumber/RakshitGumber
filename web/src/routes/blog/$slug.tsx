import { MDXProvider } from "@mdx-js/react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { BlogCard } from "@/features/blog/components/BlogCard";
import {
  formatBlogDate,
  formatReadingTime,
  getPostBySlug,
  getRelatedPosts,
} from "@/features/blog/content";
import { blogMdxComponents } from "@/features/blog/mdx-components";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const postEntry = await getPostBySlug(params.slug);

    if (!postEntry) {
      throw notFound();
    }

    return postEntry;
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, Content } = Route.useLoaderData();
  const relatedPosts = getRelatedPosts(post.slug, 2);

  return (
    <div className="page-shell space-y-8">
      <article className="section-frame overflow-hidden">
        <div className="hero-radial relative border-b border-border px-6 py-10 sm:px-8 sm:py-12">
          <div className="section-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative max-w-3xl">
            <Link
              to="/blog"
              search={{ q: "", sort: "newest" }}
              className="section-kicker inline-flex items-center gap-2 text-text-muted transition-colors hover:text-text"
            >
              <span aria-hidden="true">/</span>
              Back to blog
            </Link>
            <h1 className="mt-5 text-4xl font-bold tracking-[-0.05em] text-text sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
              {post.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-text-muted">
              <span>{formatBlogDate(post.date)}</span>
              <span>{formatReadingTime(post.readingTimeMinutes)}</span>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="content-prose">
            <MDXProvider components={blogMdxComponents}>
              <Content />
            </MDXProvider>
          </div>

          <aside className="space-y-4">
            {(post.projectName || post.projectSummary) && (
              <section className="section-frame px-5 py-5">
                <p className="section-kicker">Linked project</p>
                {post.projectName ? (
                  <h2 className="mt-3 text-xl font-semibold text-text">
                    {post.projectName}
                  </h2>
                ) : null}
                {post.projectSummary ? (
                  <p className="mt-3 text-sm leading-7 text-text-muted">
                    {post.projectSummary}
                  </p>
                ) : null}
                {post.projectUrl ? (
                  <a
                    href={post.projectUrl}
                    className="mt-4 inline-flex text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                  >
                    Open project
                  </a>
                ) : null}
              </section>
            )}

            <section className="section-frame px-5 py-5">
              <p className="section-kicker">Reading context</p>
              <p className="mt-3 text-sm leading-7 text-text-muted">
                Local MDX, typed frontmatter, and route-driven rendering. Add a new
                file in `content/blog` and it appears in the archive automatically.
              </p>
            </section>
          </aside>
        </div>
      </article>

      {relatedPosts.length ? (
        <section className="section-frame px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Continue reading</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-text">
                Related notes from the same working set.
              </h2>
            </div>
            <Link
              to="/blog"
              search={{ q: "", sort: "newest" }}
              className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              View all posts
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.slug} post={relatedPost} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
