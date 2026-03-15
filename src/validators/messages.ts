import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const createMessageSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    organization: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    message: z.string().trim().min(10),
  }),
});

export const listMessageSchema = z.object({
  query: z.object({
    unread: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const updateMessageSchema = z.object({
  body: z.object({
    isRead: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});
