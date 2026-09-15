import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { saveCloudFile, saveCloudImage } from "../../services/imageService";
import { logAudit } from "../../services/auditService";

export async function createImpactReport(req: Request, res: Response) {
  const { title, year, description, status } = req.body as Record<string, string>;
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  const reportFile = files?.file?.[0];
  if (!reportFile) throw new ValidationError("A report file is required");
  const uploadedFile = await saveCloudFile(reportFile, "wfw/impact-reports");

  const coverFile = files?.coverImage?.[0];
  const coverImage = coverFile ? (await saveCloudImage(coverFile, "wfw/impact-reports")).url : null;

  const resolvedStatus = (status as any) || "PUBLISHED";
  const report = await prisma.impactReport.create({
    data: {
      title,
      year: year ? Number(year) : null,
      description: description || null,
      coverImage,
      fileUrl: uploadedFile.url,
      fileName: reportFile.originalname || null,
      status: resolvedStatus,
      publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAudit("impactReport.create", req.user?.id ?? null, { id: report.id });
  res.status(201).json({ success: true, data: report });
}

export async function listImpactReports(req: Request, res: Response) {
  const { status, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);
  const where: any = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.impactReport.findMany({
      where,
      skip,
      take,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.impactReport.count({ where }),
  ]);
  res.json({ success: true, data: items, total });
}

export async function getImpactReport(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.impactReport.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Impact report not found");
  res.json({ success: true, data: item });
}

export async function updateImpactReport(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.impactReport.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Impact report not found");

  const updates = req.body as any;
  if (updates.year !== undefined) updates.year = updates.year ? Number(updates.year) : null;
  if (updates.status === "PUBLISHED" && !existing.publishedAt) {
    updates.publishedAt = new Date();
  }

  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const reportFile = files?.file?.[0];
  if (reportFile) {
    const uploaded = await saveCloudFile(reportFile, "wfw/impact-reports");
    updates.fileUrl = uploaded.url;
    updates.fileName = reportFile.originalname || null;
  }
  const coverFile = files?.coverImage?.[0];
  if (coverFile) {
    const uploaded = await saveCloudImage(coverFile, "wfw/impact-reports");
    updates.coverImage = uploaded.url;
  }

  const item = await prisma.impactReport.update({ where: { id }, data: updates });
  await logAudit("impactReport.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteImpactReport(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.impactReport.delete({ where: { id } });
  await logAudit("impactReport.delete", req.user?.id ?? null, { id });
  res.json({ success: true });
}

export async function publicImpactReports(req: Request, res: Response) {
  const { page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);
  const where = { status: "PUBLISHED" as const };

  const [items, total] = await Promise.all([
    prisma.impactReport.findMany({
      where,
      skip,
      take,
      orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
    }),
    prisma.impactReport.count({ where }),
  ]);
  res.json({ success: true, data: items, total });
}
