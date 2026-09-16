import { Request, Response } from "express";
import { Readable } from "stream";
import { prisma } from "../../config/prisma";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { saveCloudImage } from "../../services/imageService";
import { logAudit } from "../../services/auditService";
import { notifySubscribersOfNewContent } from "../../services/subscriberNotifyService";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import fs from "fs";
import {
  saveLocalFile,
  deleteLocalFile,
  isLocalFileReference,
  resolveLocalFilePath,
} from "../../utils/localFileStore";

function notifyReportPublished(report: { title: string; description: string | null }) {
  notifySubscribersOfNewContent({
    kicker: "New Impact Report",
    title: report.title,
    excerpt: report.description,
    url: `${env.BASE_URL}/impact#impact-reports`,
  }).catch((err) => logger.error("Failed to notify subscribers of new report", { error: (err as Error).message }));
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Report files live either on the backend's own disk (new uploads — see
// createImpactReport) or, for rows created before that change, on Cloudinary as a "raw"
// resource with no extension in the URL. Either way, proxy the download so we can hand
// back a correct filename and Content-Type explicitly.
async function streamReportFile(res: Response, report: { fileUrl: string; fileName: string | null }) {
  const rawName = report.fileName || "report.pdf";
  const ext = rawName.includes(".") ? rawName.slice(rawName.lastIndexOf(".")).toLowerCase() : "";
  const filename = ext ? rawName : `${rawName}.pdf`;

  if (isLocalFileReference(report.fileUrl)) {
    const filePath = resolveLocalFilePath(report.fileUrl);
    if (!fs.existsSync(filePath)) throw new NotFoundError("File not found");
    res.setHeader("Content-Type", EXT_CONTENT_TYPES[ext] || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const response = await fetch(report.fileUrl);
  if (!response.ok || !response.body) {
    throw new NotFoundError("File not found");
  }
  const contentType = EXT_CONTENT_TYPES[ext] || response.headers.get("content-type") || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const nodeStream = Readable.fromWeb(response.body as any);
  nodeStream.pipe(res);
}

export async function createImpactReport(req: Request, res: Response) {
  const { title, year, description, status } = req.body as Record<string, string>;
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  const reportFile = files?.file?.[0];
  if (!reportFile) throw new ValidationError("A report file is required");
  const uploadedFile = await saveLocalFile(reportFile, "impact-reports");

  const coverFile = files?.coverImage?.[0];
  const coverImage = coverFile ? (await saveCloudImage(coverFile, "wfw/impact-reports")).url : null;

  const resolvedStatus = (status as any) || "PUBLISHED";
  const report = await prisma.impactReport.create({
    data: {
      title,
      year: year ? Number(year) : null,
      description: description || null,
      coverImage,
      fileUrl: uploadedFile.reference,
      fileName: reportFile.originalname || null,
      status: resolvedStatus,
      publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAudit("impactReport.create", req.user?.id ?? null, { id: report.id });
  if (report.status === "PUBLISHED") notifyReportPublished(report);
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

// Mounted on the public router, so only published reports are downloadable this way.
export async function downloadImpactReport(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.impactReport.findUnique({ where: { id } });
  if (!item || item.status !== "PUBLISHED") throw new NotFoundError("Impact report not found");
  await streamReportFile(res, item);
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
    const uploaded = await saveLocalFile(reportFile, "impact-reports");
    if (isLocalFileReference(existing.fileUrl)) await deleteLocalFile(existing.fileUrl);
    updates.fileUrl = uploaded.reference;
    updates.fileName = reportFile.originalname || null;
  }
  const coverFile = files?.coverImage?.[0];
  if (coverFile) {
    const uploaded = await saveCloudImage(coverFile, "wfw/impact-reports");
    updates.coverImage = uploaded.url;
  }

  const item = await prisma.impactReport.update({ where: { id }, data: updates });
  await logAudit("impactReport.update", req.user?.id ?? null, { id: item.id });
  if (existing.status !== "PUBLISHED" && item.status === "PUBLISHED") notifyReportPublished(item);
  res.json({ success: true, data: item });
}

export async function deleteImpactReport(req: Request, res: Response) {
  const { id } = req.params;
  const deleted = await prisma.impactReport.delete({ where: { id } });
  if (isLocalFileReference(deleted.fileUrl)) await deleteLocalFile(deleted.fileUrl);
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
