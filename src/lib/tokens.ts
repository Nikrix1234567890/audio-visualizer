import { createHmac, timingSafeEqual } from "node:crypto";

// Signed links for mails: "reset your password", "confirm your address".
//
// A token is "<user id>.<expiry>.<signature>". Nothing is stored: the
// signature (made with AUTH_SECRET) proves that this server issued it for
// this purpose, this user and this expiry. `bound` ties it to a fact that
// must still hold when it is used - the current password hash for a reset
// link, so the link dies the moment the password changes; the address for
// a confirmation link.

export type TokenPurpose = "reset-password" | "verify-email";

function sign(purpose: TokenPurpose, userId: string, expires: number, bound: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return createHmac("sha256", secret)
    .update(`${purpose}:${userId}:${expires}:${bound}`)
    .digest("base64url");
}

export function createToken(
  purpose: TokenPurpose,
  userId: string,
  bound: string,
  lifetimeMs: number,
  now = Date.now(),
): string {
  const expires = now + lifetimeMs;
  return `${userId}.${expires}.${sign(purpose, userId, expires, bound)}`;
}

/** The user id a token names - not yet a statement that the token is valid. */
export function tokenUserId(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const [userId, expires, signature] = token.split(".");
  return userId && expires && signature ? userId : null;
}

/** Whether `token` is a genuine, unexpired token for this purpose and bound fact. */
export function isTokenValid(
  purpose: TokenPurpose,
  token: string,
  bound: string,
  now = Date.now(),
): boolean {
  const [userId, expiresText, signature] = token.split(".");
  const expires = Number(expiresText);
  if (!userId || !signature || !Number.isFinite(expires) || expires < now) return false;
  const expected = Buffer.from(sign(purpose, userId, expires, bound));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
