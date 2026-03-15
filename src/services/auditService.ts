import { prisma } from "../config/prisma";

export async function logAudit(action: string, userId: string | null, details?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      action,
      userId,
      details: details ? JSON.stringify(details) : undefined,
    },
  });
}