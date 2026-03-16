"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = hashToken;
exports.saveRefreshToken = saveRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.isRefreshTokenValid = isRefreshTokenValid;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../config/prisma");
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
async function saveRefreshToken(userId, token, expiresAt) {
    const tokenHash = hashToken(token);
    return prisma_1.prisma.refreshToken.create({
        data: { userId, tokenHash, expiresAt },
    });
}
async function revokeRefreshToken(token) {
    const tokenHash = hashToken(token);
    await prisma_1.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
    });
}
async function isRefreshTokenValid(token) {
    const tokenHash = hashToken(token);
    const record = await prisma_1.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revoked)
        return false;
    if (record.expiresAt.getTime() < Date.now())
        return false;
    return true;
}
//# sourceMappingURL=tokenService.js.map