"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSchema = void 0;
const zod_1 = require("zod");
exports.searchSchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().min(2),
    }),
});
//# sourceMappingURL=search.js.map