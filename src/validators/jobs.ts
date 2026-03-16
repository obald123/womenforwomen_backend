import { z } from "zod";

const jobStatus = z.enum(["OPEN", "CLOSED"]);
const appStatus = z.enum(["NEW", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"]);
const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().url().optional()
);

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    department: z.string().optional(),
    location: z.string().optional(),
    employment: z.string().optional(),
    description: z.string().min(20),
    requirements: z.array(z.string()).optional(),
    dueDate: z.coerce.date().optional(),
    status: jobStatus.optional(),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    employment: z.string().optional(),
    description: z.string().min(20).optional(),
    requirements: z.array(z.string()).optional(),
    dueDate: z.coerce.date().optional(),
    status: jobStatus.optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listJobSchema = z.object({
  query: z.object({
    status: jobStatus.optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const applyJobSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    coverLetter: z.string().optional(),
    linkedinUrl: optionalUrl,
    portfolioUrl: optionalUrl,
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const applyGeneralSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    coverLetter: z.string().optional(),
    linkedinUrl: optionalUrl,
    portfolioUrl: optionalUrl,
  }),
});

export const updateApplicationSchema = z.object({
  body: z.object({
    status: appStatus,
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const updateGeneralApplicationSchema = updateApplicationSchema;
