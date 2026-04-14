"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamMember = createTeamMember;
exports.listTeam = listTeam;
exports.getTeamMember = getTeamMember;
exports.updateTeamMember = updateTeamMember;
exports.deleteTeamMember = deleteTeamMember;
exports.publishTeamMember = publishTeamMember;
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const imageService_1 = require("../../services/imageService");
const auditService_1 = require("../../services/auditService");
async function createTeamMember(req, res) {
    const { name, role, bio, category, displayOrder, linkedin, twitter, status } = req.body;
    let photo;
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/team");
        photo = saved.url;
    }
    const member = await prisma_1.prisma.teamMember.create({
        data: {
            name,
            role,
            bio,
            category: category,
            displayOrder: displayOrder ? Number(displayOrder) : 0,
            linkedin: linkedin || null,
            twitter: twitter || null,
            status: status || "DRAFT",
            publishedAt: status === "PUBLISHED" ? new Date() : null,
            photo,
        },
    });
    await (0, auditService_1.logAudit)("team.create", req.user?.id ?? null, { id: member.id });
    res.status(201).json({ success: true, data: member });
}
async function listTeam(req, res) {
    const { status, category, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    const [items, total] = await Promise.all([
        prisma_1.prisma.teamMember.findMany({
            where,
            skip,
            take,
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        }),
        prisma_1.prisma.teamMember.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
async function getTeamMember(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.teamMember.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Team member not found");
    res.json({ success: true, data: item });
}
async function updateTeamMember(req, res) {
    const { id } = req.params;
    const existing = await prisma_1.prisma.teamMember.findUnique({ where: { id } });
    if (!existing)
        throw new errors_1.NotFoundError("Team member not found");
    const updates = req.body;
    if (req.file) {
        const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/team");
        updates.photo = saved.url;
    }
    if (updates.displayOrder)
        updates.displayOrder = Number(updates.displayOrder);
    if (updates.status === "PUBLISHED" && !existing.publishedAt) {
        updates.publishedAt = new Date().toISOString();
    }
    const item = await prisma_1.prisma.teamMember.update({ where: { id }, data: updates });
    await (0, auditService_1.logAudit)("team.update", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
async function deleteTeamMember(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.teamMember.update({ where: { id }, data: { status: "ARCHIVED" } });
    await (0, auditService_1.logAudit)("team.archive", req.user?.id ?? null, { id });
    res.json({ success: true });
}
async function publishTeamMember(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.teamMember.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await (0, auditService_1.logAudit)("team.publish", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
//# sourceMappingURL=controller.js.map