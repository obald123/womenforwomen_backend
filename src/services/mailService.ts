import { env } from "../config/env";
import { logger } from "../config/logger";

// SMTP (port 587/465) is blocked outbound on Render's network — every send attempt
// timed out at the TCP handshake stage regardless of host/port/IPv4-forcing. Brevo's
// HTTP API travels over plain HTTPS (443), which isn't subject to that restriction.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendMail(to: string, subject: string, html: string, text: string) {
  const isDevPlaceholder =
    env.NODE_ENV !== "production" && env.BREVO_API_KEY.startsWith("your_");
  if (isDevPlaceholder) {
    logger.warn("Email skipped in development (placeholder Brevo API key)", { to, subject });
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: "Women for Women Rwanda" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const error = new Error(`Brevo API error (${res.status}): ${body}`);
    if (env.NODE_ENV !== "production") {
      logger.warn("Email send failed in development", { error: error.message });
      return;
    }
    throw error;
  }
}
