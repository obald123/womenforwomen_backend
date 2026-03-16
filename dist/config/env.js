"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_TTL: zod_1.z.string().default("15m"),
    JWT_REFRESH_TTL: zod_1.z.string().default("7d"),
    ADMIN_EMAIL: zod_1.z.string().email(),
    ADMIN_PASSWORD: zod_1.z.string().min(8),
    BASE_URL: zod_1.z.string().url(),
    API_URL: zod_1.z.string().url(),
    MAIL_HOST: zod_1.z.string().min(1),
    MAIL_PORT: zod_1.z.coerce.number(),
    MAIL_USER: zod_1.z.string().min(1),
    MAIL_PASS: zod_1.z.string().min(1),
    MAIL_FROM: zod_1.z.string().email(),
    CORS_ORIGINS: zod_1.z.string().min(1),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map