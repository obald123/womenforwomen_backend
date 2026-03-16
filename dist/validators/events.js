"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEventSchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
const status = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const boolLike = zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]);
exports.createEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        excerpt: zod_1.z.string().min(10),
        content: zod_1.z.string().min(20),
        eventDate: zod_1.z.string().min(1),
        endDate: zod_1.z.string().optional(),
        location: zod_1.z.string().min(2),
        isOnline: boolLike.optional(),
        meetingLink: zod_1.z.string().url().optional(),
        badgeLabel: zod_1.z.string().min(2).optional(),
        isFeatured: boolLike.optional(),
        status: status.optional(),
    }),
});
exports.updateEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        excerpt: zod_1.z.string().min(10).optional(),
        content: zod_1.z.string().min(20).optional(),
        eventDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        isOnline: boolLike.optional(),
        meetingLink: zod_1.z.string().url().optional(),
        badgeLabel: zod_1.z.string().min(2).optional(),
        isFeatured: boolLike.optional(),
        status: status.optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.listEventSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: status.optional(),
        upcoming: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=events.js.map