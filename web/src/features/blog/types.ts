export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  featured: boolean;
  projectName?: string;
  projectUrl?: string;
  projectSummary?: string;
  projectStack: string[];
};

export type BlogFrontmatterInput = Partial<BlogFrontmatter> & {
  date?: string;
};

export type BlogSourceEntry = {
  filename: string;
  source: string;
};

export type BlogPost = BlogFrontmatter & {
  slug: string;
  filename: string;
  sourcePath: string;
  excerpt: string;
  content: string;
  publishedAt: Date;
  readingTimeMinutes: number;
};

export type BlogPostSummary = Omit<BlogPost, "content" | "sourcePath">;

export type BlogIndex = {
  posts: BlogPostSummary[];
  featuredPosts: BlogPostSummary[];
  tags: string[];
};

export type BlogSort = "featured" | "newest" | "oldest";
