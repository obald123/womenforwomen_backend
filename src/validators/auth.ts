import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const resetRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetConfirmSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/\d/, "Must include number")
      .regex(/[^A-Za-z0-9]/, "Must include special"),
  }),
});