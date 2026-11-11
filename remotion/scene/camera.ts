import type { CameraSettings, Vec3 } from "./definitions";

/**
 * The vertical field of view of the camera for a picture of the given shape
 * (width / height). The "Field of view" setting is the vertical angle of a
 * landscape or square picture. A portrait picture keeps that angle
 * sideways instead and opens up vertically - otherwise it would cut a
 * narrow strip out of the middle of the scene and lose its sides.
 */
export function verticalFov(fov: number, aspect: number): number {
  if (aspect >= 1) return fov;
  const half = Math.atan(Math.tan((fov * Math.PI) / 360) / aspect);
  return (half * 360) / Math.PI;
}

/**
 * Where the camera is at a given time. It circles the scene centre (which
 * it always looks at), optionally drifting sideways (sway) and up and down
 * (bob), and shaking with the bass. Depends only on the settings, the time
 * and the bass level, so the preview and the render agree on every frame.
 */
export function cameraPosition(
  camera: CameraSettings,
  seconds: number,
  bass = 0,
): Vec3 {
  const angle = seconds * camera.orbit;
  const drift = Math.sin(seconds * camera.drift);
  const sideways = drift * camera.sway;

  // Two mismatched sine waves per axis look like a jitter but repeat
  // exactly for a given time - no random numbers involved.
  const shake = camera.shake * bass;
  const shakeSideways =
    shake * 0.5 * (Math.sin(seconds * 61.3) + Math.sin(seconds * 37.9 + 1.7));
  const shakeUp =
    shake * 0.5 * (Math.sin(seconds * 53.1 + 0.6) + Math.sin(seconds * 43.7 + 2.9));
  const side = sideways + shakeSideways;

  return [
    Math.sin(angle) * camera.distance + Math.cos(angle) * side,
    camera.height + drift * camera.bob + shakeUp,
    Math.cos(angle) * camera.distance - Math.sin(angle) * side,
  ];
}
