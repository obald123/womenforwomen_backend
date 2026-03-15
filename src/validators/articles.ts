import { z } from "zod";

const category = z.enum(["NEWS", "STORY", "PRESS", "BLOG"]);
const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    excerpt: z.string().min(10),
    content: z.string().min(20),
    category,
    status: status.optional(),
  }),
});

export const updateArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    excerpt: z.string().min(10).optional(),
    content: z.string().min(20).optional(),
    category: category.optional(),
    status: status.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listArticleSchema = z.object({
  query: z.object({
    status: status.optional(),
    category: category.optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});