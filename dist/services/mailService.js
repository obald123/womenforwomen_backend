"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
// SMTP (port 587/465) is blocked outbound on Render's network — every send attempt
// timed out at the TCP handshake stage regardless of host/port/IPv4-forcing. Brevo's
// HTTP API travels over plain HTTPS (443), which isn't subject to that restriction.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
async function sendMail(to, subject, html, text) {
    const isDevPlaceholder = env_1.env.NODE_ENV !== "production" && env_1.env.BREVO_API_KEY.startsWith("your_");
    if (isDevPlaceholder) {
        logger_1.logger.warn("Email skipped in development (placeholder Brevo API key)", { to, subject });
        return;
    }
    const res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": env_1.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: { email: env_1.env.MAIL_FROM, name: "Women for Women Rwanda" },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text,
        }),
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) {
        const error = new Error(`Brevo API error (${res.status}): ${body}`);
        if (env_1.env.NODE_ENV !== "production") {
            logger_1.logger.warn("Email send failed in development", { error: error.message });
            return;
        }
        throw error;
    }
    // A 2xx here only means Brevo accepted and queued the request — it says nothing
    // about whether the email actually reached the inbox (could still bounce, get
    // blocked by their anti-spam review, or land in spam). The messageId is what you
    // look up in Brevo's dashboard (Transactional > Logs) to see the real delivery
    // status.
    let messageId;
    try {
        messageId = JSON.parse(body)?.messageId;
    }
    catch {
        // Brevo always returns JSON on success; an unparsable body just means we skip
        // logging the id, not that the send failed.
    }
    logger_1.logger.info("Email accepted by Brevo", { to, subject, messageId, status: res.status });
}
//# sourceMappingURL=mailService.js.map