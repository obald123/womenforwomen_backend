"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.requestPasswordReset = requestPasswordReset;
exports.confirmPasswordReset = confirmPasswordReset;
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const auth_1 = require("../../utils/auth");
const tokenService_1 = require("../../services/tokenService");
const cookies_1 = require("../../utils/cookies");
const env_1 = require("../../config/env");
const mailService_1 = require("../../services/mailService");
const emailTemplates_1 = require("../../utils/emailTemplates");
const crypto_1 = __importDefault(require("crypto"));
async function login(req, res) {
    const { email, password } = req.body;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new errors_1.AuthError("Invalid credentials");
    const ok = await (0, auth_1.verifyPassword)(password, user.password);
    if (!ok)
        throw new errors_1.AuthError("Invalid credentials");
    const access = (0, auth_1.signAccessToken)(user.id);
    const refresh = (0, auth_1.signRefreshToken)(user.id);
    const refreshExpiresAt = new Date(Date.now() + parseDuration(env_1.env.JWT_REFRESH_TTL));
    await (0, tokenService_1.saveRefreshToken)(user.id, refresh.token, refreshExpiresAt);
    (0, cookies_1.setAuthCookies)(res, access.token, refresh.token);
    res.json({
        success: true,
        accessToken: access.token,
        refreshToken: refresh.token,
    });
}
async function refresh(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken)
        throw new errors_1.ValidationError("Missing refresh token");
    const valid = await (0, tokenService_1.isRefreshTokenValid)(refreshToken);
    if (!valid)
        throw new errors_1.AuthError("Invalid refresh token");
    const decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
    const access = (0, auth_1.signAccessToken)(decoded.sub);
    (0, cookies_1.setAuthCookies)(res, access.token, refreshToken);
    res.json({ success: true, accessToken: access.token });
}
async function logout(req, res) {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
        await (0, tokenService_1.revokeRefreshToken)(refreshToken);
    }
    (0, cookies_1.clearAuthCookies)(res);
    res.json({ success: true });
}
async function requestPasswordReset(req, res) {
    const { email } = req.body;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new errors_1.ValidationError("User not found");
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma_1.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
    });
    const link = `${env_1.env.BASE_URL}/reset-password?token=${rawToken}`;
    const logoUrl = `${env_1.env.BASE_URL}/images/site/logo.png`;
    const template = (0, emailTemplates_1.resetPasswordTemplate)(link, logoUrl);
    await (0, mailService_1.sendMail)(user.email, template.subject, template.html, template.text);
    res.json({ success: true });
}
async function confirmPasswordReset(req, res) {
    const { token, newPassword } = req.body;
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const record = await prisma_1.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.used || record.expiresAt.getTime() < Date.now()) {
        throw new errors_1.AuthError("Invalid or expired token");
    }
    const password = await (0, auth_1.hashPassword)(newPassword);
    await prisma_1.prisma.user.update({ where: { id: record.userId }, data: { password } });
    await prisma_1.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } });
    res.json({ success: true });
}
function parseDuration(ttl) {
    const match = ttl.match(/^(\d+)(m|h|d)$/);
    if (!match)
        return 7 * 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === "m")
        return value * 60 * 1000;
    if (unit === "h")
        return value * 60 * 60 * 1000;
    return value * 24 * 60 * 60 * 1000;
}
//# sourceMappingURL=controller.js.map