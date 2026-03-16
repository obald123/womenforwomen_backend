"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMessageSchema = exports.listMessageSchema = exports.createMessageSchema = void 0;
const zod_1 = require("zod");
const emptyToUndefined = (value) => {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
};
exports.createMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().trim().min(2),
        email: zod_1.z.string().trim().email(),
        phone: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().trim().optional()),
        organization: zod_1.z.preprocess(emptyToUndefined, zod_1.z.string().trim().optional()),
        message: zod_1.z.string().trim().min(10),
    }),
});
exports.listMessageSchema = zod_1.z.object({
    query: zod_1.z.object({
        unread: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        pageSize: zod_1.z.string().optional(),
    }),
});
exports.updateMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        isRead: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
//# sourceMappingURL=messages.js.map