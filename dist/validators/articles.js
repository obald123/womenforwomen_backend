"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listArticleSchema = exports.updateArticleSchema = exports.createArticleSchema = void 0;
const zod_1 = require("zod");
const category = zod_1.z.enum(["NEWS", "STORY", "PRESS", "BLOG"]);
const status = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
exports.createArticleSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        excerpt: zod_1.z.string().min(10),
        content: zod_1.z.string().min(20),
        category,
        status: status.optional(),
    }),
});
exports.updateArticleSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        excerpt: zod_1.z.string().min(10).optional(),
        content: zod_1.z.string().min(20).optional(),
        category: category.optional(),
        status: status.optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.listArticleSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: status.optional(),
        category: category.optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=articles.js.map