"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGallery = createGallery;
exports.listGalleries = listGalleries;
exports.getGallery = getGallery;
exports.updateGallery = updateGallery;
exports.deleteGallery = deleteGallery;
exports.publishGallery = publishGallery;
exports.addGalleryImages = addGalleryImages;
exports.deleteGalleryImage = deleteGalleryImage;
exports.updateGalleryImageCaption = updateGalleryImageCaption;
exports.addGalleryVideos = addGalleryVideos;
exports.deleteGalleryVideo = deleteGalleryVideo;
exports.updateGalleryVideoCaption = updateGalleryVideoCaption;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const imageService_1 = require("../../services/imageService");
const auditService_1 = require("../../services/auditService");
const errors_2 = require("../../utils/errors");
function parseCaptions(raw) {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            throw new Error("not an array");
        return parsed;
    }
    catch {
        throw new errors_2.ValidationError("Invalid captions JSON");
    }
}
async function createGallery(req, res) {
    const { title, layout, status } = req.body;
    const publishedAtRaw = req.body.publishedAt;
    const files = req.files;
    const captions = parseCaptions(req.body.captions);
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
            images: [],
            videos: [],
            layout: layout || "GRID",
            status: status || "DRAFT",
            publishedAt: status === "PUBLISHED" ? publishedAt ?? new Date() : publishedAt,
        },
    });
    try {
        const folder = `wfw/galleries/${gallery.id}`;
        const images = [];
        const imageFiles = files?.images ?? [];
        for (let i = 0; i < imageFiles.length; i += 1) {
            const saved = await (0, imageService_1.saveCloudImage)(imageFiles[i], folder);
            images.push({ id: crypto_1.default.randomUUID(), url: saved.url, publicId: saved.publicId, caption: captions[i] });
        }
        const videos = [];
        const videoFiles = files?.videos ?? [];
        for (let i = 0; i < videoFiles.length; i += 1) {
            const saved = await (0, imageService_1.saveCloudVideo)(videoFiles[i], folder);
            videos.push({ id: crypto_1.default.randomUUID(), url: saved.url, publicId: saved.publicId });
        }
        const updated = await prisma_1.prisma.gallery.update({
            where: { id: gallery.id },
            data: { images, videos },
        });
        await (0, auditService_1.logAudit)("gallery.create", req.user?.id ?? null, { id: updated.id });
        res.status(201).json({ success: true, data: updated });
    }
    catch (err) {
        await prisma_1.prisma.gallery.delete({ where: { id: gallery.id } }).catch(() => { });
        throw err;
    }
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
async function loadGalleryOrThrow(id) {
    const gallery = await prisma_1.prisma.gallery.findUnique({ where: { id } });
    if (!gallery)
        throw new errors_1.NotFoundError("Gallery not found");
    return gallery;
}
async function addGalleryImages(req, res) {
    const { id } = req.params;
    const gallery = await loadGalleryOrThrow(id);
    const files = req.files ?? [];
    if (!files.length)
        throw new errors_2.ValidationError("No images provided");
    const captions = parseCaptions(req.body.captions);
    const folder = `wfw/galleries/${gallery.id}`;
    const existing = gallery.images ?? [];
    const added = [];
    for (let i = 0; i < files.length; i += 1) {
        const saved = await (0, imageService_1.saveCloudImage)(files[i], folder);
        added.push({ id: crypto_1.default.randomUUID(), url: saved.url, publicId: saved.publicId, caption: captions[i] });
    }
    const updated = await prisma_1.prisma.gallery.update({
        where: { id },
        data: { images: [...existing, ...added] },
    });
    await (0, auditService_1.logAudit)("gallery.images.add", req.user?.id ?? null, { id, count: added.length });
    res.status(201).json({ success: true, data: updated });
}
async function deleteGalleryImage(req, res) {
    const { id, imageId } = req.params;
    const gallery = await loadGalleryOrThrow(id);
    const existing = gallery.images ?? [];
    const target = existing.find((img) => img.id === imageId);
    if (!target)
        throw new errors_1.NotFoundError("Image not found");
    if (target.publicId) {
        await (0, imageService_1.deleteCloudAsset)(target.publicId, "image");
    }
    const updated = await prisma_1.prisma.gallery.update({
        where: { id },
        data: { images: existing.filter((img) => img.id !== imageId) },
    });
    await (0, auditService_1.logAudit)("gallery.images.remove", req.user?.id ?? null, { id, imageId });
    res.json({ success: true, data: updated });
}
async function updateGalleryImageCaption(req, res) {
    const { id, imageId } = req.params;
    const { caption } = req.body;
    const gallery = await loadGalleryOrThrow(id);
    const existing = gallery.images ?? [];
    if (!existing.some((img) => img.id === imageId))
        throw new errors_1.NotFoundError("Image not found");
    const images = existing.map((img) => (img.id === imageId ? { ...img, caption } : img));
    const updated = await prisma_1.prisma.gallery.update({ where: { id }, data: { images } });
    res.json({ success: true, data: updated });
}
async function addGalleryVideos(req, res) {
    const { id } = req.params;
    const gallery = await loadGalleryOrThrow(id);
    const files = req.files ?? [];
    if (!files.length)
        throw new errors_2.ValidationError("No videos provided");
    const folder = `wfw/galleries/${gallery.id}`;
    const existing = gallery.videos ?? [];
    const added = [];
    for (let i = 0; i < files.length; i += 1) {
        const saved = await (0, imageService_1.saveCloudVideo)(files[i], folder);
        added.push({ id: crypto_1.default.randomUUID(), url: saved.url, publicId: saved.publicId });
    }
    const updated = await prisma_1.prisma.gallery.update({
        where: { id },
        data: { videos: [...existing, ...added] },
    });
    await (0, auditService_1.logAudit)("gallery.videos.add", req.user?.id ?? null, { id, count: added.length });
    res.status(201).json({ success: true, data: updated });
}
async function deleteGalleryVideo(req, res) {
    const { id, videoId } = req.params;
    const gallery = await loadGalleryOrThrow(id);
    const existing = gallery.videos ?? [];
    const target = existing.find((vid) => vid.id === videoId);
    if (!target)
        throw new errors_1.NotFoundError("Video not found");
    if (target.publicId) {
        await (0, imageService_1.deleteCloudAsset)(target.publicId, "video");
    }
    const updated = await prisma_1.prisma.gallery.update({
        where: { id },
        data: { videos: existing.filter((vid) => vid.id !== videoId) },
    });
    await (0, auditService_1.logAudit)("gallery.videos.remove", req.user?.id ?? null, { id, videoId });
    res.json({ success: true, data: updated });
}
async function updateGalleryVideoCaption(req, res) {
    const { id, videoId } = req.params;
    const { caption } = req.body;
    const gallery = await loadGalleryOrThrow(id);
    const existing = gallery.videos ?? [];
    if (!existing.some((vid) => vid.id === videoId))
        throw new errors_1.NotFoundError("Video not found");
    const videos = existing.map((vid) => (vid.id === videoId ? { ...vid, caption } : vid));
    const updated = await prisma_1.prisma.gallery.update({ where: { id }, data: { videos } });
    res.json({ success: true, data: updated });
}
//# sourceMappingURL=controller.js.map