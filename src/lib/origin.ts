// The app's own address, in two flavours.
//
// In development both are simply where the request came in. Behind a
// reverse proxy that is not reliable: the request may arrive as plain
// http on localhost. So production sets them explicitly (see DEPLOY.md).

const clean = (value: string | undefined) => value?.trim().replace(/\/+$/, "") || null;

/**
 * The address visitors use - for links in mails and for the pages Stripe
 * sends people back to. Set APP_URL in production ("https://your-domain.com").
 */
export function publicOrigin(request: Request): string {
  return clean(process.env.APP_URL) ?? new URL(request.url).origin;
}

/**
 * The address the server reaches itself at - for the render browser, which
 * runs on the same machine and loads the track, pictures and fonts from the
 * app. Set INTERNAL_URL in production ("http://localhost:3000") so that
 * traffic does not leave the machine and come back through the proxy.
 */
export function internalOrigin(request: Request): string {
  return clean(process.env.INTERNAL_URL) ?? new URL(request.url).origin;
}
