import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";

import { formatBlogDate, formatReadingTime } from "../content";
import type { BlogPostSummary } from "../types";

type BlogCardProps = {
  post: BlogPostSummary;
  className?: string;
};

const tagStyles =
  "rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-muted transition-colors group-hover:border-border group-hover:text-text";

export const BlogCard = ({ post, className }: BlogCardProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      className={clsx(
        "group relative h-full overflow-hidden border border-border bg-bg-card/95 shadow-[0_18px_44px_rgba(15,23,42,0.05)] transition-shadow duration-200 hover:shadow-[0_24px_54px_rgba(15,23,42,0.09)]",
        className,
      )}
    >
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-transparent opacity-70" />
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div className="space-y-1">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">
                {formatBlogDate(post.date)}
              </p>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-text-muted/70">
                {formatReadingTime(post.readingTimeMinutes)}
              </p>
            </div>
            {post.featured ? (
              <span className="rounded-full border border-accent/30 bg-accent-tint px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-accent">
                Featured
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-5 p-5">
            <div className="space-y-3">
              <h3 className="text-[1.45rem] font-semibold leading-tight tracking-tight text-text transition-colors group-hover:text-accent sm:text-[1.65rem]">
                {post.title}
              </h3>
              <p className="max-w-[42rem] text-sm leading-7 text-text-muted sm:text-[0.98rem]">
                {post.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className={tagStyles}>
                  {tag}
                </span>
              ))}
            </div>

            {post.projectName || post.projectSummary ? (
              <div className="mt-auto border-t border-border/70 pt-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">
                  Linked project
                </p>
                <div className="mt-2 space-y-1">
                  {post.projectName ? (
                    <p className="text-sm font-semibold text-text">
                      {post.projectName}
                    </p>
                  ) : null}
                  {post.projectSummary ? (
                    <p className="text-sm leading-6 text-text-muted">
                      {post.projectSummary}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
