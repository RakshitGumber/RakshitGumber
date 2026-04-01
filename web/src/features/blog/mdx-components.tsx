import type { ComponentPropsWithoutRef, JSX, ReactNode } from "react";
import clsx from "clsx";

type HtmlProps<Tag extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<Tag>;

const proseCard =
  "rounded-[1.15rem] border border-border bg-bg-card/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]";

const headingBase =
  "scroll-m-20 font-semibold tracking-tight text-text";

const inlineCode =
  "rounded border border-border bg-bg-secondary px-1.5 py-0.5 font-mono text-[0.92em] text-accent";

const blockCode =
  "overflow-x-auto rounded-[1rem] border border-border bg-bgDark px-5 py-4 text-sm leading-6 text-text-invert shadow-[0_18px_40px_rgba(15,23,42,0.14)]";

const components = {
  h1: ({ className, ...props }: HtmlProps<"h1">) => (
    <h1 className={clsx(headingBase, "border-b border-border pb-4 text-4xl sm:text-5xl", className)} {...props} />
  ),
  h2: ({ className, ...props }: HtmlProps<"h2">) => (
    <h2 className={clsx(headingBase, "mt-12 text-2xl sm:text-3xl", className)} {...props} />
  ),
  h3: ({ className, ...props }: HtmlProps<"h3">) => (
    <h3 className={clsx(headingBase, "mt-10 text-xl sm:text-2xl", className)} {...props} />
  ),
  h4: ({ className, ...props }: HtmlProps<"h4">) => (
    <h4 className={clsx(headingBase, "mt-8 text-lg sm:text-xl", className)} {...props} />
  ),
  p: ({ className, ...props }: HtmlProps<"p">) => (
    <p className={clsx("mt-5 leading-8 text-text-muted first:mt-0", className)} {...props} />
  ),
  a: ({ className, ...props }: HtmlProps<"a">) => (
    <a
      className={clsx(
        "font-medium text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent-hover/50",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: HtmlProps<"ul">) => (
    <ul className={clsx("mt-5 space-y-3 pl-5 text-text-muted", className)} {...props} />
  ),
  ol: ({ className, ...props }: HtmlProps<"ol">) => (
    <ol className={clsx("mt-5 space-y-3 pl-5 text-text-muted", className)} {...props} />
  ),
  li: ({ className, ...props }: HtmlProps<"li">) => (
    <li className={clsx("leading-7", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: HtmlProps<"blockquote">) => (
    <blockquote
      className={clsx(
        proseCard,
        "mt-8 border-l-4 border-accent bg-accent-tint px-6 py-5 text-text-muted",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: HtmlProps<"hr">) => (
    <hr className={clsx("my-10 border-border", className)} {...props} />
  ),
  strong: ({ className, ...props }: HtmlProps<"strong">) => (
    <strong className={clsx("font-bold text-text", className)} {...props} />
  ),
  em: ({ className, ...props }: HtmlProps<"em">) => (
    <em className={clsx("italic text-text", className)} {...props} />
  ),
  code: ({ className, children, ...props }: HtmlProps<"code"> & { children?: ReactNode }) => {
    const isInline = typeof children === "string" && !children.includes("\n");

    return (
      <code className={clsx(isInline ? inlineCode : blockCode, className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ className, children, ...props }: HtmlProps<"pre">) => (
    <pre className={clsx(blockCode, "mt-6", className)} {...props}>
      {children}
    </pre>
  ),
  table: ({ className, ...props }: HtmlProps<"table">) => (
    <div className="mt-8 overflow-x-auto rounded-[1rem] border border-border bg-bg-card">
      <table className={clsx("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }: HtmlProps<"thead">) => (
    <thead className={clsx("bg-bg-secondary/70 text-[0.72rem] uppercase tracking-[0.18em] text-text-muted", className)} {...props} />
  ),
  tr: ({ className, ...props }: HtmlProps<"tr">) => (
    <tr className={clsx("border-b border-border last:border-b-0", className)} {...props} />
  ),
  th: ({ className, ...props }: HtmlProps<"th">) => (
    <th className={clsx("px-4 py-3 font-semibold", className)} {...props} />
  ),
  td: ({ className, ...props }: HtmlProps<"td">) => (
    <td className={clsx("px-4 py-3 text-text-muted", className)} {...props} />
  ),
  img: ({ className, alt = "", ...props }: HtmlProps<"img">) => (
    <img
      alt={alt}
      className={clsx(
        "my-8 w-full rounded-[1.15rem] border border-border bg-bg-secondary object-cover shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
        className,
      )}
      {...props}
    />
  ),
};

export type BlogMdxComponents = typeof components;

export const blogMdxComponents = components;
