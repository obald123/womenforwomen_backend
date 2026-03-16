"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGeneralApplicationSchema = exports.updateApplicationSchema = exports.applyGeneralSchema = exports.applyJobSchema = exports.listJobSchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
const jobStatus = zod_1.z.enum(["OPEN", "CLOSED"]);
const appStatus = zod_1.z.enum(["NEW", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"]);
const optionalUrl = zod_1.z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), zod_1.z.string().url().optional());
exports.createJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        department: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        employment: zod_1.z.string().optional(),
        description: zod_1.z.string().min(20),
        requirements: zod_1.z.array(zod_1.z.string()).optional(),
        dueDate: zod_1.z.coerce.date().optional(),
        status: jobStatus.optional(),
    }),
});
exports.updateJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        department: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        employment: zod_1.z.string().optional(),
        description: zod_1.z.string().min(20).optional(),
        requirements: zod_1.z.array(zod_1.z.string()).optional(),
        dueDate: zod_1.z.coerce.date().optional(),
        status: jobStatus.optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.listJobSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: jobStatus.optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
exports.applyJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().optional(),
        coverLetter: zod_1.z.string().optional(),
        linkedinUrl: optionalUrl,
        portfolioUrl: optionalUrl,
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.applyGeneralSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().optional(),
        coverLetter: zod_1.z.string().optional(),
        linkedinUrl: optionalUrl,
        portfolioUrl: optionalUrl,
    }),
});
exports.updateApplicationSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: appStatus,
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.updateGeneralApplicationSchema = exports.updateApplicationSchema;
//# sourceMappingURL=jobs.js.map