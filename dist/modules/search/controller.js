"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAll = searchAll;
const prisma_1 = require("../../config/prisma");
async function searchAll(req, res) {
    const q = String(req.query.q || "").trim();
    if (!q)
        return res.json({ success: true, data: [] });
    const [articles, events, galleries, team, messages, subscribers] = await Promise.all([
        prisma_1.prisma.article.findMany({
            where: {
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { excerpt: { contains: q, mode: "insensitive" } },
                    { content: { contains: q, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.event.findMany({
            where: {
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { excerpt: { contains: q, mode: "insensitive" } },
                    { content: { contains: q, mode: "insensitive" } },
                    { location: { contains: q, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.gallery.findMany({
            where: { title: { contains: q, mode: "insensitive" } },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.teamMember.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { role: { contains: q, mode: "insensitive" } },
                    { bio: { contains: q, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.contactMessage.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { message: { contains: q, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.subscriber.findMany({
            where: {
                OR: [
                    { email: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
    ]);
    const data = [
        ...articles.map((a) => ({
            type: "article",
            id: a.id,
            title: a.title,
            subtitle: a.status,
            href: `/dashboard/news`,
        })),
        ...events.map((e) => ({
            type: "event",
            id: e.id,
            title: e.title,
            subtitle: e.location,
            href: `/dashboard/events`,
        })),
        ...galleries.map((g) => ({
            type: "gallery",
            id: g.id,
            title: g.title,
            subtitle: "Gallery",
            href: `/dashboard/gallery`,
        })),
        ...team.map((t) => ({
            type: "team",
            id: t.id,
            title: t.name,
            subtitle: t.role,
            href: `/dashboard/team`,
        })),
        ...messages.map((m) => ({
            type: "message",
            id: m.id,
            title: m.name,
            subtitle: m.email,
            href: `/dashboard/messages`,
        })),
        ...subscribers.map((s) => ({
            type: "subscriber",
            id: s.id,
            title: s.name || s.email,
            subtitle: s.email,
            href: `/dashboard/newsletter`,
        })),
    ];
    res.json({ success: true, data });
}
//# sourceMappingURL=controller.js.map