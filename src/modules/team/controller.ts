import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { saveCloudImage } from "../../services/imageService";
import { logAudit } from "../../services/auditService";

export async function createTeamMember(req: Request, res: Response) {
  const { name, role, bio, category, displayOrder, linkedin, twitter, status } =
    req.body as Record<string, string>;

  let photo: string | undefined;
  if (req.file) {
    const saved = await saveCloudImage(req.file, "wfw/team");
    photo = saved.url;
  }

  const member = await prisma.teamMember.create({
    data: {
      name,
      role,
      bio,
      category: category as any,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      linkedin: linkedin || null,
      twitter: twitter || null,
      status: (status as any) || "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      photo,
    },
  });

  await logAudit("team.create", req.user?.id ?? null, { id: member.id });
  res.status(201).json({ success: true, data: member });
}

export async function listTeam(req: Request, res: Response) {
  const { status, category, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.teamMember.findMany({ where, skip, take, orderBy: { displayOrder: "asc" } }),
    prisma.teamMember.count({ where }),
  ]);

  res.json({ success: true, data: items, total });
}

export async function getTeamMember(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.teamMember.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Team member not found");
  res.json({ success: true, data: item });
}

export async function updateTeamMember(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Team member not found");

  const updates = req.body as Record<string, string>;
  if (req.file) {
    const saved = await saveCloudImage(req.file, "wfw/team");
    updates.photo = saved.url;
  }
  if (updates.displayOrder) updates.displayOrder = Number(updates.displayOrder) as any;
  if (updates.status === "PUBLISHED" && !existing.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }

  const item = await prisma.teamMember.update({ where: { id }, data: updates as any });
  await logAudit("team.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteTeamMember(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.teamMember.update({ where: { id }, data: { status: "ARCHIVED" } });
  await logAudit("team.archive", req.user?.id ?? null, { id });
  res.json({ success: true });
}

export async function publishTeamMember(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.teamMember.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await logAudit("team.publish", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}
