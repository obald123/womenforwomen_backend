import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/pagination";
import { sanitizeContent } from "../../utils/sanitize";
import { toSlug } from "../../utils/slug";
import { saveCloudImage } from "../../services/imageService";
import { logAudit } from "../../services/auditService";
import { Request, Response } from "express";

async function uniqueSlug(base: string) {
  let slug = toSlug(base);
  let exists = await prisma.article.findUnique({ where: { slug } });
  let i = 1;
  while (exists) {
    slug = `${toSlug(base)}-${i}`;
    exists = await prisma.article.findUnique({ where: { slug } });
    i += 1;
  }
  return slug;
}

export async function createArticle(req: Request, res: Response) {
  const { title, excerpt, content, category, status } = req.body as Record<string, string>;
  let slug = await uniqueSlug(title);
  const safeContent = sanitizeContent(content);

  let coverImage: string | undefined;
  if (req.file) {
    const saved = await saveCloudImage(req.file, "wfw/articles");
    coverImage = saved.url;
  }

  let article;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      article = await prisma.article.create({
        data: {
          title,
          slug,
          excerpt,
          content: safeContent,
          category: category as any,
          status: (status as any) || "DRAFT",
          coverImage,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
      break;
    } catch (err: any) {
      if (err?.code === "P2002" && err?.meta?.target?.includes("slug")) {
        slug = await uniqueSlug(title);
        continue;
      }
      throw err;
    }
  }

  if (!article) throw new Error("Failed to create article");

  await logAudit("article.create", req.user?.id ?? null, { id: article.id });
  res.status(201).json({ success: true, data: article });
}

export async function listArticles(req: Request, res: Response) {
  const { status, category, search, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = {};
  if (status) {
    where.status = status;
  } else {
    where.status = { not: "ARCHIVED" };
  }
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.article.count({ where }),
  ]);

  res.json({ success: true, data: items, total });
}

export async function getArticle(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.article.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Article not found");
  res.json({ success: true, data: item });
}

export async function updateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Article not found");

  const updates = req.body as Record<string, string>;
  if (updates.title) {
    updates.slug = await uniqueSlug(updates.title);
  }
  if (updates.content) {
    updates.content = sanitizeContent(updates.content);
  }

  if (req.file) {
    const saved = await saveCloudImage(req.file, "wfw/articles");
    updates.coverImage = saved.url;
  }

  if (updates.status === "PUBLISHED" && !existing.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }

  const item = await prisma.article.update({
    where: { id },
    data: updates as any,
  });

  await logAudit("article.update", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.article.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  await logAudit("article.archive", req.user?.id ?? null, { id });
  res.json({ success: true });
}

export async function publishArticle(req: Request, res: Response) {
  const { id } = req.params;
  const item = await prisma.article.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await logAudit("article.publish", req.user?.id ?? null, { id: item.id });
  res.json({ success: true, data: item });
}
