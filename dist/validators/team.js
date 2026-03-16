"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamSchema = exports.updateTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
const status = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const teamCategory = zod_1.z.enum(["BOARD", "LEADERSHIP", "STAFF", "VOLUNTEERS"]);
exports.createTeamSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        role: zod_1.z.string().min(2),
        bio: zod_1.z.string().min(10),
        category: teamCategory,
        displayOrder: zod_1.z.coerce.number().optional(),
        linkedin: zod_1.z.string().url().optional(),
        twitter: zod_1.z.string().url().optional(),
        status: status.optional(),
    }),
});
exports.updateTeamSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        role: zod_1.z.string().min(2).optional(),
        bio: zod_1.z.string().min(10).optional(),
        category: teamCategory.optional(),
        displayOrder: zod_1.z.coerce.number().optional(),
        linkedin: zod_1.z.string().url().optional(),
        twitter: zod_1.z.string().url().optional(),
        status: status.optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.listTeamSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: status.optional(),
        category: teamCategory.optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=team.js.map