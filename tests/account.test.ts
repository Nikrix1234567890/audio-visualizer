// Checks of signed mail links, request limits, element operations and the
// settings read from the environment. Run with `pnpm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, MAX_ELEMENTS } from "../remotion/scene/definitions";
import {
  duplicateElement,
  moveElement,
  nudgePosition,
  removeElement,
} from "../remotion/scene/sceneOps";
import { TEMPLATES, cloneScene } from "../remotion/scene/templates";
import { internalOrigin, publicOrigin } from "../src/lib/origin";
import { clientIp, rateLimit } from "../src/lib/rateLimit";
import { renderConcurrency, renderGl } from "../src/lib/renderSettings";
import { createToken, isTokenValid, tokenUserId } from "../src/lib/tokens";

process.env.AUTH_SECRET = "a-secret-only-for-these-tests";
const HOUR = 60 * 60 * 1000;

test("mail links: valid only for their purpose, their bound fact and their time", () => {
  const now = Date.UTC(2026, 0, 1);
  const token = createToken("reset-password", "user_1", "hash-A", HOUR, now);

  assert.equal(tokenUserId(token), "user_1");
  assert.ok(isTokenValid("reset-password", token, "hash-A", now + 1000));
  // Another purpose, a changed password, too late, tampered with.
  assert.ok(!isTokenValid("verify-email", token, "hash-A", now + 1000));
  assert.ok(!isTokenValid("reset-password", token, "hash-B", now + 1000));
  assert.ok(!isTokenValid("reset-password", token, "hash-A", now + HOUR + 1));
  assert.ok(!isTokenValid("reset-password", token.replace("user_1", "user_2"), "hash-A", now));
  assert.ok(!isTokenValid("reset-password", "not.a.token", "hash-A", now));
  assert.equal(tokenUserId("garbage"), null);
  assert.equal(tokenUserId(undefined), null);
});

test("request limit: allows up to the limit, then refuses until the window has passed", () => {
  const key = `test:${Math.random()}`;
  const start = 1_000_000;
  for (let i = 0; i < 3; i++) assert.ok(rateLimit(key, 3, 1000, start + i));
  assert.ok(!rateLimit(key, 3, 1000, start + 10));
  // A refused attempt does not extend the wait.
  assert.ok(!rateLimit(key, 3, 1000, start + 900));
  assert.ok(rateLimit(key, 3, 1000, start + 1001));
  // Other keys are not affected.
  assert.ok(rateLimit(`${key}:other`, 1, 1000, start));
});

test("visitor address: first entry of the proxy header, else one shared bucket", () => {
  const request = (headers: Record<string, string>) =>
    new Request("http://localhost/x", { headers });
  assert.equal(clientIp(request({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
  assert.equal(clientIp(request({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
  assert.equal(clientIp(request({})), "direct");
});

test("element operations: duplicate, remove, move, nudge", () => {
  const scene = cloneScene(TEMPLATES[0].scene);
  const [first, second] = scene.elements;

  const copied = duplicateElement(scene, first.id)!;
  assert.equal(copied.scene.elements.length, scene.elements.length + 1);
  assert.equal(copied.scene.elements[1].id, copied.id);
  assert.notEqual(copied.id, first.id);
  assert.deepEqual(copied.scene.elements[1].params, first.params);
  // A deep copy: changing it leaves the original alone.
  copied.scene.elements[1].params.radius = -1;
  assert.notEqual(first.params.radius, -1);
  assert.equal(duplicateElement(scene, "no-such-id"), null);

  const full = { ...scene, elements: Array.from({ length: MAX_ELEMENTS }, (_, i) => createElement("core", { id: `c${i}` })) };
  assert.equal(duplicateElement(full, "c0"), null);

  const removed = removeElement(scene, first.id);
  assert.equal(removed.scene.elements.length, scene.elements.length - 1);
  assert.equal(removed.nextId, second.id);
  const last = scene.elements[scene.elements.length - 1];
  assert.equal(removeElement(scene, last.id).nextId, scene.elements[scene.elements.length - 2].id);

  assert.deepEqual(
    moveElement(scene, 0, 2).elements.map((e) => e.id),
    [scene.elements[1].id, scene.elements[2].id, scene.elements[0].id, ...scene.elements.slice(3).map((e) => e.id)],
  );
  assert.deepEqual(nudgePosition(createElement("core", { id: "c", position: [1, 2, 3] }), 0, 0.1), [1.1, 2, 3]);
  assert.equal(nudgePosition(createElement("core", { id: "c", position: [60, 0, 0] }), 0, 5)[0], 60);
});

test("settings from the environment have safe fallbacks", () => {
  delete process.env.RENDER_GL;
  delete process.env.RENDER_CONCURRENCY;
  assert.equal(renderGl(), "angle");
  assert.equal(renderConcurrency(), null);
  process.env.RENDER_GL = "swangle";
  process.env.RENDER_CONCURRENCY = "4";
  assert.equal(renderGl(), "swangle");
  assert.equal(renderConcurrency(), 4);
  process.env.RENDER_GL = "made-up";
  process.env.RENDER_CONCURRENCY = "-2";
  assert.equal(renderGl(), "angle");
  assert.equal(renderConcurrency(), null);
  delete process.env.RENDER_GL;
  delete process.env.RENDER_CONCURRENCY;

  const request = new Request("http://localhost:3000/api/x");
  delete process.env.APP_URL;
  delete process.env.INTERNAL_URL;
  assert.equal(publicOrigin(request), "http://localhost:3000");
  process.env.APP_URL = "https://example.com/";
  process.env.INTERNAL_URL = "http://127.0.0.1:3000";
  assert.equal(publicOrigin(request), "https://example.com");
  assert.equal(internalOrigin(request), "http://127.0.0.1:3000");
  delete process.env.APP_URL;
  delete process.env.INTERNAL_URL;
});
