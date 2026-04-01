import fs from "node:fs";
import path from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import matter from "gray-matter";
import { defineConfig, searchForWorkspaceRoot } from "vite";

const BLOG_CONTENT_MODULE_ID = "virtual:blog-content";
const RESOLVED_BLOG_CONTENT_MODULE_ID = `\0${BLOG_CONTENT_MODULE_ID}`;
const BLOG_DIRECTORY = path.resolve(__dirname, "../content/blog");

const blogContentPlugin = () => ({
  name: "portfolio-blog-content",
  resolveId(id: string) {
    if (id === BLOG_CONTENT_MODULE_ID) {
      return RESOLVED_BLOG_CONTENT_MODULE_ID;
    }

    return null;
  },
  load(id: string) {
    if (id !== RESOLVED_BLOG_CONTENT_MODULE_ID) {
      return null;
    }

    const blogEntries = fs
      .readdirSync(BLOG_DIRECTORY, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
      .map((entry) => {
        const filename = path.join(BLOG_DIRECTORY, entry.name);
        const source = fs.readFileSync(filename, "utf8");
        const parsed = matter(source);

        return {
          filename,
          frontmatter: parsed.data,
          content: parsed.content,
        };
      });

    return `export const blogEntries = ${JSON.stringify(blogEntries)};`;
  },
});

export default defineConfig({
  plugins: [
    tailwindcss(),
    blogContentPlugin(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        path.resolve(__dirname, "../content"),
      ],
    },
  },
});
