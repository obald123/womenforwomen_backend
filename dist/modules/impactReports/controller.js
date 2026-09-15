"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImpactReport = createImpactReport;
exports.listImpactReports = listImpactReports;
exports.downloadImpactReport = downloadImpactReport;
exports.getImpactReport = getImpactReport;
exports.updateImpactReport = updateImpactReport;
exports.deleteImpactReport = deleteImpactReport;
exports.publicImpactReports = publicImpactReports;
const stream_1 = require("stream");
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const imageService_1 = require("../../services/imageService");
const auditService_1 = require("../../services/auditService");
const subscriberNotifyService_1 = require("../../services/subscriberNotifyService");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
function notifyReportPublished(report) {
    (0, subscriberNotifyService_1.notifySubscribersOfNewContent)({
        kicker: "New Impact Report",
        title: report.title,
        excerpt: report.description,
        url: `${env_1.env.BASE_URL}/impact#impact-reports`,
    }).catch((err) => logger_1.logger.error("Failed to notify subscribers of new report", { error: err.message }));
}
const EXT_CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
// Report files are uploaded to Cloudinary as resource_type "raw" with no extension in
// the URL, so a direct link leaves the browser without a filename or content type to
// go on. Proxy the download so we can hand back both explicitly.
async function streamReportFile(res, report) {
    const response = await fetch(report.fileUrl);
    if (!response.ok || !response.body) {
        throw new errors_1.NotFoundError("File not found");
    }
    const rawName = report.fileName || "report.pdf";
    const ext = rawName.includes(".") ? rawName.slice(rawName.lastIndexOf(".")).toLowerCase() : "";
    const contentType = EXT_CONTENT_TYPES[ext] || response.headers.get("content-type") || "application/octet-stream";
    const filename = ext ? rawName : `${rawName}.pdf`;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const nodeStream = stream_1.Readable.fromWeb(response.body);
    nodeStream.pipe(res);
}
async function createImpactReport(req, res) {
    const { title, year, description, status } = req.body;
    const files = req.files;
    const reportFile = files?.file?.[0];
    if (!reportFile)
        throw new errors_1.ValidationError("A report file is required");
    const uploadedFile = await (0, imageService_1.saveCloudFile)(reportFile, "wfw/impact-reports");
    const coverFile = files?.coverImage?.[0];
    const coverImage = coverFile ? (await (0, imageService_1.saveCloudImage)(coverFile, "wfw/impact-reports")).url : null;
    const resolvedStatus = status || "PUBLISHED";
    const report = await prisma_1.prisma.impactReport.create({
        data: {
            title,
            year: year ? Number(year) : null,
            description: description || null,
            coverImage,
            fileUrl: uploadedFile.url,
            fileName: reportFile.originalname || null,
            status: resolvedStatus,
            publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
        },
    });
    await (0, auditService_1.logAudit)("impactReport.create", req.user?.id ?? null, { id: report.id });
    if (report.status === "PUBLISHED")
        notifyReportPublished(report);
    res.status(201).json({ success: true, data: report });
}
async function listImpactReports(req, res) {
    const { status, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (status)
        where.status = status;
    const [items, total] = await Promise.all([
        prisma_1.prisma.impactReport.findMany({
            where,
            skip,
            take,
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        }),
        prisma_1.prisma.impactReport.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
// Mounted on the public router, so only published reports are downloadable this way.
async function downloadImpactReport(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.impactReport.findUnique({ where: { id } });
    if (!item || item.status !== "PUBLISHED")
        throw new errors_1.NotFoundError("Impact report not found");
    await streamReportFile(res, item);
}
async function getImpactReport(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.impactReport.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Impact report not found");
    res.json({ success: true, data: item });
}
async function updateImpactReport(req, res) {
    const { id } = req.params;
    const existing = await prisma_1.prisma.impactReport.findUnique({ where: { id } });
    if (!existing)
        throw new errors_1.NotFoundError("Impact report not found");
    const updates = req.body;
    if (updates.year !== undefined)
        updates.year = updates.year ? Number(updates.year) : null;
    if (updates.status === "PUBLISHED" && !existing.publishedAt) {
        updates.publishedAt = new Date();
    }
    const files = req.files;
    const reportFile = files?.file?.[0];
    if (reportFile) {
        const uploaded = await (0, imageService_1.saveCloudFile)(reportFile, "wfw/impact-reports");
        updates.fileUrl = uploaded.url;
        updates.fileName = reportFile.originalname || null;
    }
    const coverFile = files?.coverImage?.[0];
    if (coverFile) {
        const uploaded = await (0, imageService_1.saveCloudImage)(coverFile, "wfw/impact-reports");
        updates.coverImage = uploaded.url;
    }
    const item = await prisma_1.prisma.impactReport.update({ where: { id }, data: updates });
    await (0, auditService_1.logAudit)("impactReport.update", req.user?.id ?? null, { id: item.id });
    if (existing.status !== "PUBLISHED" && item.status === "PUBLISHED")
        notifyReportPublished(item);
    res.json({ success: true, data: item });
}
async function deleteImpactReport(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.impactReport.delete({ where: { id } });
    await (0, auditService_1.logAudit)("impactReport.delete", req.user?.id ?? null, { id });
    res.json({ success: true });
}
async function publicImpactReports(req, res) {
    const { page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = { status: "PUBLISHED" };
    const [items, total] = await Promise.all([
        prisma_1.prisma.impactReport.findMany({
            where,
            skip,
            take,
            orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
        }),
        prisma_1.prisma.impactReport.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
//# sourceMappingURL=controller.js.map