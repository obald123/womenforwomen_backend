"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function signAccessToken(userId) {
    const jti = (0, uuid_1.v4)();
    const token = jsonwebtoken_1.default.sign({ sub: userId, jti }, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: env_1.env.JWT_ACCESS_TTL,
    });
    return { token, jti };
}
function signRefreshToken(userId) {
    const jti = (0, uuid_1.v4)();
    const token = jsonwebtoken_1.default.sign({ sub: userId, jti }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_TTL,
    });
    return { token, jti };
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
}
//# sourceMappingURL=auth.js.map