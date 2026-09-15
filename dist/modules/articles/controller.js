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
const subscriberNotifyService_1 = require("../../services/subscriberNotifyService");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const errors_2 = require("../../utils/errors");
const cache_1 = require("../../utils/cache");
const CATEGORY_KICKER = {
    NEWS: "News Update",
    STORY: "New Story",
    PRESS: "Press Release",
    BLOG: "New Post",
};
function notifyArticlePublished(article) {
    (0, subscriberNotifyService_1.notifySubscribersOfNewContent)({
        kicker: CATEGORY_KICKER[article.category] || "New Story",
        title: article.title,
        excerpt: article.excerpt,
        url: `${env_1.env.BASE_URL}/news/${article.slug}`,
    }).catch((err) => logger_1.logger.error("Failed to notify subscribers of new article", { error: err.message }));
}
function invalidatePublicArticleCache(slug) {
    cache_1.cache.clear();
}
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
    const { title, excerpt, content, category, status, coverImageCaption, imagesMetadata } = req.body;
    const publishedAtRaw = req.body.publishedAt;
    let slug = await uniqueSlug(title);
    const safeContent = (0, sanitize_1.sanitizeContent)(content);
    let publishedAt = null;
    if (publishedAtRaw) {
        const parsed = new Date(publishedAtRaw);
        if (Number.isNaN(parsed.getTime())) {
            throw new errors_2.ValidationError("Invalid publishedAt date");
        }
        publishedAt = parsed;
    }
    let coverImage;
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/articles");
        coverImage = saved.url;
    }
    let parsedImagesMetadata = [];
    if (imagesMetadata) {
        try {
            parsedImagesMetadata = typeof imagesMetadata === "string" ? JSON.parse(imagesMetadata) : imagesMetadata;
        }
        catch {
            parsedImagesMetadata = [];
        }
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
                    coverImageCaption: coverImageCaption || null,
                    imagesMetadata: parsedImagesMetadata,
                    publishedAt: status === "PUBLISHED" ? publishedAt ?? new Date() : publishedAt,
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
    invalidatePublicArticleCache(article.slug);
    if (article.status === "PUBLISHED")
        notifyArticlePublished(article);
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
    if (updates.publishedAt) {
        const parsed = new Date(updates.publishedAt);
        if (Number.isNaN(parsed.getTime())) {
            throw new errors_2.ValidationError("Invalid publishedAt date");
        }
        updates.publishedAt = parsed;
    }
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/articles");
        updates.coverImage = saved.url;
    }
    if (updates.imagesMetadata) {
        try {
            const parsed = typeof updates.imagesMetadata === "string" ? JSON.parse(updates.imagesMetadata) : updates.imagesMetadata;
            updates.imagesMetadata = parsed;
        }
        catch {
            updates.imagesMetadata = [];
        }
    }
    if (updates.status === "PUBLISHED" && !existing.publishedAt && !updates.publishedAt) {
        updates.publishedAt = new Date().toISOString();
    }
    const item = await prisma_1.prisma.article.update({
        where: { id },
        data: updates,
    });
    await (0, auditService_1.logAudit)("article.update", req.user?.id ?? null, { id: item.id });
    invalidatePublicArticleCache(item.slug);
    if (existing.status !== "PUBLISHED" && item.status === "PUBLISHED")
        notifyArticlePublished(item);
    res.json({ success: true, data: item });
}
async function deleteArticle(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.article.update({
        where: { id },
        data: { status: "ARCHIVED" },
    });
    await (0, auditService_1.logAudit)("article.archive", req.user?.id ?? null, { id });
    invalidatePublicArticleCache();
    res.json({ success: true });
}
async function publishArticle(req, res) {
    const { id } = req.params;
    const existing = await prisma_1.prisma.article.findUnique({ where: { id } });
    const item = await prisma_1.prisma.article.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await (0, auditService_1.logAudit)("article.publish", req.user?.id ?? null, { id: item.id });
    invalidatePublicArticleCache(item.slug);
    if (existing && existing.status !== "PUBLISHED")
        notifyArticlePublished(item);
    res.json({ success: true, data: item });
}
//# sourceMappingURL=controller.js.map