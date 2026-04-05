import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/blog" }),
  schema: z
    .object({
      title: z.string(),
      slug: z.string().optional(),
      description: z.string(),
      longDescription: z.string().optional(),
      cardImage: z.url().optional(),
      tags: z.array(z.string()).optional(),
      readTime: z.number().optional(),
      featured: z.boolean().default(false),
      timestamp: z.date().transform((val) => new Date(val)),
    })
    .transform((data) => {
      const slug =
        data.slug ??
        data.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");

      return {
        ...data,
        slug,
      };
    }),
});

const project = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/projects" }),
  schema: z
    .object({
      title: z.string(),
      slug: z.string().optional(),
      description: z.string(),
      longDescription: z.string().optional(),
      cardImage: z.url().optional(),
      tags: z.array(z.string()).optional(),
      githubUrl: z.url().optional(),
      liveDemoUrl: z.url().optional(),
      timestamp: z.date().transform((val) => new Date(val)),
      featured: z.boolean().default(false),
    })
    .transform((data) => {
      const slug =
        data.slug ??
        data.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");

      return {
        ...data,
        slug,
      };
    }),
});

export const collections = { blog, project };
