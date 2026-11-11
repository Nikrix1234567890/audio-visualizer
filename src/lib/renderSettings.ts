// How the headless browser draws a render. The right values depend on the
// machine, so they come from the environment (see .env.example, DEPLOY.md).

type Gl = "angle" | "swangle" | "angle-egl" | "egl" | "swiftshader" | "vulkan";
const GL_VALUES: Gl[] = ["angle", "swangle", "angle-egl", "egl", "swiftshader", "vulkan"];

/**
 * The graphics backend of the render browser.
 *
 * "angle" uses the graphics card and is right for a desktop (Windows,
 * macOS). A Linux server without a graphics card needs "swangle", which
 * draws in software - it works everywhere but is much slower.
 */
export function renderGl(): Gl {
  const wanted = process.env.RENDER_GL as Gl | undefined;
  return wanted && GL_VALUES.includes(wanted) ? wanted : "angle";
}

/**
 * How many frames are drawn at the same time, or null to let Remotion
 * decide (half of the processor threads). Measured on a 32-thread desktop
 * with a graphics card: 2 -> 16 frames a second at 1080p, 4 -> 24,
 * 8 and more -> about 34, the same as the default.
 */
export function renderConcurrency(): number | null {
  const wanted = Number(process.env.RENDER_CONCURRENCY);
  return Number.isInteger(wanted) && wanted > 0 ? wanted : null;
}
