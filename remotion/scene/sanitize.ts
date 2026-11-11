// Turns anything (client input, an old saved project, a hand-edited JSON)
// into a valid SceneDocument: unknown element types are dropped, every
// number is clamped to its allowed range, missing values get defaults.
// Never trust a scene from the client without running it through this.

import {
  CAMERA_PARAMS,
  DEFAULT_CAMERA,
  DEFAULT_LOOK,
  ELEMENT_DEFS,
  ELEMENT_TYPES,
  LOOK_PARAMS,
  MAX_ELEMENTS,
  TRANSFORM_LIMITS,
  createElementId,
  type AudioSource,
  type Bindings,
  type CameraSettings,
  type ElementType,
  type LookSettings,
  type ParamDef,
  type ParamValue,
  type Params,
  type SceneDocument,
  type SceneElement,
  type Vec3,
} from "./definitions";
import { AUDIO_SOURCES, TRANSFORM_TARGETS, isBindable } from "./bindings";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const SAFE_ID = /^[a-zA-Z0-9_-]{1,40}$/;
const MAX_NAME_LENGTH = 40;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeParam(def: ParamDef, value: unknown, fallback: ParamValue): ParamValue {
  if (def.kind === "number") {
    return clamp(value, fallback as number, def.min, def.max);
  }
  if (def.kind === "toggle") {
    return typeof value === "boolean" ? value : fallback;
  }
  return typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;
}

function sanitizeParams(defs: ParamDef[], input: unknown, defaults: Params): Params {
  const raw = isRecord(input) ? input : {};
  const out: Params = {};
  for (const def of defs) {
    out[def.key] = sanitizeParam(def, raw[def.key], defaults[def.key]);
  }
  return out;
}

/**
 * Keeps only bindings that point at something bindable, with a known signal
 * and an amount no larger than the target's whole range.
 */
function sanitizeBindings(
  targets: Record<string, { min: number; max: number }>,
  input: unknown,
): Bindings {
  const raw = isRecord(input) ? input : {};
  const out: Bindings = {};

  for (const [key, limits] of Object.entries(targets)) {
    const binding = raw[key];
    if (!isRecord(binding)) continue;
    if (!AUDIO_SOURCES.some((s) => s.id === binding.source)) continue;
    const range = limits.max - limits.min;
    out[key] = {
      source: binding.source as AudioSource,
      amount: clamp(binding.amount, 0, -range, range),
    };
  }

  return out;
}

function bindableTargets(defs: ParamDef[]) {
  const targets: Record<string, { min: number; max: number }> = {};
  for (const def of defs) if (isBindable(def)) targets[def.key] = def;
  return targets;
}

function sanitizeVec3(
  input: unknown,
  limits: { min: number; max: number },
): Vec3 {
  const raw = Array.isArray(input) ? input : [];
  return [0, 1, 2].map((i) => clamp(raw[i], 0, limits.min, limits.max)) as Vec3;
}

function sanitizeElement(input: unknown, usedIds: Set<string>): SceneElement | null {
  if (!isRecord(input)) return null;
  if (!ELEMENT_TYPES.includes(input.type as ElementType)) return null;

  const type = input.type as ElementType;
  const def = ELEMENT_DEFS[type];

  let id =
    typeof input.id === "string" && SAFE_ID.test(input.id) ? input.id : createElementId();
  while (usedIds.has(id)) id = createElementId();
  usedIds.add(id);

  const name =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim().slice(0, MAX_NAME_LENGTH)
      : def.label;

  return {
    id,
    type,
    name,
    visible: typeof input.visible === "boolean" ? input.visible : true,
    position: sanitizeVec3(input.position, TRANSFORM_LIMITS.position),
    rotation: sanitizeVec3(input.rotation, TRANSFORM_LIMITS.rotation),
    scale: clamp(input.scale, 1, TRANSFORM_LIMITS.scale.min, TRANSFORM_LIMITS.scale.max),
    params: sanitizeParams(def.params, input.params, def.defaults),
    bindings: sanitizeBindings(
      { ...bindableTargets(def.params), ...TRANSFORM_TARGETS },
      input.bindings,
    ),
  };
}

export function sanitizeScene(input: unknown): SceneDocument {
  const raw = isRecord(input) ? input : {};
  const usedIds = new Set<string>();
  const elements: SceneElement[] = [];

  for (const item of Array.isArray(raw.elements) ? raw.elements : []) {
    if (elements.length >= MAX_ELEMENTS) break;
    const element = sanitizeElement(item, usedIds);
    if (element) elements.push(element);
  }

  const look = sanitizeParams(
    LOOK_PARAMS,
    raw.look,
    DEFAULT_LOOK,
  ) as unknown as LookSettings;
  // Fog that ends before it starts would hide the whole scene.
  if (look.fogFar <= look.fogNear) look.fogFar = look.fogNear + 1;

  return {
    version: 1,
    camera: sanitizeParams(
      CAMERA_PARAMS,
      raw.camera,
      DEFAULT_CAMERA,
    ) as unknown as CameraSettings,
    cameraBindings: sanitizeBindings(
      bindableTargets(CAMERA_PARAMS),
      raw.cameraBindings,
    ),
    look,
    lookBindings: sanitizeBindings(bindableTargets(LOOK_PARAMS), raw.lookBindings),
    elements,
  };
}
