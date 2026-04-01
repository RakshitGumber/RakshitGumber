declare module "virtual:blog-content" {
  export const blogEntries: Array<{
    filename: string;
    frontmatter: Record<string, unknown>;
    content: string;
  }>;
}
