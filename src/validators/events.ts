import { z } from "zod";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const boolLike = z.union([z.boolean(), z.string()]);

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    excerpt: z.string().min(10),
    content: z.string().min(20),
    eventDate: z.string().min(1),
    endDate: z.string().optional(),
    location: z.string().min(2),
    isOnline: boolLike.optional(),
    meetingLink: z.string().url().optional(),
    status: status.optional(),
  }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    excerpt: z.string().min(10).optional(),
    content: z.string().min(20).optional(),
    eventDate: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string().optional(),
    isOnline: boolLike.optional(),
    meetingLink: z.string().url().optional(),
    status: status.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listEventSchema = z.object({
  query: z.object({
    status: status.optional(),
    upcoming: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});