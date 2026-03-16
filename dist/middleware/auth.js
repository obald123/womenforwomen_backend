"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
function requireAuth(req, _res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const cookieToken = req.cookies?.accessToken;
    const accessToken = token || cookieToken;
    if (!accessToken)
        throw new errors_1.AuthError("Missing access token");
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, env_1.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.sub };
        req.tokenId = decoded.jti;
        next();
    }
    catch {
        throw new errors_1.AuthError("Invalid or expired access token");
    }
}
//# sourceMappingURL=auth.js.map