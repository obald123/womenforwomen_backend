import { z } from "zod";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createImpactReportSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    year: z.coerce.number().int().optional(),
    description: z.string().optional(),
    status: status.optional(),
  }),
});

export const updateImpactReportSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    year: z.coerce.number().int().optional(),
    description: z.string().optional(),
    displayOrder: z.coerce.number().int().optional(),
    status: status.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listImpactReportSchema = z.object({
  query: z.object({
    status: status.optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
