"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listImpactReportSchema = exports.updateImpactReportSchema = exports.createImpactReportSchema = void 0;
const zod_1 = require("zod");
const status = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
exports.createImpactReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        year: zod_1.z.coerce.number().int().optional(),
        description: zod_1.z.string().optional(),
        status: status.optional(),
    }),
});
exports.updateImpactReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        year: zod_1.z.coerce.number().int().optional(),
        description: zod_1.z.string().optional(),
        displayOrder: zod_1.z.coerce.number().int().optional(),
        status: status.optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.listImpactReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: status.optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=impactReports.js.map