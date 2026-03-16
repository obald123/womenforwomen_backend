"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = createMessage;
exports.listMessages = listMessages;
exports.getMessage = getMessage;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
const prisma_1 = require("../../config/prisma");
const pagination_1 = require("../../utils/pagination");
const errors_1 = require("../../utils/errors");
const auditService_1 = require("../../services/auditService");
const mailService_1 = require("../../services/mailService");
const env_1 = require("../../config/env");
async function createMessage(req, res) {
    const { name, email, phone, organization, message } = req.body;
    const item = await prisma_1.prisma.contactMessage.create({
        data: {
            name,
            email,
            phone: phone || null,
            organization: organization || null,
            message,
        },
    });
    const subject = `New partner message from ${name}`;
    const text = [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        organization ? `Organization: ${organization}` : null,
        "",
        message,
    ]
        .filter(Boolean)
        .join("\n");
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h3>New Partner Message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
      ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
    </div>
  `;
    await (0, mailService_1.sendMail)(env_1.env.ADMIN_EMAIL, subject, html, text);
    res.status(201).json({ success: true, data: item });
}
async function listMessages(req, res) {
    const { unread, page, pageSize } = req.query;
    const { skip, take } = (0, pagination_1.parsePagination)(page, pageSize);
    const where = {};
    if (unread === "true")
        where.isRead = false;
    const [items, total] = await Promise.all([
        prisma_1.prisma.contactMessage.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma_1.prisma.contactMessage.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
}
async function getMessage(req, res) {
    const { id } = req.params;
    const item = await prisma_1.prisma.contactMessage.findUnique({ where: { id } });
    if (!item)
        throw new errors_1.NotFoundError("Message not found");
    res.json({ success: true, data: item });
}
async function updateMessage(req, res) {
    const { id } = req.params;
    const { isRead } = req.body;
    const item = await prisma_1.prisma.contactMessage.update({
        where: { id },
        data: { isRead: Boolean(isRead) },
    });
    await (0, auditService_1.logAudit)("message.update", req.user?.id ?? null, { id: item.id });
    res.json({ success: true, data: item });
}
async function deleteMessage(req, res) {
    const { id } = req.params;
    await prisma_1.prisma.contactMessage.delete({ where: { id } });
    await (0, auditService_1.logAudit)("message.delete", req.user?.id ?? null, { id });
    res.json({ success: true });
}
//# sourceMappingURL=controller.js.map