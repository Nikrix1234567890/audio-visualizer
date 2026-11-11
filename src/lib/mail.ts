import { BRAND } from "../../remotion/brand";

// Sending mail. With RESEND_API_KEY and MAIL_FROM set in .env, mails go
// out through Resend (https://resend.com) - one HTTPS call, no SDK.
// Without them nothing is sent: the mail is printed to the server log, so
// the links in it can be used while developing.

type Mail = { to: string; subject: string; text: string };

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(mail: Mail): Promise<void> {
  if (!isMailConfigured()) {
    console.log(
      `\n--- mail (not sent: RESEND_API_KEY / MAIL_FROM are not set) ---\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n---\n`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Sending mail failed (${response.status}).`);
  }
}

export function resetPasswordMail(to: string, link: string): Mail {
  return {
    to,
    subject: `Reset your ${BRAND.name} password`,
    text: `Someone asked to reset the password of the ${BRAND.name} account with this address.\n\nChoose a new password here (the link works for one hour):\n${link}\n\nIf that was not you, ignore this mail - nothing changes.`,
  };
}

export function verifyEmailMail(to: string, link: string): Mail {
  return {
    to,
    subject: `Confirm your address for ${BRAND.name}`,
    text: `Welcome to ${BRAND.name}.\n\nConfirm that this address is yours (the link works for seven days):\n${link}\n\nIf you did not create an account, ignore this mail.`,
  };
}
