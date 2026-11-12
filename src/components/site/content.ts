import { ANONYMOUS_FILE_DAYS } from "@/lib/cleanup";
import { TIER_LIMITS } from "@/lib/tiers";
import { BRAND } from "../../../remotion/brand";
import { ELEMENT_TYPES } from "../../../remotion/scene/definitions";
import { TEMPLATES } from "../../../remotion/scene/templates";
import { FRAME_RATES, RESOLUTIONS, type ResolutionKey } from "../../../remotion/types";
import type { Question } from "./Faq";

// Copy and numbers shared by the pages outside the editor. Everything that
// can be counted or looked up in the code is read from there, so no page
// can promise something the app does not do.

export const TEMPLATE_COUNT = TEMPLATES.length;
export const ELEMENT_COUNT = ELEMENT_TYPES.length;

const RESOLUTION_KEYS = Object.keys(RESOLUTIONS) as ResolutionKey[];

/** The resolutions a plan may export, smallest first. */
export function resolutionsOf(tier: keyof typeof TIER_LIMITS): ResolutionKey[] {
  const max = RESOLUTION_KEYS.indexOf(TIER_LIMITS[tier].maxResolution);
  return RESOLUTION_KEYS.slice(0, max + 1);
}

const top = (tier: keyof typeof TIER_LIMITS) => {
  const limits = TIER_LIMITS[tier];
  return `${RESOLUTIONS[limits.maxResolution].label} at ${Math.max(...limits.frameRates)} fps`;
};

export const FREE_TOP = top("FREE");
export const PREMIUM_TOP = top("PREMIUM");

/** The rows of the plan comparison, read from the limits the render route enforces. */
export const COMPARE_ROWS: { label: string; free: string; premium: string }[] = [
  {
    label: "Resolution",
    free: resolutionsOf("FREE").map((key) => RESOLUTIONS[key].label).join(", "),
    premium: resolutionsOf("PREMIUM").map((key) => RESOLUTIONS[key].label).join(", "),
  },
  {
    label: "Frame rate",
    free: `${TIER_LIMITS.FREE.frameRates.join(" or ")} fps`,
    premium: `${TIER_LIMITS.PREMIUM.frameRates.join(" or ")} fps`,
  },
  {
    label: "Watermark",
    free: TIER_LIMITS.FREE.watermark ? "Small, bottom right" : "None",
    premium: TIER_LIMITS.PREMIUM.watermark ? "Small, bottom right" : "None",
  },
  {
    label: "Templates and elements",
    free: `All ${TEMPLATE_COUNT} and ${ELEMENT_COUNT}`,
    premium: `All ${TEMPLATE_COUNT} and ${ELEMENT_COUNT}`,
  },
  { label: "Formats", free: "16:9, 9:16 and 1:1", premium: "16:9, 9:16 and 1:1" },
  { label: "Your own pictures and 3D models", free: "Yes", premium: "Yes" },
  { label: "Export a section of the track", free: "Yes", premium: "Yes" },
  { label: "Saved projects", free: "Yes, with an account", premium: "Yes" },
];

/** What the export choices are, and which of them the free plan has. */
export const EXPORT_CHOICES = {
  resolutions: RESOLUTION_KEYS.map((key) => ({
    value: key,
    label: RESOLUTIONS[key].label,
    isLocked: !resolutionsOf("FREE").includes(key),
  })),
  frameRates: FRAME_RATES.map((fps) => ({
    value: String(fps),
    label: `${fps} fps`,
    isLocked: !TIER_LIMITS.FREE.frameRates.includes(fps),
  })),
};

export const PLAN_QUESTIONS: Question[] = [
  {
    question: "What does the watermark look like?",
    answer: `A small "${BRAND.name}" in the bottom right corner. The editor's preview shows it exactly where the video will have it.`,
  },
  {
    question: "Do I need an account?",
    answer:
      "No. You can load a track, build a scene and export without one. An account keeps your projects and videos.",
  },
  {
    question: "Do I keep my projects on the free plan?",
    answer:
      "Yes. Projects, your own templates and your videos stay in your account on both plans.",
  },
  {
    question: "How is the payment handled?",
    answer: "By Stripe, on a page run by Stripe. Card details never reach this site.",
  },
  {
    question: "What happens when Premium ends?",
    answer: `The account goes back to the free plan. Nothing is deleted; projects set to a higher resolution export at ${RESOLUTIONS[TIER_LIMITS.FREE.maxResolution].label} until you upgrade again.`,
  },
];

export const PRODUCT_QUESTIONS: Question[] = [
  {
    question: "Which audio files can I use?",
    answer:
      "MP3, WAV, M4A, AAC, OGG and FLAC. The track is analysed once when you load it: bass, mids, highs, loudness and every beat.",
  },
  {
    question: "Does the video look like the preview?",
    answer:
      "Yes. The preview and the export are drawn by the same code, frame for frame. The preview plays at 60 fps; the export runs at the frame rate you choose.",
  },
  {
    question: "Can I use my own logo, cover or 3D model?",
    answer:
      "Yes. Pictures as PNG, JPG or WebP up to 10 MB, and 3D models as .glb up to 50 MB. Models with Draco compression and model animations are not supported yet.",
  },
  {
    question: "Can I export only a part of the song?",
    answer:
      "Yes. Export 15, 30 or 60 seconds from the playhead, or set any start and end on the timeline. The video and its sound are exactly that part.",
  },
  {
    question: "How long are my files kept?",
    answer:
      `Without an account, uploads and videos are deleted automatically after ${ANONYMOUS_FILE_DAYS} days. With an account they stay until you delete them.`,
  },
  {
    question: "Where is the video made?",
    answer:
      "You build the scene in your browser. The final video is drawn on the server, one after another in a queue, and the editor shows your place and the progress.",
  },
];
