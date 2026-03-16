"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetConfirmSchema = exports.resetRequestSchema = exports.refreshSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    }),
});
exports.refreshSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1),
    }),
});
exports.resetRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
    }),
});
exports.resetConfirmSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1),
        newPassword: zod_1.z
            .string()
            .min(8)
            .regex(/[A-Z]/, "Must include uppercase")
            .regex(/\d/, "Must include number")
            .regex(/[^A-Za-z0-9]/, "Must include special"),
    }),
});
//# sourceMappingURL=auth.js.map