import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { sanitizeContent } from "../../utils/sanitize";
import { toSlug } from "../../utils/slug";
import { saveCloudImage } from "../../services/imageService";
import { logAudit } from "../../services/auditService";

async function uniqueSlug(base: string) {
  let slug = toSlug(base);
  let exists = await prisma.event.findUnique({ where: { slug } });
  let i = 1;
  while (exists) {
    slug = `${toSlug(base)}-${i}`;
    exists = await prisma.event.findUnique({ where: { slug } });
    i += 1;
  }
  return slug;
}

export async function createEvent(req: Request, res: Response) {
  const { title, excerpt, content, eventDate, endDate, location, isOnline, meetingLink, status } =
    req.body as Record<string, string>;

  const slug = await uniqueSlug(title);
  let coverImage: string | undefined;
  if (req.file) {
    const saved = await saveCloudImage(req.file, "wfw/events");
    coverImage = saved.url;
  }

  const event = await prisma.event.create({
    data: {
      title,
      slug,
      excerpt,
      content: sanitizeContent(content),
      coverImage,
      eventDate: new Date(eventDate),
      endDate: endDate ? new Date(endDate) : null,
      location,
      isOnline: isOnline === "true" || isOnline === true,
      meetingLink: meetingLink || null,
      status: (status as any) || "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAudit("event.create", req.user?.id ?? null, { id: event.id });
  res.status(201).json({ success: true, data: event });
}

export async function listEvents(req: Request, res: Response) {
  const { status, upcoming, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = {};
  if (status) where.status = status;
  if (upcoming === "true") where.eventDate = { gte: new Date() };

  const [items, total] = await Promise.all([
    prisma.event.findMany({ where, skip, take, orderBy: { eventDate: "asc" } }),
    prisma.event.count({ where }),
  ]);

  res.json({ success: true, data: items, total });
}

export async function getEvent(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.event.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Event not found");
  res.json({ success: true, data: item });
}

export async function updateEvent(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Event not found");

  const updates = req.body as Record<string, string>;
  if (updates.title) updates.slug = await uniqueSlug(updates.title);
  if (updates.content) updates.content = sanitizeContent(updates.content);
  if (req.file) {
    const saved = await saveCloudImage(req.file, "wfw/events");
    updates.coverImage = saved.url;
  }
  if (updates.eventDate) updates.eventDate = new Date(updates.eventDate).toISOString();
  if (updates.endDate) updates.endDate = new Date(updates.endDate).toISOString();
  if (updates.status === "PUBLISHED" && !existing.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }

  const item = await prisma.event.update({ where: { id }, data: updates as any });
  await logAudit("event.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteEvent(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.event.update({ where: { id }, data: { status: "ARCHIVED" } });
  await logAudit("event.archive", req.user?.id ?? null, { id });
  res.json({ success: true });
}

export async function publishEvent(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.event.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await logAudit("event.publish", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}
