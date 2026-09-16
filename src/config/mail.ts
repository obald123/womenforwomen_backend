import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { env } from "./env";

// `family` is a real, supported nodemailer/net option (forwarded straight to the
// underlying socket connect call) but @types/nodemailer doesn't declare it, hence
// the intersection type instead of relying on SMTPTransport.Options alone.
const options: SMTPTransport.Options & { family?: number } = {
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_PORT === 465,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
  // Some PaaS hosts (Render included) have flaky/absent IPv6 routing to specific
  // external hosts, which surfaces as a silent connection timeout rather than a
  // clear refusal. Forcing IPv4 avoids that path entirely.
  family: 4,
  connectionTimeout: 20_000,
  greetingTimeout: 20_000,
  socketTimeout: 30_000,
};

export const mailer = nodemailer.createTransport(options);