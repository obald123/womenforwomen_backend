import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { AuthError, ValidationError } from "../../utils/errors";
import { signAccessToken, signRefreshToken, verifyPassword, verifyRefreshToken, hashPassword } from "../../utils/auth";
import { saveRefreshToken, isRefreshTokenValid, revokeRefreshToken } from "../../services/tokenService";
import { setAuthCookies, clearAuthCookies } from "../../utils/cookies";
import { env } from "../../config/env";
import { sendMail } from "../../services/mailService";
import { resetPasswordTemplate } from "../../utils/emailTemplates";
import crypto from "crypto";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AuthError("Invalid credentials");

  const ok = await verifyPassword(password, user.password);
  if (!ok) throw new AuthError("Invalid credentials");

  const access = signAccessToken(user.id);
  const refresh = signRefreshToken(user.id);

  const refreshExpiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_TTL));
  await saveRefreshToken(user.id, refresh.token, refreshExpiresAt);

  setAuthCookies(res, access.token, refresh.token);
  res.json({
    success: true,
    accessToken: access.token,
    refreshToken: refresh.token,
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) throw new ValidationError("Missing refresh token");

  const valid = await isRefreshTokenValid(refreshToken);
  if (!valid) throw new AuthError("Invalid refresh token");

  const decoded = verifyRefreshToken(refreshToken);
  const access = signAccessToken(decoded.sub);

  setAuthCookies(res, access.token, refreshToken);
  res.json({ success: true, accessToken: access.token });
}

export async function logout(req: Request, res: Response) {
  const refreshToken = (req.body?.refreshToken as string) || (req.cookies?.refreshToken as string);
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  clearAuthCookies(res);
  res.json({ success: true });
}

export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ValidationError("User not found");

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const link = `${env.BASE_URL}/reset-password?token=${rawToken}`;
  const template = resetPasswordTemplate(link);
  await sendMail(user.email, template.subject, template.html, template.text);

  res.json({ success: true });
}

export async function confirmPasswordReset(req: Request, res: Response) {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.used || record.expiresAt.getTime() < Date.now()) {
    throw new AuthError("Invalid or expired token");
  }

  const password = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: record.userId }, data: { password } });
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } });

  res.json({ success: true });
}

function parseDuration(ttl: string) {
  const match = ttl.match(/^(\d+)(m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000;
}