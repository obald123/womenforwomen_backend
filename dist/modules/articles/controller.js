"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArticle = createArticle;
exports.listArticles = listArticles;
exports.getArticle = getArticle;
exports.updateArticle = updateArticle;
exports.deleteArticle = deleteArticle;
exports.publishArticle = publishArticle;
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const sanitize_1 = require("../../utils/sanitize");
const slug_1 = require("../../utils/slug");
const imageService_1 = require("../../services/imageService");
const auditService_1 = require("../../services/auditService");
async function uniqueSlug(base) {
    let slug = (0, slug_1.toSlug)(base);
    let exists = await prisma_1.prisma.article.findUnique({ where: { slug } });
    let i = 1;
    while (exists) {
        slug = `${(0, slug_1.toSlug)(base)}-${i}`;
        exists = await prisma_1.prisma.article.findUnique({ where: { slug } });
        i += 1;
    }
    return slug;
}
async function createArticle(req, res) {
    const { title, excerpt, content, category, status } = req.body;
    let slug = await uniqueSlug(title);
    const safeContent = (0, sanitize_1.sanitizeContent)(content);
    let coverImage;
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/articles");
        coverImage = saved.url;
    }
    let article;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            article = await prisma_1.prisma.article.create({
                data: {
                    title,
                    slug,
                    excerpt,
                    content: safeContent,
                    category: category,
                    status: status || "DRAFT",
                    coverImage,
                    publishedAt: status === "PUBLISHED" ? new Date() : null,
                },
            });
            break;
        }
        catch (err) {
            if (err?.code === "P2002" && err?.meta?.target?.includes("slug")) {
                slug = await uniqueSlug(title);
                continue;
            }
            throw err;
        }
    }
    if (!article)
        throw new Error("Failed to create article");
    await (0, auditService_1.logAudit)("article.create", req.user?.id ?? null, { id: article.id });
    res.status(201).json({ success: true, data: article });
}
async function listArticles(req, res) {
    const { status, category, search, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (status) {
        where.status = status;
    }
    else {
        where.status = { not: "ARCHIVED" };
    }
    if (category)
        where.category = category;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
        ];
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.article.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma_1.prisma.article.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
async function getArticle(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.article.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Article not found");
    res.json({ success: true, data: item });
}
async function updateArticle(req, res) {
    const { id } = req.params;
    const existing = await prisma_1.prisma.article.findUnique({ where: { id } });
    if (!existing)
        throw new errors_1.NotFoundError("Article not found");
    const updates = req.body;
    if (updates.title) {
        updates.slug = await uniqueSlug(updates.title);
    }
    if (updates.content) {
        updates.content = (0, sanitize_1.sanitizeContent)(updates.content);
    }
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/articles");
        updates.coverImage = saved.url;
    }
    if (updates.status === "PUBLISHED" && !existing.publishedAt) {
        updates.publishedAt = new Date().toISOString();
    }
    const item = await prisma_1.prisma.article.update({
        where: { id },
        data: updates,
    });
    await (0, auditService_1.logAudit)("article.update", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
async function deleteArticle(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.article.update({
        where: { id },
        data: { status: "ARCHIVED" },
    });
    await (0, auditService_1.logAudit)("article.archive", req.user?.id ?? null, { id });
    res.json({ success: true });
}
async function publishArticle(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.article.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await (0, auditService_1.logAudit)("article.publish", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
//# sourceMappingURL=controller.js.map