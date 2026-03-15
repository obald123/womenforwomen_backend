import { z } from "zod";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const teamCategory = z.enum(["BOARD", "LEADERSHIP", "STAFF", "VOLUNTEERS"]);

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    role: z.string().min(2),
    bio: z.string().min(10),
    category: teamCategory,
    displayOrder: z.coerce.number().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    status: status.optional(),
  }),
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.string().min(2).optional(),
    bio: z.string().min(10).optional(),
    category: teamCategory.optional(),
    displayOrder: z.coerce.number().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    status: status.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listTeamSchema = z.object({
  query: z.object({
    status: status.optional(),
    category: teamCategory.optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});