import { mailer } from "../config/mail";
import { env } from "../config/env";

export async function sendMail(to: string, subject: string, html: string, text: string) {
  await mailer.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });
}