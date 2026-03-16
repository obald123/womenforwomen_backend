"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const mail_1 = require("../config/mail");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
async function sendMail(to, subject, html, text) {
    const isDevPlaceholder = env_1.env.NODE_ENV !== "production" && env_1.env.MAIL_HOST.includes("example.com");
    if (isDevPlaceholder) {
        logger_1.logger.warn("Email skipped in development (placeholder SMTP host)", { to, subject });
        return;
    }
    try {
        await mail_1.mailer.sendMail({
            from: env_1.env.MAIL_FROM,
            to,
            subject,
            html,
            text,
        });
    }
    catch (err) {
        if (env_1.env.NODE_ENV !== "production") {
            logger_1.logger.warn("Email send failed in development", { error: err.message });
            return;
        }
        throw err;
    }
}
//# sourceMappingURL=mailService.js.map