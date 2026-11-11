import type { CameraSettings, Vec3 } from "./definitions";

/**
 * Where the camera is at a given time. It circles the scene centre (which
 * it always looks at), optionally drifting sideways (sway) and up and down
 * (bob). Depends only on the settings and the time, so the preview and the
 * render agree on every frame.
 */
export function cameraPosition(camera: CameraSettings, seconds: number): Vec3 {
  const angle = seconds * camera.orbit;
  const drift = Math.sin(seconds * camera.drift);
  const sideways = drift * camera.sway;

  return [
    Math.sin(angle) * camera.distance + Math.cos(angle) * sideways,
    camera.height + drift * camera.bob,
    Math.cos(angle) * camera.distance - Math.sin(angle) * sideways,
  ];
}
