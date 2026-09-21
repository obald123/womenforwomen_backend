import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { saveCloudImage, saveCloudVideo, deleteCloudAsset } from "../../services/imageService";
import { logAudit } from "../../services/auditService";
import { ValidationError } from "../../utils/errors";

type GalleryImage = { id: string; url: string; publicId: string | null; caption?: string };
type GalleryVideo = { id: string; url: string; publicId: string | null; caption?: string };

function parseCaptions(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw as string);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed;
  } catch {
    throw new ValidationError("Invalid captions JSON");
  }
}

export async function createGallery(req: Request, res: Response) {
  const { title, layout, status } = req.body as Record<string, string>;
  const publishedAtRaw = (req.body as Record<string, string>).publishedAt;
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const captions = parseCaptions(req.body.captions);

  let publishedAt: Date | null = null;
  if (publishedAtRaw) {
    const parsed = new Date(publishedAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError("Invalid publishedAt date");
    }
    publishedAt = parsed;
  }

  const gallery = await prisma.gallery.create({
    data: {
      title,
      images: [],
      videos: [],
      layout: (layout as any) || "GRID",
      status: (status as any) || "DRAFT",
      publishedAt: status === "PUBLISHED" ? publishedAt ?? new Date() : publishedAt,
    },
  });

  try {
    const folder = `wfw/galleries/${gallery.id}`;
    const images: GalleryImage[] = [];
    const imageFiles = files?.images ?? [];
    for (let i = 0; i < imageFiles.length; i += 1) {
      const saved = await saveCloudImage(imageFiles[i], folder);
      images.push({ id: crypto.randomUUID(), url: saved.url, publicId: saved.publicId, caption: captions[i] });
    }
    const videos: GalleryVideo[] = [];
    const videoFiles = files?.videos ?? [];
    for (let i = 0; i < videoFiles.length; i += 1) {
      const saved = await saveCloudVideo(videoFiles[i], folder);
      videos.push({ id: crypto.randomUUID(), url: saved.url, publicId: saved.publicId });
    }

    const updated = await prisma.gallery.update({
      where: { id: gallery.id },
      data: { images, videos },
    });

    await logAudit("gallery.create", req.user?.id ?? null, { id: updated.id });
    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    await prisma.gallery.delete({ where: { id: gallery.id } }).catch(() => {});
    throw err;
  }
}

export async function listGalleries(req: Request, res: Response) {
  const { status, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = {};
  if (status) {
    where.status = status;
  } else {
    where.status = { not: "ARCHIVED" };
  }

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
  if (updates.publishedAt) {
    const parsed = new Date(updates.publishedAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError("Invalid publishedAt date");
    }
    (updates as any).publishedAt = parsed;
  }
  if (updates.status === "PUBLISHED" && !existing.publishedAt && !updates.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }
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

async function loadGalleryOrThrow(id: string) {
  const gallery = await prisma.gallery.findUnique({ where: { id } });
  if (!gallery) throw new NotFoundError("Gallery not found");
  return gallery;
}

export async function addGalleryImages(req: Request, res: Response) {
  const { id } = req.params;
  const gallery = await loadGalleryOrThrow(id);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new ValidationError("No images provided");
  const captions = parseCaptions(req.body.captions);

  const folder = `wfw/galleries/${gallery.id}`;
  const existing = (gallery.images as unknown as GalleryImage[]) ?? [];
  const added: GalleryImage[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const saved = await saveCloudImage(files[i], folder);
    added.push({ id: crypto.randomUUID(), url: saved.url, publicId: saved.publicId, caption: captions[i] });
  }

  const updated = await prisma.gallery.update({
    where: { id },
    data: { images: [...existing, ...added] },
  });

  await logAudit("gallery.images.add", req.user?.id ?? null, { id, count: added.length });
  res.status(201).json({ success: true, data: updated });
}

export async function deleteGalleryImage(req: Request, res: Response) {
  const { id, imageId } = req.params;
  const gallery = await loadGalleryOrThrow(id);
  const existing = (gallery.images as unknown as GalleryImage[]) ?? [];
  const target = existing.find((img) => img.id === imageId);
  if (!target) throw new NotFoundError("Image not found");

  if (target.publicId) {
    await deleteCloudAsset(target.publicId, "image");
  }

  const updated = await prisma.gallery.update({
    where: { id },
    data: { images: existing.filter((img) => img.id !== imageId) },
  });

  await logAudit("gallery.images.remove", req.user?.id ?? null, { id, imageId });
  res.json({ success: true, data: updated });
}

export async function updateGalleryImageCaption(req: Request, res: Response) {
  const { id, imageId } = req.params;
  const { caption } = req.body as Record<string, string>;
  const gallery = await loadGalleryOrThrow(id);
  const existing = (gallery.images as unknown as GalleryImage[]) ?? [];
  if (!existing.some((img) => img.id === imageId)) throw new NotFoundError("Image not found");

  const images = existing.map((img) => (img.id === imageId ? { ...img, caption } : img));
  const updated = await prisma.gallery.update({ where: { id }, data: { images } });
  res.json({ success: true, data: updated });
}

export async function addGalleryVideos(req: Request, res: Response) {
  const { id } = req.params;
  const gallery = await loadGalleryOrThrow(id);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new ValidationError("No videos provided");

  const folder = `wfw/galleries/${gallery.id}`;
  const existing = (gallery.videos as unknown as GalleryVideo[]) ?? [];
  const added: GalleryVideo[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const saved = await saveCloudVideo(files[i], folder);
    added.push({ id: crypto.randomUUID(), url: saved.url, publicId: saved.publicId });
  }

  const updated = await prisma.gallery.update({
    where: { id },
    data: { videos: [...existing, ...added] },
  });

  await logAudit("gallery.videos.add", req.user?.id ?? null, { id, count: added.length });
  res.status(201).json({ success: true, data: updated });
}

export async function deleteGalleryVideo(req: Request, res: Response) {
  const { id, videoId } = req.params;
  const gallery = await loadGalleryOrThrow(id);
  const existing = (gallery.videos as unknown as GalleryVideo[]) ?? [];
  const target = existing.find((vid) => vid.id === videoId);
  if (!target) throw new NotFoundError("Video not found");

  if (target.publicId) {
    await deleteCloudAsset(target.publicId, "video");
  }

  const updated = await prisma.gallery.update({
    where: { id },
    data: { videos: existing.filter((vid) => vid.id !== videoId) },
  });

  await logAudit("gallery.videos.remove", req.user?.id ?? null, { id, videoId });
  res.json({ success: true, data: updated });
}

export async function updateGalleryVideoCaption(req: Request, res: Response) {
  const { id, videoId } = req.params;
  const { caption } = req.body as Record<string, string>;
  const gallery = await loadGalleryOrThrow(id);
  const existing = (gallery.videos as unknown as GalleryVideo[]) ?? [];
  if (!existing.some((vid) => vid.id === videoId)) throw new NotFoundError("Video not found");

  const videos = existing.map((vid) => (vid.id === videoId ? { ...vid, caption } : vid));
  const updated = await prisma.gallery.update({ where: { id }, data: { videos } });
  res.json({ success: true, data: updated });
}
