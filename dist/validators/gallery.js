"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGallerySchema = exports.updateGallerySchema = exports.createGallerySchema = void 0;
const zod_1 = require("zod");
const status = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const layout = zod_1.z.enum(["GRID", "MASONRY", "SLIDESHOW"]);
exports.createGallerySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        layout,
        status: status.optional(),
    }),
});
exports.updateGallerySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        layout: layout.optional(),
        status: status.optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.listGallerySchema = zod_1.z.object({
    query: zod_1.z.object({
        status: status.optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=gallery.js.map