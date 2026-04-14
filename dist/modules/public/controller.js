"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicArticles = publicArticles;
exports.publicArticle = publicArticle;
exports.publicEvents = publicEvents;
exports.publicEvent = publicEvent;
exports.publicGallery = publicGallery;
exports.publicTeam = publicTeam;
exports.subscribe = subscribe;
exports.verifySubscription = verifySubscription;
const prisma_1 = require("../../config/prisma");
const pagination_1 = require("../../utils/pagination");
const cache_1 = require("../../utils/cache");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const mailService_1 = require("../../services/mailService");
const emailTemplates_1 = require("../../utils/emailTemplates");
const CACHE_TTL = 60 * 1000;
async function publicArticles(req, res) {
    const key = `public:articles:${JSON.stringify(req.query)}`;
    const cached = cache_1.cache.get(key);
    if (cached)
        return res.json(cached);
    const { page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const [items, total] = await Promise.all([
        prisma_1.prisma.article.findMany({
            where: { status: "PUBLISHED" },
            skip,
            take,
            orderBy: { publishedAt: "desc" },
        }),
        prisma_1.prisma.article.count({ where: { status: "PUBLISHED" } }),
    ]);
    const payload = { success: true, data: items, total };
    cache_1.cache.set(key, payload, CACHE_TTL);
    res.json(payload);
}
async function publicArticle(req, res) {
    const { slug } = req.params;
    const key = `public:article:${slug}`;
    const cached = cache_1.cache.get(key);
    if (cached)
        return res.json(cached);
    const item = await prisma_1.prisma.article.findUnique({ where: { slug } });
    if (!item || item.status !== "PUBLISHED")
        return res.status(404).json({ success: false });
    const payload = { success: true, data: item };
    cache_1.cache.set(key, payload, CACHE_TTL);
    res.json(payload);
}
async function publicEvents(req, res) {
    const key = `public:events:${JSON.stringify(req.query)}`;
    const cached = cache_1.cache.get(key);
    if (cached)
        return res.json(cached);
    const { upcoming, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = { status: "PUBLISHED" };
    if (upcoming === "true")
        where.eventDate = { gte: new Date() };
    const [items, total] = await Promise.all([
        prisma_1.prisma.event.findMany({
            where,
            skip,
            take,
            orderBy: [{ isFeatured: "desc" }, { eventDate: "asc" }],
        }),
        prisma_1.prisma.event.count({ where }),
    ]);
    const payload = { success: true, data: items, total };
    cache_1.cache.set(key, payload, CACHE_TTL);
    res.json(payload);
}
async function publicEvent(req, res) {
    const { slug } = req.params;
    const key = `public:event:${slug}`;
    const cached = cache_1.cache.get(key);
    if (cached)
        return res.json(cached);
    const item = await prisma_1.prisma.event.findUnique({ where: { slug } });
    if (!item || item.status !== "PUBLISHED")
        return res.status(404).json({ success: false });
    const payload = { success: true, data: item };
    cache_1.cache.set(key, payload, CACHE_TTL);
    res.json(payload);
}
async function publicGallery(req, res) {
    const key = `public:gallery:${JSON.stringify(req.query)}`;
    const cached = cache_1.cache.get(key);
    if (cached)
        return res.json(cached);
    const { page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const [items, total] = await Promise.all([
        prisma_1.prisma.gallery.findMany({ where: { status: "PUBLISHED" }, skip, take, orderBy: { createdAt: "desc" } }),
        prisma_1.prisma.gallery.count({ where: { status: "PUBLISHED" } }),
    ]);
    const payload = { success: true, data: items, total };
    cache_1.cache.set(key, payload, CACHE_TTL);
    res.json(payload);
}
async function publicTeam(req, res) {
    const key = `public:team:${JSON.stringify(req.query)}`;
    const cached = cache_1.cache.get(key);
    if (cached)
        return res.json(cached);
    const { category, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = { status: "PUBLISHED" };
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
    const payload = { success: true, data: items, total };
    cache_1.cache.set(key, payload, CACHE_TTL);
    res.json(payload);
}
async function subscribe(req, res) {
    const { email, name } = req.body;
    const token = crypto_1.default.randomBytes(24).toString("hex");
    const existing = await prisma_1.prisma.subscriber.findUnique({ where: { email } });
    if (existing && existing.verified) {
        return res.json({ success: true, message: "Already subscribed" });
    }
    await prisma_1.prisma.subscriber.upsert({
        where: { email },
        update: { name: name || existing?.name, verifyToken: token, verified: false },
        create: { email, name, verifyToken: token, verified: false },
    });
    const link = `${env_1.env.API_URL}/api/public/verify-subscription?token=${token}`;
    const logoUrl = `${env_1.env.BASE_URL}/images/site/logo.png`;
    const template = (0, emailTemplates_1.verificationEmailTemplate)(link, logoUrl);
    await (0, mailService_1.sendMail)(email, template.subject, template.html, template.text);
    res.json({ success: true, message: "Check your email to confirm subscription" });
}
async function verifySubscription(req, res) {
    const token = req.query.token;
    const sub = await prisma_1.prisma.subscriber.findFirst({ where: { verifyToken: token } });
    if (!sub)
        return res.status(400).send("Invalid verification token");
    await prisma_1.prisma.subscriber.update({
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
          <a class="btn primary" href="${env_1.env.BASE_URL}">Go to Home</a>
          <a class="btn ghost" href="${env_1.env.BASE_URL}/news">Read News</a>
        </div>
      </div>
    </div>
  </body>
</html>`);
}
//# sourceMappingURL=controller.js.map