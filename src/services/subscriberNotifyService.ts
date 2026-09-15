import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { sendMail } from "./mailService";
import { newContentAlertTemplate, welcomeDigestTemplate } from "../utils/emailTemplates";

const logoUrl = () => `${env.BASE_URL}/images/site/logo.png`;

/**
 * Emails every verified subscriber about a newly published item, and records
 * it as a newsletter campaign so it shows up in the admin's send history
 * alongside manually-sent campaigns.
 */
export async function notifySubscribersOfNewContent(payload: {
  kicker: string;
  title: string;
  excerpt?: string | null;
  url: string;
}) {
  const subs = await prisma.subscriber.findMany({ where: { verified: true } });
  if (!subs.length) return;

  const template = newContentAlertTemplate(payload, logoUrl());
  const campaign = await prisma.newsletterCampaign.create({
    data: { subject: template.subject, content: payload.excerpt || payload.title },
  });

  subs.forEach((sub, idx) => {
    setTimeout(async () => {
      try {
        await sendMail(sub.email, template.subject, template.html, template.text);
        await prisma.newsletterSend.create({
          data: {
            campaignId: campaign.id,
            email: sub.email,
            subject: template.subject,
            content: payload.excerpt || payload.title,
          },
        });
      } catch (err) {
        logger.error("Failed to send new-content notification", {
          email: sub.email,
          error: (err as Error).message,
        });
      }
    }, idx * 100);
  });
}

/**
 * Sent once, right after a subscriber confirms their email, so they see what
 * was already published before they signed up.
 */
export async function sendWelcomeDigest(email: string) {
  const [articles, reports] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.impactReport.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const template = welcomeDigestTemplate(
    {
      articles: articles.map((a) => ({ title: a.title, url: `${env.BASE_URL}/news/${a.slug}` })),
      reports: reports.map((r) => ({ title: r.title, url: `${env.BASE_URL}/impact#impact-reports` })),
    },
    logoUrl()
  );

  await sendMail(email, template.subject, template.html, template.text);
}
