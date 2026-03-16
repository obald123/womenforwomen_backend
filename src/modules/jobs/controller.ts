import { Request, Response } from "express";
import { Readable } from "stream";
import { prisma } from "../../config/prisma";
import { parsePagination } from "../../utils/pagination";
import { toSlug } from "../../utils/slug";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { logAudit } from "../../services/auditService";
import { saveCloudFile } from "../../services/imageService";

async function uniqueSlug(base: string) {
  let slug = toSlug(base);
  let exists = await prisma.jobOpening.findUnique({ where: { slug } });
  let i = 1;
  while (exists) {
    slug = `${toSlug(base)}-${i}`;
    exists = await prisma.jobOpening.findUnique({ where: { slug } });
    i += 1;
  }
  return slug;
}

export async function createJob(req: Request, res: Response) {
  const { title, department, location, employment, description, requirements, status, dueDate } = req.body as any;
  const parsedDueDate = dueDate ? new Date(dueDate) : null;
  const slug = await uniqueSlug(title);
  const job = await prisma.jobOpening.create({
    data: {
      title,
      slug,
      department: department || null,
      location: location || null,
      employment: employment || null,
      description,
      requirements: requirements || null,
      dueDate: parsedDueDate,
      status: status || "OPEN",
    },
  });
  await logAudit("job.create", req.user?.id ?? null, { id: job.id });
  res.status(201).json({ success: true, data: job });
}

export async function listJobs(req: Request, res: Response) {
  const { status, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);
  const where: any = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.jobOpening.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.jobOpening.count({ where }),
  ]);
  res.json({ success: true, data: items, total });
}

export async function getJob(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.jobOpening.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Job not found");
  res.json({ success: true, data: item });
}

export async function updateJob(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body as any;
  if (updates.title) updates.slug = await uniqueSlug(updates.title);
  if (updates.dueDate === "") updates.dueDate = null;
  if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
  const item = await prisma.jobOpening.update({ where: { id }, data: updates });
  await logAudit("job.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteJob(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.jobOpening.delete({ where: { id } });
  await logAudit("job.delete", req.user?.id ?? null, { id });
  res.json({ success: true });
}

export async function listApplications(req: Request, res: Response) {
  const { id } = req.params;
  const items = await prisma.jobApplication.findMany({ where: { jobId: id }, orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: items });
}

export async function updateApplication(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as any;
  const item = await prisma.jobApplication.update({ where: { id }, data: { status } });
  await logAudit("job.application.update", req.user?.id ?? null, { id: item.id, status });
  res.json({ success: true, data: item });
}

export async function applyToJob(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, phone, coverLetter, linkedinUrl, portfolioUrl } = req.body as any;

  const job = await prisma.jobOpening.findUnique({ where: { id } });
  if (!job || job.status !== "OPEN") throw new NotFoundError("Job not found");
  if (job.dueDate && new Date() > job.dueDate) throw new ValidationError("Applications are closed");

  const resumeFile = (req.files as any)?.resume?.[0];
  if (!resumeFile) throw new NotFoundError("Resume file is required");
  const supportFile = (req.files as any)?.supporting?.[0];

  const resume = await saveCloudFile(resumeFile, "wfw/applications");
  const supporting = supportFile ? await saveCloudFile(supportFile, "wfw/applications") : null;

  const application = await prisma.jobApplication.create({
    data: {
      jobId: id,
      name,
      email,
      phone: phone || null,
      coverLetter: coverLetter || null,
      linkedinUrl: linkedinUrl || null,
      portfolioUrl: portfolioUrl || null,
      resumeUrl: resume.url,
      resumeName: resumeFile.originalname || null,
      resumeType: resumeFile.mimetype || null,
      supportingUrl: supporting?.url || null,
      supportingName: supportFile?.originalname || null,
      supportingType: supportFile?.mimetype || null,
    },
  });

  res.status(201).json({ success: true, data: application });
}

export async function listGeneralApplications(_req: Request, res: Response) {
  const items = await prisma.generalApplication.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: items });
}

export async function updateGeneralApplication(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as any;
  const item = await prisma.generalApplication.update({ where: { id }, data: { status } });
  await logAudit("job.general.update", req.user?.id ?? null, { id: item.id, status });
  res.json({ success: true, data: item });
}

export async function applyGeneral(req: Request, res: Response) {
  const { name, email, phone, coverLetter, linkedinUrl, portfolioUrl } = req.body as any;

  const resumeFile = (req.files as any)?.resume?.[0];
  const supportFile = (req.files as any)?.supporting?.[0];

  const resume = resumeFile ? await saveCloudFile(resumeFile, "wfw/applications") : null;
  const supporting = supportFile ? await saveCloudFile(supportFile, "wfw/applications") : null;

  const application = await prisma.generalApplication.create({
    data: {
      name,
      email,
      phone: phone || null,
      coverLetter: coverLetter || null,
      linkedinUrl: linkedinUrl || null,
      portfolioUrl: portfolioUrl || null,
      resumeUrl: resume?.url || null,
      resumeName: resumeFile?.originalname || null,
      resumeType: resumeFile?.mimetype || null,
      supportingUrl: supporting?.url || null,
      supportingName: supportFile?.originalname || null,
      supportingType: supportFile?.mimetype || null,
    },
  });

  res.status(201).json({ success: true, data: application });
}

export async function publicJobs(req: Request, res: Response) {
  const { page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);
  const now = new Date();
  const [items, total] = await Promise.all([
    prisma.jobOpening.findMany({
      where: { status: "OPEN", OR: [{ dueDate: null }, { dueDate: { gte: now } }] },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobOpening.count({ where: { status: "OPEN", OR: [{ dueDate: null }, { dueDate: { gte: now } }] } }),
  ]);
  res.json({ success: true, data: items, total });
}

export async function publicJob(req: Request, res: Response) {
  const { slug } = req.params;
  const now = new Date();
  const item = await prisma.jobOpening.findUnique({ where: { slug } });
  if (!item || item.status !== "OPEN") return res.status(404).json({ success: false });
  if (item.dueDate && item.dueDate < now) return res.status(404).json({ success: false });
  res.json({ success: true, data: item });
}

async function streamDownload(res: Response, url: string, filename?: string | null, contentType?: string | null) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new NotFoundError("File not found");
  }
  const resolvedType = contentType || response.headers.get("content-type") || "application/octet-stream";
  let name = filename || "";
  if (!name) {
    if (resolvedType.includes("pdf")) name = "document.pdf";
    else if (resolvedType.includes("officedocument")) name = "document.docx";
    else if (resolvedType.includes("word")) name = "document.doc";
    else name = "download";
  }
  if (!name.includes(".") && resolvedType.includes("pdf")) name += ".pdf";
  res.setHeader("Content-Type", resolvedType);
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  const nodeStream = Readable.fromWeb(response.body as any);
  nodeStream.pipe(res);
}

export async function downloadJobFile(req: Request, res: Response) {
  const { id, type } = req.params as { id: string; type: "resume" | "supporting" };
  const item = await prisma.jobApplication.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Application not found");
  if (type === "resume") {
    if (!item.resumeUrl) throw new NotFoundError("Resume not found");
    return streamDownload(res, item.resumeUrl, item.resumeName, item.resumeType);
  }
  if (!item.supportingUrl) throw new NotFoundError("Supporting file not found");
  return streamDownload(res, item.supportingUrl, item.supportingName, item.supportingType);
}

export async function downloadGeneralFile(req: Request, res: Response) {
  const { id, type } = req.params as { id: string; type: "resume" | "supporting" };
  const item = await prisma.generalApplication.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Application not found");
  if (type === "resume") {
    if (!item.resumeUrl) throw new NotFoundError("Resume not found");
    return streamDownload(res, item.resumeUrl, item.resumeName, item.resumeType);
  }
  if (!item.supportingUrl) throw new NotFoundError("Supporting file not found");
  return streamDownload(res, item.supportingUrl, item.supportingName, item.supportingType);
}

