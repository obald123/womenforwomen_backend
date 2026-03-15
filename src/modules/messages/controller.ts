import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { parsePagination } from "../../utils/pagination";
import { NotFoundError } from "../../utils/errors";
import { logAudit } from "../../services/auditService";

export async function createMessage(req: Request, res: Response) {
  const { name, email, phone, organization, message } = req.body as Record<string, string>;
  const item = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      organization: organization || null,
      message,
    },
  });
  res.status(201).json({ success: true, data: item });
}

export async function listMessages(req: Request, res: Response) {
  const { unread, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = {};
  if (unread === "true") where.isRead = false;

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.contactMessage.count({ where }),
  ]);

  res.json({ success: true, data: items, total });
}

export async function getMessage(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.contactMessage.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Message not found");
  res.json({ success: true, data: item });
}

export async function updateMessage(req: Request, res: Response) {
  const { id } = req.params;
  const { isRead } = req.body as { isRead?: boolean };
  const item = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: Boolean(isRead) },
  });
  await logAudit("message.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteMessage(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.contactMessage.delete({ where: { id } });
  await logAudit("message.delete", req.user?.id ?? null, { id });
  res.json({ success: true });
}
