"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.listJobs = listJobs;
exports.getJob = getJob;
exports.updateJob = updateJob;
exports.deleteJob = deleteJob;
exports.listApplications = listApplications;
exports.updateApplication = updateApplication;
exports.applyToJob = applyToJob;
exports.listGeneralApplications = listGeneralApplications;
exports.updateGeneralApplication = updateGeneralApplication;
exports.applyGeneral = applyGeneral;
exports.publicJobs = publicJobs;
exports.publicJob = publicJob;
exports.downloadJobFile = downloadJobFile;
exports.downloadGeneralFile = downloadGeneralFile;
const stream_1 = require("stream");
const prisma_1 = require("../../config/prisma");
const pagination_1 = require("../../utils/pagination");
const slug_1 = require("../../utils/slug");
const errors_1 = require("../../utils/errors");
const auditService_1 = require("../../services/auditService");
const imageService_1 = require("../../services/imageService");
async function uniqueSlug(base) {
    let slug = (0, slug_1.toSlug)(base);
    let exists = await prisma_1.prisma.jobOpening.findUnique({ where: { slug } });
    let i = 1;
    while (exists) {
        slug = `${(0, slug_1.toSlug)(base)}-${i}`;
        exists = await prisma_1.prisma.jobOpening.findUnique({ where: { slug } });
        i += 1;
    }
    return slug;
}
async function createJob(req, res) {
    const { title, department, location, employment, description, requirements, status, dueDate } = req.body;
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    const slug = await uniqueSlug(title);
    const job = await prisma_1.prisma.jobOpening.create({
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
    await (0, auditService_1.logAudit)("job.create", req.user?.id ?? null, { id: job.id });
    res.status(201).json({ success: true, data: job });
}
async function listJobs(req, res) {
    const { status, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (status)
        where.status = status;
    const [items, total] = await Promise.all([
        prisma_1.prisma.jobOpening.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma_1.prisma.jobOpening.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
async function getJob(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.jobOpening.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Job not found");
    res.json({ success: true, data: item });
}
async function updateJob(req, res) {
    const { id } = req.params;
    const updates = req.body;
    if (updates.title)
        updates.slug = await uniqueSlug(updates.title);
    if (updates.dueDate === "")
        updates.dueDate = null;
    if (updates.dueDate)
        updates.dueDate = new Date(updates.dueDate);
    const item = await prisma_1.prisma.jobOpening.update({ where: { id }, data: updates });
    await (0, auditService_1.logAudit)("job.update", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
async function deleteJob(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.jobOpening.delete({ where: { id } });
    await (0, auditService_1.logAudit)("job.delete", req.user?.id ?? null, { id });
    res.json({ success: true });
}
async function listApplications(req, res) {
    const { id } = req.params;
    const items = await prisma_1.prisma.jobApplication.findMany({ where: { jobId: id }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items });
}
async function updateApplication(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const item = await prisma_1.prisma.jobApplication.update({ where: { id }, data: { status } });
    await (0, auditService_1.logAudit)("job.application.update", req.user?.id ?? null, { id: item.id, status });
    res.json({ success: true, data: item });
}
async function applyToJob(req, res) {
    const { id } = req.params;
    const { name, email, phone, coverLetter, linkedinUrl, portfolioUrl } = req.body;
    const job = await prisma_1.prisma.jobOpening.findUnique({ where: { id } });
    if (!job || job.status !== "OPEN")
        throw new errors_1.NotFoundError("Job not found");
    if (job.dueDate && new Date() > job.dueDate)
        throw new errors_1.ValidationError("Applications are closed");
    const resumeFile = req.files?.resume?.[0];
    if (!resumeFile)
        throw new errors_1.NotFoundError("Resume file is required");
    const supportFile = req.files?.supporting?.[0];
    const resume = await (0, imageService_1.saveCloudFile)(resumeFile, "wfw/applications");
    const supporting = supportFile ? await (0, imageService_1.saveCloudFile)(supportFile, "wfw/applications") : null;
    const application = await prisma_1.prisma.jobApplication.create({
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
async function listGeneralApplications(_req, res) {
    const items = await prisma_1.prisma.generalApplication.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items });
}
async function updateGeneralApplication(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const item = await prisma_1.prisma.generalApplication.update({ where: { id }, data: { status } });
    await (0, auditService_1.logAudit)("job.general.update", req.user?.id ?? null, { id: item.id, status });
    res.json({ success: true, data: item });
}
async function applyGeneral(req, res) {
    const { name, email, phone, coverLetter, linkedinUrl, portfolioUrl } = req.body;
    const resumeFile = req.files?.resume?.[0];
    const supportFile = req.files?.supporting?.[0];
    const resume = resumeFile ? await (0, imageService_1.saveCloudFile)(resumeFile, "wfw/applications") : null;
    const supporting = supportFile ? await (0, imageService_1.saveCloudFile)(supportFile, "wfw/applications") : null;
    const application = await prisma_1.prisma.generalApplication.create({
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
async function publicJobs(req, res) {
    const { page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const now = new Date();
    const [items, total] = await Promise.all([
        prisma_1.prisma.jobOpening.findMany({
            where: { status: "OPEN", OR: [{ dueDate: null }, { dueDate: { gte: now } }] },
            skip,
            take,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.jobOpening.count({ where: { status: "OPEN", OR: [{ dueDate: null }, { dueDate: { gte: now } }] } }),
    ]);
    res.json({ success: true, data: items, total });
}
async function publicJob(req, res) {
    const { slug } = req.params;
    const now = new Date();
    const item = await prisma_1.prisma.jobOpening.findUnique({ where: { slug } });
    if (!item || item.status !== "OPEN")
        return res.status(404).json({ success: false });
    if (item.dueDate && item.dueDate < now)
        return res.status(404).json({ success: false });
    res.json({ success: true, data: item });
}
async function streamDownload(res, url, filename, contentType) {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new errors_1.NotFoundError("File not found");
    }
    const resolvedType = contentType || response.headers.get("content-type") || "application/octet-stream";
    let name = filename || "";
    if (!name) {
        if (resolvedType.includes("pdf"))
            name = "document.pdf";
        else if (resolvedType.includes("officedocument"))
            name = "document.docx";
        else if (resolvedType.includes("word"))
            name = "document.doc";
        else
            name = "download";
    }
    if (!name.includes(".") && resolvedType.includes("pdf"))
        name += ".pdf";
    res.setHeader("Content-Type", resolvedType);
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    const nodeStream = stream_1.Readable.fromWeb(response.body);
    nodeStream.pipe(res);
}
async function downloadJobFile(req, res) {
    const { id, type } = req.params;
    const item = await prisma_1.prisma.jobApplication.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Application not found");
    if (type === "resume") {
        if (!item.resumeUrl)
            throw new errors_1.NotFoundError("Resume not found");
        return streamDownload(res, item.resumeUrl, item.resumeName, item.resumeType);
    }
    if (!item.supportingUrl)
        throw new errors_1.NotFoundError("Supporting file not found");
    return streamDownload(res, item.supportingUrl, item.supportingName, item.supportingType);
}
async function downloadGeneralFile(req, res) {
    const { id, type } = req.params;
    const item = await prisma_1.prisma.generalApplication.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Application not found");
    if (type === "resume") {
        if (!item.resumeUrl)
            throw new errors_1.NotFoundError("Resume not found");
        return streamDownload(res, item.resumeUrl, item.resumeName, item.resumeType);
    }
    if (!item.supportingUrl)
        throw new errors_1.NotFoundError("Supporting file not found");
    return streamDownload(res, item.supportingUrl, item.supportingName, item.supportingType);
}
//# sourceMappingURL=controller.js.map