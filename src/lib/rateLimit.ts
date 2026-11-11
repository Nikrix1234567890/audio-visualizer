import { NextResponse } from "next/server";

// A simple brake against floods: at most N actions per time window for one
// key (usually "what:ip"). Counted in this server process' memory - enough
// for a single server; several servers would need a shared store.

const buckets = new Map<string, number[]>();
/** Forget idle keys once the map has grown this large. */
const SWEEP_AT = 5000;

/** Records one action for `key` and says whether it is still within the limit. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const since = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((at) => at > since);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > SWEEP_AT) {
    for (const [other, times] of buckets) {
      if (times[times.length - 1] <= since) buckets.delete(other);
    }
  }
  return true;
}

/**
 * The address a request comes from. Behind a reverse proxy this is the
 * first entry of X-Forwarded-For, so the proxy must set that header itself
 * and not pass on what the visitor sent (see DEPLOY.md). Without a proxy
 * there is no such header and every visitor shares one bucket, "direct".
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "direct";
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

export const tooManyRequests = (what: string) =>
  NextResponse.json(
    { error: `Too many ${what} in a short time. Wait a little and try again.` },
    { status: 429 },
  );
