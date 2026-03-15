import crypto from "crypto";
import { prisma } from "../config/prisma";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function saveRefreshToken(userId: string, token: string, expiresAt: Date) {
  const tokenHash = hashToken(token);
  return prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}

export async function isRefreshTokenValid(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.revoked) return false;
  if (record.expiresAt.getTime() < Date.now()) return false;
  return true;
}