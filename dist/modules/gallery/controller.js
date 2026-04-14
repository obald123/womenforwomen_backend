"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGallery = createGallery;
exports.listGalleries = listGalleries;
exports.getGallery = getGallery;
exports.updateGallery = updateGallery;
exports.deleteGallery = deleteGallery;
exports.publishGallery = publishGallery;
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const imageService_1 = require("../../services/imageService");
const auditService_1 = require("../../services/auditService");
const errors_2 = require("../../utils/errors");
async function createGallery(req, res) {
    const { title, layout, status } = req.body;
    const publishedAtRaw = req.body.publishedAt;
    const files = req.files;
    let captions = [];
    if (req.body.captions) {
        try {
            captions = JSON.parse(req.body.captions);
        }
        catch {
            throw new errors_2.ValidationError("Invalid captions JSON");
        }
    }
    const images = [];
    const imageFiles = files?.images ?? [];
    if (imageFiles.length) {
        for (let i = 0; i < imageFiles.length; i += 1) {
            const saved = await (0, imageService_1.saveCloudImage)(imageFiles[i], "wfw/galleries");
            images.push({ url: saved.url, caption: captions[i] });
        }
    }
    const videos = [];
    const videoFiles = files?.videos ?? [];
    if (videoFiles.length) {
        for (let i = 0; i < videoFiles.length; i += 1) {
            const saved = await (0, imageService_1.saveCloudVideo)(videoFiles[i], "wfw/galleries");
            videos.push({ url: saved.url });
        }
    }
    let publishedAt = null;
    if (publishedAtRaw) {
        const parsed = new Date(publishedAtRaw);
        if (Number.isNaN(parsed.getTime())) {
            throw new errors_2.ValidationError("Invalid publishedAt date");
        }
        publishedAt = parsed;
    }
    const gallery = await prisma_1.prisma.gallery.create({
        data: {
            title,
            images,
            videos,
            layout: layout || "GRID",
            status: status || "DRAFT",
            publishedAt: status === "PUBLISHED" ? publishedAt ?? new Date() : publishedAt,
        },
    });
    await (0, auditService_1.logAudit)("gallery.create", req.user?.id ?? null, { id: gallery.id });
    res.status(201).json({ success: true, data: gallery });
}
async function listGalleries(req, res) {
    const { status, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (status) {
        where.status = status;
    }
    else {
        where.status = { not: "ARCHIVED" };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.gallery.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma_1.prisma.gallery.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
async function getGallery(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.gallery.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Gallery not found");
    res.json({ success: true, data: item });
}
async function updateGallery(req, res) {
    const { id } = req.params;
    const existing = await prisma_1.prisma.gallery.findUnique({ where: { id } });
    if (!existing)
        throw new errors_1.NotFoundError("Gallery not found");
    const updates = req.body;
    if (updates.publishedAt) {
        const parsed = new Date(updates.publishedAt);
        if (Number.isNaN(parsed.getTime())) {
            throw new errors_2.ValidationError("Invalid publishedAt date");
        }
        updates.publishedAt = parsed;
    }
    if (updates.status === "PUBLISHED" && !existing.publishedAt && !updates.publishedAt) {
        updates.publishedAt = new Date().toISOString();
    }
    const item = await prisma_1.prisma.gallery.update({ where: { id }, data: updates });
    await (0, auditService_1.logAudit)("gallery.update", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
async function deleteGallery(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.gallery.update({ where: { id }, data: { status: "ARCHIVED" } });
    await (0, auditService_1.logAudit)("gallery.archive", req.user?.id ?? null, { id });
    res.json({ success: true });
}
async function publishGallery(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.gallery.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await (0, auditService_1.logAudit)("gallery.publish", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
//# sourceMappingURL=controller.js.map