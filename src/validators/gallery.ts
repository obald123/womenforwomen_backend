import { z } from "zod";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const layout = z.enum(["GRID", "MASONRY", "SLIDESHOW"]);

export const createGallerySchema = z.object({
  body: z.object({
    title: z.string().min(3),
    layout,
    status: status.optional(),
  }),
});

export const updateGallerySchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    layout: layout.optional(),
    status: status.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listGallerySchema = z.object({
  query: z.object({
    status: status.optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});