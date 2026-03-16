"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = createEvent;
exports.listEvents = listEvents;
exports.getEvent = getEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
exports.publishEvent = publishEvent;
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const sanitize_1 = require("../../utils/sanitize");
const slug_1 = require("../../utils/slug");
const imageService_1 = require("../../services/imageService");
const auditService_1 = require("../../services/auditService");
async function uniqueSlug(base) {
    let slug = (0, slug_1.toSlug)(base);
    let exists = await prisma_1.prisma.event.findUnique({ where: { slug } });
    let i = 1;
    while (exists) {
        slug = `${(0, slug_1.toSlug)(base)}-${i}`;
        exists = await prisma_1.prisma.event.findUnique({ where: { slug } });
        i += 1;
    }
    return slug;
}
async function createEvent(req, res) {
    const { title, excerpt, content, eventDate, endDate, location, isOnline, meetingLink, status, badgeLabel, isFeatured } = req.body;
    const slug = await uniqueSlug(title);
    let coverImage;
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/events");
        coverImage = saved.url;
    }
    const featureFlag = isFeatured === "true" || isFeatured === true;
    const event = await prisma_1.prisma.$transaction(async (tx) => {
        if (featureFlag) {
            await tx.event.updateMany({ data: { isFeatured: false } });
        }
        return tx.event.create({
            data: {
                title,
                slug,
                excerpt,
                content: (0, sanitize_1.sanitizeContent)(content),
                coverImage,
                badgeLabel: badgeLabel || null,
                isFeatured: featureFlag,
                eventDate: new Date(eventDate),
                endDate: endDate ? new Date(endDate) : null,
                location,
                isOnline: isOnline === "true" || isOnline === true,
                meetingLink: meetingLink || null,
                status: status || "DRAFT",
                publishedAt: status === "PUBLISHED" ? new Date() : null,
            },
        });
    });
    await (0, auditService_1.logAudit)("event.create", req.user?.id ?? null, { id: event.id });
    res.status(201).json({ success: true, data: event });
}
async function listEvents(req, res) {
    const { status, upcoming, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (status)
        where.status = status;
    if (upcoming === "true")
        where.eventDate = { gte: new Date() };
    const [items, total] = await Promise.all([
        prisma_1.prisma.event.findMany({ where, skip, take, orderBy: { eventDate: "asc" } }),
        prisma_1.prisma.event.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
async function getEvent(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.event.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Event not found");
    res.json({ success: true, data: item });
}
async function updateEvent(req, res) {
    const { id } = req.params;
    const existing = await prisma_1.prisma.event.findUnique({ where: { id } });
    if (!existing)
        throw new errors_1.NotFoundError("Event not found");
    const updates = req.body;
    if (updates.title)
        updates.slug = await uniqueSlug(updates.title);
    if (updates.content)
        updates.content = (0, sanitize_1.sanitizeContent)(updates.content);
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/events");
        updates.coverImage = saved.url;
    }
    if (updates.eventDate)
        updates.eventDate = new Date(updates.eventDate).toISOString();
    if (updates.endDate)
        updates.endDate = new Date(updates.endDate).toISOString();
    if (typeof updates.isOnline !== "undefined") {
        updates.isOnline =
            updates.isOnline === "true" || updates.isOnline === true;
    }
    if (typeof updates.isFeatured !== "undefined") {
        updates.isFeatured =
            updates.isFeatured === "true" || updates.isFeatured === true;
    }
    if (updates.status === "PUBLISHED" && !existing.publishedAt) {
        updates.publishedAt = new Date().toISOString();
    }
    const item = await prisma_1.prisma.$transaction(async (tx) => {
        if (updates.isFeatured === true) {
            await tx.event.updateMany({ data: { isFeatured: false } });
        }
        return tx.event.update({ where: { id }, data: updates });
    });
    await (0, auditService_1.logAudit)("event.update", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
async function deleteEvent(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.event.update({ where: { id }, data: { status: "ARCHIVED" } });
    await (0, auditService_1.logAudit)("event.archive", req.user?.id ?? null, { id });
    res.json({ success: true });
}
async function publishEvent(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.event.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await (0, auditService_1.logAudit)("event.publish", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
//# sourceMappingURL=controller.js.map