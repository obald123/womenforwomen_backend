import { mailer } from "../config/mail";
import { env } from "../config/env";
import { logger } from "../config/logger";

export async function sendMail(to: string, subject: string, html: string, text: string) {
  const isDevPlaceholder =
    env.NODE_ENV !== "production" && env.MAIL_HOST.includes("example.com");
  if (isDevPlaceholder) {
    logger.warn("Email skipped in development (placeholder SMTP host)", { to, subject });
    return;
  }

  try {
    await mailer.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    if (env.NODE_ENV !== "production") {
      logger.warn("Email send failed in development", { error: (err as Error).message });
      return;
    }
    throw err;
  }
}
