import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { saveCloudImage } from "../../services/imageService";
import { logAudit } from "../../services/auditService";
import { ValidationError } from "../../utils/errors";

export async function createGallery(req: Request, res: Response) {
  const { title, layout, status } = req.body as Record<string, string>;
  const files = req.files as Express.Multer.File[] | undefined;
  let captions: string[] = [];
  if (req.body.captions) {
    try {
      captions = JSON.parse(req.body.captions);
    } catch {
      throw new ValidationError("Invalid captions JSON");
    }
  }

  const images = [] as Array<{ url: string; caption?: string }>;
  if (files?.length) {
    for (let i = 0; i < files.length; i += 1) {
      const saved = await saveCloudImage(files[i], "wfw/galleries");
      images.push({ url: saved.url, caption: captions[i] });
    }
  }

  const gallery = await prisma.gallery.create({
    data: {
      title,
      images,
      layout: (layout as any) || "GRID",
      status: (status as any) || "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAudit("gallery.create", req.user?.id ?? null, { id: gallery.id });
  res.status(201).json({ success: true, data: gallery });
}

export async function listGalleries(req: Request, res: Response) {
  const { status, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.gallery.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.gallery.count({ where }),
  ]);

  res.json({ success: true, data: items, total });
}

export async function getGallery(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.gallery.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Gallery not found");
  res.json({ success: true, data: item });
}

export async function updateGallery(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Gallery not found");

  const updates = req.body as Record<string, string>;
  const item = await prisma.gallery.update({ where: { id }, data: updates as any });
  await logAudit("gallery.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteGallery(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.gallery.update({ where: { id }, data: { status: "ARCHIVED" } });
  await logAudit("gallery.archive", req.user?.id ?? null, { id });
  res.json({ success: true });
}

export async function publishGallery(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.gallery.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await logAudit("gallery.publish", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}
