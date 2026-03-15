export function verificationEmailTemplate(link: string) {
  return {
    subject: "Confirm your subscription",
    html: `
      <h2>Confirm your subscription</h2>
      <p>Click the link below to confirm your newsletter subscription.</p>
      <p><a href="${link}">Confirm subscription</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: `Confirm your subscription: ${link}`,
  };
}

export function resetPasswordTemplate(link: string) {
  return {
    subject: "Reset your password",
    html: `
      <h2>Password reset</h2>
      <p>Click the link below to reset your password.</p>
      <p><a href="${link}">Reset password</a></p>
    `,
    text: `Reset your password: ${link}`,
  };
}

export function newsletterTemplate(subject: string, body: string) {
  return {
    subject,
    html: `<div style="font-family: Arial, sans-serif;">${body}</div>`,
    text: body,
  };
}