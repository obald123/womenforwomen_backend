"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLimiter = exports.authLimiter = exports.publicLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
const isProd = process.env.NODE_ENV === "production";
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 5 : 50,
    standardHeaders: true,
    legacyHeaders: false,
});
exports.adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimiters.js.map