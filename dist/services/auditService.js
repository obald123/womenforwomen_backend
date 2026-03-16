"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const prisma_1 = require("../config/prisma");
async function logAudit(action, userId, details) {
    await prisma_1.prisma.auditLog.create({
        data: {
            action,
            userId,
            details: details ? JSON.stringify(details) : undefined,
        },
    });
}
//# sourceMappingURL=auditService.js.map