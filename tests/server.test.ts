// Checks of the rules the server enforces: plan limits, output sizes and
// the signature on payment webhooks. Run with `pnpm test`.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { outputSize } from "../remotion/types";
import { readWebhookEvent } from "../src/lib/stripe";
import {
  TIER_LIMITS,
  clampToTier,
  isFrameRateAllowed,
  isResolutionAllowed,
} from "../src/lib/tiers";
import {
  frameRangeFor,
  sanitizeAspect,
  sanitizeFrameRate,
  sanitizeRange,
  sanitizeResolution,
} from "../src/lib/visualizerSettings";

test("free plan: 720p and 30 fps only, with a watermark", () => {
  assert.ok(isResolutionAllowed("FREE", "720p"));
  assert.ok(!isResolutionAllowed("FREE", "1080p"));
  assert.ok(isFrameRateAllowed("FREE", 30));
  assert.ok(!isFrameRateAllowed("FREE", 60));
  assert.ok(TIER_LIMITS.FREE.watermark);
  assert.deepEqual(clampToTier("FREE", "4k", 60), { resolution: "720p", fps: 30 });
});

test("premium plan: everything, no watermark", () => {
  assert.ok(isResolutionAllowed("PREMIUM", "4k"));
  assert.ok(isFrameRateAllowed("PREMIUM", 60));
  assert.ok(!TIER_LIMITS.PREMIUM.watermark);
  assert.deepEqual(clampToTier("PREMIUM", "4k", 60), { resolution: "4k", fps: 60 });
});

test("output size: the resolution names the short side", () => {
  assert.deepEqual(outputSize("16:9", "1080p"), { width: 1920, height: 1080 });
  assert.deepEqual(outputSize("9:16", "1080p"), { width: 1080, height: 1920 });
  assert.deepEqual(outputSize("1:1", "4k"), { width: 2160, height: 2160 });
});

test("settings from the client fall back to defaults when unknown", () => {
  assert.equal(sanitizeResolution("8k"), "1080p");
  assert.equal(sanitizeAspect("4:3"), "16:9");
  assert.equal(sanitizeAspect("9:16"), "9:16");
  assert.equal(sanitizeFrameRate(24), 60);
  assert.equal(sanitizeFrameRate(30), 30);
});

test("export section: anything that is not a proper section means the whole track", () => {
  assert.deepEqual(sanitizeRange({ start: 3, end: 18 }), { start: 3, end: 18 });
  assert.deepEqual(sanitizeRange({ start: -5, end: 10 }), { start: 0, end: 10 });
  assert.equal(sanitizeRange(null), null);
  assert.equal(sanitizeRange({ start: 3 }), null);
  assert.equal(sanitizeRange({ start: "3", end: 18 }), null);
  assert.equal(sanitizeRange({ start: 10, end: 10.5 }), null);
  assert.equal(sanitizeRange({ start: 10, end: 3 }), null);
  assert.equal(sanitizeRange({ start: 0, end: Infinity }), null);
});

test("export section: frames are cut to the track's length", () => {
  // 15 seconds from second 3, at 30 fps, in a 60-second track.
  assert.deepEqual(frameRangeFor({ start: 3, end: 18 }, 30, 1800), [90, 539]);
  // Reaching past the end stops at the last frame.
  assert.deepEqual(frameRangeFor({ start: 50, end: 80 }, 30, 1800), [1500, 1799]);
  // Starting after the end is not a section at all.
  assert.equal(frameRangeFor({ start: 61, end: 70 }, 30, 1800), null);
});

test("payment webhook: only a correctly signed, fresh message is accepted", () => {
  const secret = "whsec_test_only_for_this_test";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  const body = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: "user_1", customer: "cus_1" } },
  });
  const now = Date.UTC(2026, 0, 1);
  const stamp = Math.floor(now / 1000);
  const sign = (t: number, text: string, key = secret) =>
    `t=${t},v1=${createHmac("sha256", key).update(`${t}.${text}`).digest("hex")}`;

  assert.equal(readWebhookEvent(body, sign(stamp, body), now)?.type, "checkout.session.completed");
  // Wrong key, changed body, missing header, too old.
  assert.equal(readWebhookEvent(body, sign(stamp, body, "another"), now), null);
  assert.equal(readWebhookEvent(body + " ", sign(stamp, body), now), null);
  assert.equal(readWebhookEvent(body, null, now), null);
  assert.equal(readWebhookEvent(body, sign(stamp - 3600, body), now), null);

  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.equal(readWebhookEvent(body, sign(stamp, body), now), null);
});
