import matter from "gray-matter";
import type { ComponentType } from "react";

import type {
  BlogFrontmatter,
  BlogFrontmatterInput,
  BlogIndex,
  BlogPost,
  BlogPostSummary,
  BlogSort,
  BlogSourceEntry,
} from "./types";

const FALLBACK_TITLE = "Untitled post";
const WORDS_PER_MINUTE = 220;

const rawPostModules = import.meta.glob("../../../../content/blog/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const DEFAULT_FRONTMATTER: BlogFrontmatter = {
  title: FALLBACK_TITLE,
  description: "",
  date: new Date().toISOString().slice(0, 10),
  tags: [],
  featured: false,
  projectName: undefined,
  projectUrl: undefined,
  projectSummary: undefined,
  projectStack: [],
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const stripExtension = (filename: string) => filename.replace(/\.[^.]+$/, "");

const baseName = (filename: string) =>
  filename.split(/[\\/]/).filter(Boolean).at(-1) ?? filename;

export const normalizeBlogSlug = (filename: string) =>
  normalizeWhitespace(stripExtension(baseName(filename)))
    .replace(/^\d+[-_ ]*/, "")
    .replace(/[ _]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== "string") {
      return [];
    }

    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  });
};

const coerceBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const coerceString = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const coerceDate = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const normalizeFrontmatter = (
  frontmatter: Partial<BlogFrontmatterInput>,
  filename: string,
): BlogFrontmatter => ({
  title:
    coerceString(
      frontmatter.title,
      normalizeWhitespace(stripExtension(baseName(filename))),
    ) || FALLBACK_TITLE,
  description: coerceString(frontmatter.description, ""),
  date: coerceDate(frontmatter.date, DEFAULT_FRONTMATTER.date),
  tags: toStringArray(frontmatter.tags),
  featured: coerceBoolean(frontmatter.featured, false),
  projectName: frontmatter.projectName
    ? coerceString(frontmatter.projectName)
    : undefined,
  projectUrl: frontmatter.projectUrl
    ? coerceString(frontmatter.projectUrl)
    : undefined,
  projectSummary: frontmatter.projectSummary
    ? coerceString(frontmatter.projectSummary)
    : undefined,
  projectStack: toStringArray(frontmatter.projectStack),
});

const stripMarkdown = (content: string) =>
  content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[>*_#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const estimateReadingTime = (content: string) => {
  const words = normalizeWhitespace(stripMarkdown(content)).split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

const createExcerpt = (description: string, content: string) => {
  if (description.trim()) {
    return description.trim();
  }

  const plainText = stripMarkdown(content);

  if (!plainText) {
    return "";
  }

  return plainText.length > 180 ? `${plainText.slice(0, 177)}...` : plainText;
};

export const formatBlogDate = (date: string, locale = "en-US") => {
  const normalized = date.includes("T") ? date : `${date}T00:00:00Z`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

export const formatReadingTime = (minutes: number) => `${minutes} min read`;

const normalizeSourceEntries = (): BlogSourceEntry[] =>
  Object.entries(rawPostModules).map(([filename, source]) => ({
    filename,
    source,
  }));

export const buildBlogPost = ({
  filename,
  source,
}: BlogSourceEntry): BlogPost => {
  const parsed = matter(source);
  const frontmatter = normalizeFrontmatter(parsed.data, filename);
  const publishedAt = new Date(
    frontmatter.date.includes("T")
      ? frontmatter.date
      : `${frontmatter.date}T00:00:00Z`,
  );

  return {
    ...frontmatter,
    slug: normalizeBlogSlug(filename),
    filename: baseName(filename),
    sourcePath: filename,
    excerpt: createExcerpt(frontmatter.description, parsed.content),
    content: parsed.content,
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date(0) : publishedAt,
    readingTimeMinutes: estimateReadingTime(parsed.content),
  };
};

const summarizeBlogPost = (post: BlogPost): BlogPostSummary => {
  const { content, sourcePath, ...summary } = post;
  void content;
  void sourcePath;
  return summary;
};

const allBlogPosts = normalizeSourceEntries().map(buildBlogPost);

export const sortBlogPostsByDate = <T extends { publishedAt: Date }>(
  posts: readonly T[],
) =>
  [...posts].sort(
    (left, right) => right.publishedAt.getTime() - left.publishedAt.getTime(),
  );

export const getFeaturedBlogPosts = (posts: readonly BlogPostSummary[]) =>
  sortBlogPostsByDate(posts).filter((post) => post.featured);

export const getBlogTags = (posts: readonly BlogPostSummary[]) =>
  Array.from(
    new Set(
      posts.flatMap((post) => post.tags.map((tag) => tag.trim()).filter(Boolean)),
    ),
  ).sort((left, right) => left.localeCompare(right));

const tokenizeQuery = (query: string) =>
  normalizeWhitespace(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

const searchableFields = (post: BlogPostSummary) => [
  post.title,
  post.description,
  post.excerpt,
  post.slug,
  post.tags.join(" "),
  post.projectName ?? "",
  post.projectSummary ?? "",
  post.projectStack.join(" "),
];

export const matchesBlogPost = (post: BlogPostSummary, query: string) => {
  const tokens = tokenizeQuery(query);

  if (!tokens.length) {
    return true;
  }

  const haystack = searchableFields(post).join(" ").toLowerCase();

  return tokens.every((token) => haystack.includes(token));
};

export const searchBlogPosts = (
  posts: readonly BlogPostSummary[],
  query: string,
) => posts.filter((post) => matchesBlogPost(post, query));

export const getRelatedBlogPosts = (
  posts: readonly BlogPostSummary[],
  currentSlug: string,
  limit = 3,
) => {
  const currentPost = posts.find((post) => post.slug === currentSlug);

  if (!currentPost) {
    return sortBlogPostsByDate(posts).slice(0, limit);
  }

  return posts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) =>
        currentPost.tags.includes(tag),
      ).length;
      const sharedStack = post.projectStack.filter((item) =>
        currentPost.projectStack.includes(item),
      ).length;
      const sharedProject =
        currentPost.projectName && post.projectName === currentPost.projectName
          ? 2
          : 0;

      return {
        post,
        score: sharedTags * 2 + sharedStack + sharedProject,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.post.publishedAt.getTime() - left.post.publishedAt.getTime();
    })
    .slice(0, limit)
    .map((entry) => entry.post);
};

const allPostSummaries = sortBlogPostsByDate(allBlogPosts).map(summarizeBlogPost);

export const buildBlogIndex = (entries: readonly BlogSourceEntry[]): BlogIndex => {
  const posts = sortBlogPostsByDate(entries.map(buildBlogPost)).map(
    summarizeBlogPost,
  );

  return {
    posts,
    featuredPosts: getFeaturedBlogPosts(posts),
    tags: getBlogTags(posts),
  };
};

const blogIndex = {
  posts: allPostSummaries,
  featuredPosts: getFeaturedBlogPosts(allPostSummaries),
  tags: getBlogTags(allPostSummaries),
};

const blogLookup = new Map(allBlogPosts.map((post) => [post.slug, post] as const));

export const getBlogIndex = () => blogIndex;

export const getAllPosts = () => blogIndex.posts;

export const getFeaturedPosts = () => blogIndex.featuredPosts;

export const getLatestPosts = (limit = 3) => blogIndex.posts.slice(0, limit);

export const sortBlogPosts = (
  posts: readonly BlogPostSummary[],
  sort: BlogSort,
) => {
  const sortedByDate = sortBlogPostsByDate(posts);

  if (sort === "oldest") {
    return [...sortedByDate].reverse();
  }

  if (sort === "featured") {
    return [
      ...sortedByDate.filter((post) => post.featured),
      ...sortedByDate.filter((post) => !post.featured),
    ];
  }

  return sortedByDate;
};

export const getFilteredPosts = (query: string, sort: BlogSort = "newest") =>
  sortBlogPosts(searchBlogPosts(blogIndex.posts, query), sort);

export const getRelatedPosts = (currentSlug: string, limit = 3) =>
  getRelatedBlogPosts(blogIndex.posts, currentSlug, limit);

export const getPostBySlug = async (slug: string) => {
  const post = blogLookup.get(slug);

  if (!post) {
    return null;
  }

  const [{ evaluate }, runtime, { default: rehypeSlug }, { default: remarkGfm }] =
    await Promise.all([
      import("@mdx-js/mdx"),
      import("react/jsx-runtime"),
      import("rehype-slug"),
      import("remark-gfm"),
    ]);

  const module = await evaluate(post.content, {
    ...runtime,
    rehypePlugins: [rehypeSlug],
    remarkPlugins: [remarkGfm],
  });

  return {
    Content: module.default as ComponentType<Record<string, unknown>>,
    post: summarizeBlogPost(post),
  };
};

export const emptyBlogIndex = (): BlogIndex => ({
  posts: [],
  featuredPosts: [],
  tags: [],
});
