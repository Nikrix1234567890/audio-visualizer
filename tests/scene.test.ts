// Checks of the scene logic that the preview and the render both rely on.
// Run with `pnpm test` (Node's built-in test runner, through tsx).
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveParams, resolveTransform } from "../remotion/scene/bindings";
import { CAMERA_MOVES, applyCameraMove } from "../remotion/scene/cameraMoves";
import {
  CAMERA_PARAMS,
  ELEMENT_DEFS,
  ELEMENT_TYPES,
  FONTS,
  createElement,
  type Keyframe,
} from "../remotion/scene/definitions";
import {
  keyframeTimes,
  keyframeValue,
  moveKeyframes,
  warpTime,
  withKeyframe,
  withTransform,
  withoutKeyframe,
} from "../remotion/scene/keyframes";
import { lyricAt, parseLyrics } from "../remotion/scene/lyrics";
import { sanitizeScene } from "../remotion/scene/sanitize";
import { TEMPLATES, cloneScene } from "../remotion/scene/templates";

const SILENCE = { bass: 0, mid: 0, treble: 0, level: 0, beat: 0, beatCount: 0 };
const key = (t: number, v: number, ease: Keyframe["ease"] = "linear"): Keyframe => ({ t, v, ease });

test("keyframes: value between, before and after the markers", () => {
  const keys = [key(0, 0), key(2, 10), key(4, 20)];
  assert.equal(keyframeValue(keys, -1), 0);
  assert.equal(keyframeValue(keys, 1), 5);
  assert.equal(keyframeValue(keys, 3), 15);
  assert.equal(keyframeValue(keys, 99), 20);
});

test("keyframes: smooth eases, hold jumps", () => {
  assert.equal(keyframeValue([key(0, 0, "smooth"), key(4, 16)], 1), 2.5);
  assert.equal(keyframeValue([key(0, 0, "smooth"), key(4, 16)], 2), 8);
  assert.equal(keyframeValue([key(0, 3, "hold"), key(4, 16)], 3.99), 3);
  assert.equal(keyframeValue([key(0, 3, "hold"), key(4, 16)], 4), 16);
});

test("keyframes: adding keeps them sorted, the same moment replaces", () => {
  let keys = withKeyframe([], 2, 10);
  keys = withKeyframe(keys, 4, 20);
  keys = withKeyframe(keys, 0, 0);
  assert.deepEqual(keys.map((k) => k.t), [0, 2, 4]);
  assert.deepEqual(withKeyframe(keys, 2.001, 99).map((k) => k.v), [0, 99, 20]);
  assert.deepEqual(withoutKeyframe(keys, 2).map((k) => k.t), [0, 4]);
});

test("keyframes: moving a marker moves every target at that moment", () => {
  const moved = moveKeyframes({ a: [key(0, 0), key(2, 1)], b: [key(2, 5), key(7, 5)] }, 2, 5);
  assert.deepEqual(moved.a.map((k) => k.t), [0, 5]);
  assert.deepEqual(moved.b.map((k) => k.t), [5, 7]);
  assert.deepEqual(keyframeTimes(moved), [0, 5, 7]);
});

test("bindings are added on top of the keyframed value", () => {
  const element = createElement("barRing", {
    id: "ring",
    keyframes: { radius: [key(0, 2), key(10, 6)], "position.1": [key(0, 0), key(10, 4)] },
    bindings: { radius: { source: "bass", amount: 1 } },
  });
  const loud = { ...SILENCE, bass: 0.5 };
  const params = resolveParams(ELEMENT_DEFS.barRing.params, element.params, element.bindings, loud, element.keyframes, 5);
  assert.equal(params.radius, 4.5);
  assert.equal(resolveTransform(element, SILENCE, 5).position[1], 2);
});

test("dragging in the picture writes a keyframe only for animated axes", () => {
  const element = createElement("core", { id: "c", keyframes: { "position.0": [key(0, 0)] } });
  const next = withTransform(element, { position: [3, 1, 0] }, 2);
  assert.deepEqual(next.keyframes?.["position.0"].map((k) => [k.t, k.v]), [[0, 0], [2, 3]]);
  // X stays as it was (its value now lives in the keyframes), Y is simply set.
  assert.deepEqual(next.position, [0, 1, 0]);
});

test("tempo swing: off is real time, a wave returns to real time, never runs backwards", () => {
  assert.equal(warpTime(3, { amount: 0, period: 4, mode: "wave" }), 3);
  assert.ok(Math.abs(warpTime(8, { amount: 0.8, period: 4, mode: "wave" }) - 8) < 1e-9);
  const tempo = { amount: 1, period: 4, mode: "wave" as const };
  for (let t = 0; t < 20; t += 0.01) {
    assert.ok(warpTime(t + 0.01, tempo) >= warpTime(t, tempo) - 1e-9);
  }
  // Beat mode without an analysed track falls back to real time.
  assert.equal(warpTime(3, { amount: 1, period: 4, mode: "beat" }), 3);
});

test("camera moves chain from the value the camera has at that moment", () => {
  let scene = cloneScene(TEMPLATES[0].scene);
  const move = (id: string) => CAMERA_MOVES.find((m) => m.id === id)!;
  scene = applyCameraMove(scene, move("pushIn"), 2, 4);
  scene = applyCameraMove(scene, move("pullOut"), 6, 2);
  const distance = scene.cameraKeyframes!.distance;
  assert.deepEqual(distance.map((k) => k.t), [2, 6, 8]);
  assert.equal(distance[0].v, scene.camera.distance);
  assert.ok(distance[1].v < distance[0].v && distance[2].v > distance[1].v);
  assert.deepEqual(sanitizeScene(scene).cameraKeyframes, scene.cameraKeyframes);
});

test("lyrics: rows with a time, plain and karaoke style", () => {
  const lines = parseLyrics("0:12 First\nno time here\n[00:16.50] Second\n0:21");
  assert.deepEqual(lines, [
    { t: 12, text: "First" },
    { t: 16.5, text: "Second" },
    { t: 21, text: "" },
  ]);
  assert.equal(lyricAt(lines, 5, 0.3).text, "");
  assert.equal(lyricAt(lines, 14, 0.3).text, "First");
  assert.equal(lyricAt(lines, 14, 0.3).opacity, 1);
  assert.ok(lyricAt(lines, 12.15, 0.3).opacity < 1);
  assert.equal(lyricAt(lines, 22, 0.3).text, "");
});

test("sanitize: drops what it does not know and clamps the rest", () => {
  const scene = sanitizeScene({
    elements: [
      { type: "nope" },
      {
        ...createElement("barRing", { id: "ring" }),
        params: { radius: 99999, bars: "many" },
        keyframes: {
          radius: [{ t: 5, v: 9999, ease: "x" }, { t: 1, v: 2 }, { t: 1.001, v: 3 }, "junk"],
          bogus: [{ t: 0, v: 1 }],
          bars: [{ t: 0, v: 1 }],
        },
        tempo: { amount: 7, period: 0, mode: "sideways" },
      },
    ],
    cameraKeyframes: { distance: [{ t: 3, v: 20 }], orbit: [{ t: 0, v: 1 }] },
  });
  assert.equal(scene.elements.length, 1);
  const ring = scene.elements[0];
  const radius = ELEMENT_DEFS.barRing.params.find((d) => d.key === "radius");
  assert.ok(radius?.kind === "number");
  assert.equal(ring.params.radius, radius.max);
  assert.equal(ring.params.bars, ELEMENT_DEFS.barRing.defaults.bars);
  // Counts ("bars") and unknown targets cannot be keyframed.
  assert.deepEqual(Object.keys(ring.keyframes!), ["radius"]);
  assert.deepEqual(ring.keyframes!.radius.map((k) => [k.t, k.ease]), [[1, "linear"], [5, "linear"]]);
  assert.deepEqual(ring.tempo, { amount: 1, period: 0.5, mode: "wave" });
  // Speeds ("orbit") cannot be keyframed either.
  assert.deepEqual(Object.keys(scene.cameraKeyframes!), ["distance"]);
});

test("every template survives sanitizing unchanged and has its focus element", () => {
  for (const template of TEMPLATES) {
    const clean = sanitizeScene(template.scene);
    assert.equal(clean.elements.length, template.scene.elements.length, template.id);
    assert.deepEqual(
      clean.elements.map((e) => [e.id, e.params, e.tempo]),
      template.scene.elements.map((e) => [e.id, e.params, e.tempo]),
      template.id,
    );
    assert.ok(template.scene.elements.some((e) => e.id === template.focusElementId), template.id);
  }
});

test("every element type has complete defaults", () => {
  for (const type of ELEMENT_TYPES) {
    const def = ELEMENT_DEFS[type];
    for (const param of def.params) {
      assert.ok(param.key in def.defaults, `${type}.${param.key} has no default`);
      if (param.kind === "number") {
        const value = def.defaults[param.key] as number;
        assert.ok(value >= param.min && value <= param.max, `${type}.${param.key} default out of range`);
      }
      if (param.kind === "select") {
        assert.ok(param.options.some((o) => o.value === def.defaults[param.key]), `${type}.${param.key}`);
      }
    }
  }
  assert.ok(FONTS.length > 0);
  assert.ok(CAMERA_PARAMS.length > 0);
});
