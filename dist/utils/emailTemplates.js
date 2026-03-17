"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationEmailTemplate = verificationEmailTemplate;
exports.resetPasswordTemplate = resetPasswordTemplate;
exports.newsletterTemplate = newsletterTemplate;
exports.adminMessageTemplate = adminMessageTemplate;
function baseEmailTemplate(title, preheader, bodyHtml) {
    return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0; background:#F6F7F6; font-family: Arial, sans-serif;">
      <div style="padding:24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #E7ECEB;">
          <tr>
            <td style="padding:28px 28px 0;">
              <img src="{{LOGO_URL}}" alt="Women for Women Rwanda" width="140" style="display:block; height:auto;" />
              <div style="font-size:10px; letter-spacing:0.3em; text-transform:uppercase; color:#00A991; font-weight:700; margin-top:12px;">
                Women for Women Rwanda
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 12px;">
              <h1 style="margin:0 0 12px; font-size:28px; line-height:1.1; color:#0D2323; text-transform:uppercase;">${title}</h1>
              <p style="margin:0; font-size:13px; color:#6B7574;">${preheader}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px; background:#0B1E1A; color:#B9D0CC; font-size:11px;">
              Women for Women Rwanda â€¢ Kigali, Rwanda
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
  `;
}
function verificationEmailTemplate(link, logoUrl) {
    const body = `
    <p style="margin:0 0 16px; font-size:14px; color:#26302F;">
      Please confirm your subscription to receive our latest news, success stories, and program updates.
    </p>
    <a href="${link}" style="display:inline-block; background:#00A991; color:#ffffff; text-decoration:none; padding:12px 18px; font-size:12px; font-weight:800; letter-spacing:0.2em; text-transform:uppercase;">
      Confirm Subscription
    </a>
    <p style="margin:16px 0 0; font-size:12px; color:#6B7574;">
      If you did not request this, you can ignore this email.
    </p>
  `;
    return {
        subject: "Confirm your subscription",
        html: baseEmailTemplate("Confirm Subscription", "Please confirm your subscription.", body).replace("{{LOGO_URL}}", logoUrl),
        text: `Confirm your subscription: ${link}`,
    };
}
function resetPasswordTemplate(link, logoUrl) {
    return {
        subject: "Reset your password",
        html: baseEmailTemplate("Password Reset", "Use the secure link below to reset your password.", `
      <p style="margin:0 0 16px; font-size:14px; color:#26302F;">
        Click the button below to reset your password.
      </p>
      <a href="${link}" style="display:inline-block; background:#0D2323; color:#ffffff; text-decoration:none; padding:12px 18px; font-size:12px; font-weight:800; letter-spacing:0.2em; text-transform:uppercase;">
        Reset Password
      </a>
    `).replace("{{LOGO_URL}}", logoUrl),
        text: `Reset your password: ${link}`,
    };
}
function newsletterTemplate(subject, body, logoUrl) {
    return {
        subject,
        html: baseEmailTemplate(subject, "Latest updates from Women for Women Rwanda.", `<div style="font-size:14px; color:#26302F; line-height:1.7;">${body}</div>`).replace("{{LOGO_URL}}", logoUrl),
        text: body,
    };
}
function adminMessageTemplate(payload, logoUrl) {
    const { name, email, phone, organization, message } = payload;
    const body = `
    <p style="margin:0 0 12px; font-size:14px; color:#26302F;">
      You have received a new message from <strong>${name}</strong>.
    </p>
    <div style="border:1px solid #E7ECEB; padding:12px; margin:12px 0; font-size:13px; color:#26302F;">
      <div><strong>Email:</strong> ${email}</div>
      ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ""}
      ${organization ? `<div><strong>Organization:</strong> ${organization}</div>` : ""}
    </div>
    <div style="font-size:14px; color:#26302F; line-height:1.7; white-space:pre-wrap;">
      ${String(message).replace(/\n/g, "<br/>")}
    </div>
  `;
    return {
        subject: `New partner message from ${name}`,
        html: baseEmailTemplate("New Partner Message", "A new message was sent from the partner page.", body).replace("{{LOGO_URL}}", logoUrl),
        text: [
            `Name: ${name}`,
            `Email: ${email}`,
            phone ? `Phone: ${phone}` : null,
            organization ? `Organization: ${organization}` : null,
            "",
            message,
        ].filter(Boolean).join("\n"),
    };
}
//# sourceMappingURL=emailTemplates.js.map