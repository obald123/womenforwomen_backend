import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { newsletterTemplate } from "../../utils/emailTemplates";
import { sendMail } from "../../services/mailService";
import { logAudit } from "../../services/auditService";

export async function listSubscribers(_req: Request, res: Response) {
  const items = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: items });
}

export async function createCampaign(req: Request, res: Response) {
  const { subject, content } = req.body as { subject: string; content: string };
  const campaign = await prisma.newsletterCampaign.create({ data: { subject, content } });
  await logAudit("newsletter.campaign.create", req.user?.id ?? null, { id: campaign.id });
  res.status(201).json({ success: true, data: campaign });
}

export async function sendCampaign(req: Request, res: Response) {
  const { id } = req.params;
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError("Campaign not found");

  const subs = await prisma.subscriber.findMany();
  const template = newsletterTemplate(campaign.subject, campaign.content);

  subs.forEach((s, idx) => {
    setTimeout(async () => {
      await sendMail(s.email, template.subject, template.html, template.text);
      await prisma.newsletterSend.create({
        data: {
          campaignId: campaign.id,
          email: s.email,
          subject: template.subject,
          content: campaign.content,
        },
      });
    }, idx * 100);
  });

  await logAudit("newsletter.campaign.send", req.user?.id ?? null, { id: campaign.id, total: subs.length });
  res.json({ success: true, total: subs.length });
}

export async function unsubscribe(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.subscriber.delete({ where: { id } });
  await logAudit("newsletter.unsubscribe", req.user?.id ?? null, { id });
  res.json({ success: true });
}
