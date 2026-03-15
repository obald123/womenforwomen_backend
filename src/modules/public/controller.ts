import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { parsePagination } from "../../utils/pagination";
import { cache } from "../../utils/cache";
import crypto from "crypto";
import { env } from "../../config/env";
import { sendMail } from "../../services/mailService";
import { verificationEmailTemplate } from "../../utils/emailTemplates";

const CACHE_TTL = 60 * 1000;

export async function publicArticles(req: Request, res: Response) {
  const key = `public:articles:${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const { page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      skip,
      take,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
  ]);

  const payload = { success: true, data: items, total };
  cache.set(key, payload, CACHE_TTL);
  res.json(payload);
}

export async function publicArticle(req: Request, res: Response) {
  const { slug } = req.params;
  const key = `public:article:${slug}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const item = await prisma.article.findUnique({ where: { slug } });
  if (!item || item.status !== "PUBLISHED") return res.status(404).json({ success: false });
  const payload = { success: true, data: item };
  cache.set(key, payload, CACHE_TTL);
  res.json(payload);
}

export async function publicEvents(req: Request, res: Response) {
  const key = `public:events:${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const { upcoming, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = { status: "PUBLISHED" };
  if (upcoming === "true") where.eventDate = { gte: new Date() };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: [{ isFeatured: "desc" }, { eventDate: "asc" }],
    }),
    prisma.event.count({ where }),
  ]);

  const payload = { success: true, data: items, total };
  cache.set(key, payload, CACHE_TTL);
  res.json(payload);
}

export async function publicEvent(req: Request, res: Response) {
  const { slug } = req.params;
  const key = `public:event:${slug}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const item = await prisma.event.findUnique({ where: { slug } });
  if (!item || item.status !== "PUBLISHED") return res.status(404).json({ success: false });
  const payload = { success: true, data: item };
  cache.set(key, payload, CACHE_TTL);
  res.json(payload);
}

export async function publicGallery(req: Request, res: Response) {
  const key = `public:gallery:${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const { page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const [items, total] = await Promise.all([
    prisma.gallery.findMany({ where: { status: "PUBLISHED" }, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.gallery.count({ where: { status: "PUBLISHED" } }),
  ]);

  const payload = { success: true, data: items, total };
  cache.set(key, payload, CACHE_TTL);
  res.json(payload);
}

export async function publicTeam(req: Request, res: Response) {
  const key = `public:team:${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const { category, page, pageSize } = req.query as Record<string, string>;
  const { skip, take } = parsePagination(page, pageSize);

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.teamMember.findMany({ where, skip, take, orderBy: { displayOrder: "asc" } }),
    prisma.teamMember.count({ where }),
  ]);

  const payload = { success: true, data: items, total };
  cache.set(key, payload, CACHE_TTL);
  res.json(payload);
}

export async function subscribe(req: Request, res: Response) {
  const { email, name } = req.body as { email: string; name?: string };

  const token = crypto.randomBytes(24).toString("hex");
  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing && existing.verified) {
    return res.json({ success: true, message: "Already subscribed" });
  }

  await prisma.subscriber.upsert({
    where: { email },
    update: { name: name || existing?.name, verifyToken: token, verified: false },
    create: { email, name, verifyToken: token, verified: false },
  });

  const link = `${env.API_URL}/api/public/verify-subscription?token=${token}`;
  const template = verificationEmailTemplate(link);
  await sendMail(email, template.subject, template.html, template.text);

  res.json({ success: true, message: "Check your email to confirm subscription" });
}

export async function verifySubscription(req: Request, res: Response) {
  const token = req.query.token as string;
  const sub = await prisma.subscriber.findFirst({ where: { verifyToken: token } });
  if (!sub) return res.status(400).send("Invalid verification token");

  await prisma.subscriber.update({
    where: { id: sub.id },
    data: { verified: true, verifyToken: null },
  });

  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Subscription Confirmed</title>
    <style>
      body { margin:0; font-family: 'Montserrat', Arial, sans-serif; background:#0B7F73; color:#fff; }
      .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px; }
      .card { max-width:680px; background:#0F6E64; border:1px solid rgba(255,255,255,.2); padding:36px; }
      .kicker { font-size:10px; letter-spacing:.35em; text-transform:uppercase; color:rgba(255,255,255,.7); font-weight:700; }
      h1 { margin:16px 0 8px; font-size:40px; line-height:1; text-transform:uppercase; }
      p { color:rgba(255,255,255,.85); line-height:1.6; font-size:14px; }
      .actions { margin-top:24px; display:flex; gap:12px; flex-wrap:wrap; }
      .btn { display:inline-block; padding:12px 18px; font-size:11px; letter-spacing:.2em; text-transform:uppercase; font-weight:800; text-decoration:none; }
      .primary { background:#fff; color:#0B7F73; }
      .ghost { border:1px solid rgba(255,255,255,.5); color:#fff; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="kicker">Subscription Confirmed</div>
        <h1>You are subscribed.</h1>
        <p>Thank you for joining Women for Women Rwanda. You will now receive our latest stories, program updates, and upcoming events.</p>
        <div class="actions">
          <a class="btn primary" href="${env.BASE_URL}">Go to Home</a>
          <a class="btn ghost" href="${env.BASE_URL}/news">Read News</a>
        </div>
      </div>
    </div>
  </body>
</html>`);
}
