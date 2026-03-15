import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1).optional(),
  }),
});

export const campaignSchema = z.object({
  body: z.object({
    subject: z.string().min(3),
    content: z.string().min(10),
  }),
});