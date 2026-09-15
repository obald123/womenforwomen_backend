"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifySubscribersOfNewContent = notifySubscribersOfNewContent;
exports.sendWelcomeDigest = sendWelcomeDigest;
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const mailService_1 = require("./mailService");
const emailTemplates_1 = require("../utils/emailTemplates");
const logoUrl = () => `${env_1.env.BASE_URL}/images/site/logo.png`;
/**
 * Emails every verified subscriber about a newly published item, and records
 * it as a newsletter campaign so it shows up in the admin's send history
 * alongside manually-sent campaigns.
 */
async function notifySubscribersOfNewContent(payload) {
    const subs = await prisma_1.prisma.subscriber.findMany({ where: { verified: true } });
    if (!subs.length)
        return;
    const template = (0, emailTemplates_1.newContentAlertTemplate)(payload, logoUrl());
    const campaign = await prisma_1.prisma.newsletterCampaign.create({
        data: { subject: template.subject, content: payload.excerpt || payload.title },
    });
    subs.forEach((sub, idx) => {
        setTimeout(async () => {
            try {
                await (0, mailService_1.sendMail)(sub.email, template.subject, template.html, template.text);
                await prisma_1.prisma.newsletterSend.create({
                    data: {
                        campaignId: campaign.id,
                        email: sub.email,
                        subject: template.subject,
                        content: payload.excerpt || payload.title,
                    },
                });
            }
            catch (err) {
                logger_1.logger.error("Failed to send new-content notification", {
                    email: sub.email,
                    error: err.message,
                });
            }
        }, idx * 100);
    });
}
/**
 * Sent once, right after a subscriber confirms their email, so they see what
 * was already published before they signed up.
 */
async function sendWelcomeDigest(email) {
    const [articles, reports] = await Promise.all([
        prisma_1.prisma.article.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            take: 5,
        }),
        prisma_1.prisma.impactReport.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            take: 3,
        }),
    ]);
    const template = (0, emailTemplates_1.welcomeDigestTemplate)({
        articles: articles.map((a) => ({ title: a.title, url: `${env_1.env.BASE_URL}/news/${a.slug}` })),
        reports: reports.map((r) => ({ title: r.title, url: `${env_1.env.BASE_URL}/impact#impact-reports` })),
    }, logoUrl());
    await (0, mailService_1.sendMail)(email, template.subject, template.html, template.text);
}
//# sourceMappingURL=subscriberNotifyService.js.map