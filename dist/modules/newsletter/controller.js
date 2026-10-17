"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubscribers = listSubscribers;
exports.createCampaign = createCampaign;
exports.sendCampaign = sendCampaign;
exports.unsubscribe = unsubscribe;
const prisma_1 = require("../../config/prisma");
const errors_1 = require("../../utils/errors");
const emailTemplates_1 = require("../../utils/emailTemplates");
const mailService_1 = require("../../services/mailService");
const auditService_1 = require("../../services/auditService");
async function listSubscribers(_req, res) {
    const items = await prisma_1.prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items });
}
async function createCampaign(req, res) {
    const { subject, content } = req.body;
    const campaign = await prisma_1.prisma.newsletterCampaign.create({ data: { subject, content } });
    await (0, auditService_1.logAudit)("newsletter.campaign.create", req.user?.id ?? null, { id: campaign.id });
    res.status(201).json({ success: true, data: campaign });
}
async function sendCampaign(req, res) {
    const { id } = req.params;
    const campaign = await prisma_1.prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign)
        throw new errors_1.NotFoundError("Campaign not found");
    const subs = await prisma_1.prisma.subscriber.findMany();
    const template = (0, emailTemplates_1.newsletterTemplate)(campaign.subject, campaign.content);
    subs.forEach((s, idx) => {
        setTimeout(async () => {
            await (0, mailService_1.sendMail)(s.email, template.subject, template.html, template.text);
            await prisma_1.prisma.newsletterSend.create({
                data: {
                    campaignId: campaign.id,
                    email: s.email,
                    subject: template.subject,
                    content: campaign.content,
                },
            });
        }, idx * 100);
    });
    await (0, auditService_1.logAudit)("newsletter.campaign.send", req.user?.id ?? null, { id: campaign.id, total: subs.length });
    res.json({ success: true, total: subs.length });
}
async function unsubscribe(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.subscriber.delete({ where: { id } });
    await (0, auditService_1.logAudit)("newsletter.unsubscribe", req.user?.id ?? null, { id });
    res.json({ success: true });
}
//# sourceMappingURL=controller.js.map