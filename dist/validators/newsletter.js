"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignSchema = exports.subscribeSchema = void 0;
const zod_1 = require("zod");
exports.subscribeSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        name: zod_1.z.string().min(1).optional(),
    }),
});
exports.campaignSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(3),
        content: zod_1.z.string().min(10),
    }),
});
//# sourceMappingURL=newsletter.js.map