import { resetPasswordMail, sendMail, verifyEmailMail } from "@/lib/mail";
import { createToken } from "@/lib/tokens";

const HOUR_MS = 60 * 60 * 1000;

type MailUser = { id: string; email: string; passwordHash: string };

/** Mails a link that lets the user choose a new password, valid for one hour. */
export async function sendResetLink(user: MailUser, origin: string) {
  // Bound to the current password: using the link once invalidates it.
  const token = createToken("reset-password", user.id, user.passwordHash, HOUR_MS);
  await sendMail(
    resetPasswordMail(user.email, `${origin}/reset?token=${encodeURIComponent(token)}`),
  );
}

/** Mails a link that confirms the address, valid for seven days. */
export async function sendVerifyLink(user: Pick<MailUser, "id" | "email">, origin: string) {
  const token = createToken("verify-email", user.id, user.email, 7 * 24 * HOUR_MS);
  await sendMail(
    verifyEmailMail(user.email, `${origin}/verify?token=${encodeURIComponent(token)}`),
  );
}
