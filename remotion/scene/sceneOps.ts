// Changes to the list of elements in a scene. Pure functions, so the
// sidebar buttons and the keyboard shortcuts do exactly the same thing.

import {
  MAX_ELEMENTS,
  TRANSFORM_LIMITS,
  createElementId,
  type SceneDocument,
  type SceneElement,
} from "./definitions";

/**
 * The scene with a copy of an element right below the original, and the
 * id of the copy - or null if there is nothing to copy or no room left.
 */
export function duplicateElement(
  scene: SceneDocument,
  id: string,
): { scene: SceneDocument; id: string } | null {
  const index = scene.elements.findIndex((e) => e.id === id);
  if (index < 0 || scene.elements.length >= MAX_ELEMENTS) return null;

  const copy: SceneElement = {
    ...structuredClone(scene.elements[index]),
    id: createElementId(),
    name: `${scene.elements[index].name} copy`.slice(0, 40),
  };
  const elements = [...scene.elements];
  elements.splice(index + 1, 0, copy);
  return { scene: { ...scene, elements }, id: copy.id };
}

/** The scene without an element, and which element to select afterwards. */
export function removeElement(
  scene: SceneDocument,
  id: string,
): { scene: SceneDocument; nextId: string | null } {
  const index = scene.elements.findIndex((e) => e.id === id);
  const elements = scene.elements.filter((e) => e.id !== id);
  // The neighbour that takes its place, else the one before it.
  const next = elements[index] ?? elements[index - 1] ?? null;
  return { scene: { ...scene, elements }, nextId: next?.id ?? null };
}

/** The scene with the element at index `from` moved to index `to`. */
export function moveElement(scene: SceneDocument, from: number, to: number): SceneDocument {
  if (from === to) return scene;
  const elements = [...scene.elements];
  const [moved] = elements.splice(from, 1);
  elements.splice(to, 0, moved);
  return { ...scene, elements };
}

/** An element's position shifted by `delta` along one axis, within the limits. */
export function nudgePosition(
  element: SceneElement,
  axis: 0 | 1 | 2,
  delta: number,
): SceneElement["position"] {
  const { min, max } = TRANSFORM_LIMITS.position;
  const position: SceneElement["position"] = [...element.position];
  position[axis] = Math.round(Math.min(max, Math.max(min, position[axis] + delta)) * 100) / 100;
  return position;
}
