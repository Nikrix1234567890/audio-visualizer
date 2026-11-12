import {
  TEMPLATE_CATEGORIES,
  templateCategories,
  type TemplateCategoryId,
} from "@/lib/templateCategories";
import { ELEMENT_DEFS, type AudioSource } from "../../../remotion/scene/definitions";
import { TEMPLATES, type SceneTemplate } from "../../../remotion/scene/templates";

/** What a template card needs. Small on purpose: it is sent to the browser. */
export type TemplateSummary = {
  id: string;
  label: string;
  elements: number;
  categories: TemplateCategoryId[];
};

export function summarize(template: SceneTemplate): TemplateSummary {
  return {
    id: template.id,
    label: template.label,
    elements: template.scene.elements.length,
    categories: templateCategories(template.id),
  };
}

export const TEMPLATE_SUMMARIES: TemplateSummary[] = TEMPLATES.map(summarize);

/** The categories that have at least one template, in their fixed order. */
export const USED_CATEGORIES = TEMPLATE_CATEGORIES.filter((category) =>
  TEMPLATE_SUMMARIES.some((template) => template.categories.includes(category.id)),
);

/** The name each signal has in the interface, and its colour key. */
export const SIGNALS: { source: AudioSource; sig: string; label: string; text: string }[] = [
  { source: "bass", sig: "bass", label: "Bass", text: "The low end: kick and bass line." },
  { source: "mid", sig: "mid", label: "Mids", text: "Vocals, guitars, synths." },
  { source: "treble", sig: "high", label: "Highs", text: "Hi-hats, cymbals, air." },
  { source: "level", sig: "level", label: "Level", text: "How loud the whole track is right now." },
  { source: "beat", sig: "beat", label: "Beat", text: "A short pulse on every beat that was found." },
];

export function signalOf(source: AudioSource) {
  return SIGNALS.find((signal) => signal.source === source) ?? SIGNALS[0];
}

const list = (words: string[]) =>
  words.length <= 1
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

/** The elements of a template, each once, with how often it is used. */
export function templateElements(template: SceneTemplate) {
  const seen = new Map<string, { type: string; label: string; description: string; count: number }>();
  for (const element of template.scene.elements) {
    const def = ELEMENT_DEFS[element.type];
    const entry = seen.get(element.type);
    if (entry) entry.count += 1;
    else seen.set(element.type, { type: element.type, label: def.label, description: def.description, count: 1 });
  }
  return [...seen.values()];
}

/** The signals a template has plugged in from the start, each once. */
export function templateSignals(template: SceneTemplate) {
  const sources = new Set<AudioSource>();
  const scene = template.scene;
  for (const binding of Object.values(scene.cameraBindings)) sources.add(binding.source);
  for (const binding of Object.values(scene.lookBindings)) sources.add(binding.source);
  for (const element of scene.elements) {
    for (const binding of Object.values(element.bindings)) sources.add(binding.source);
  }
  return SIGNALS.filter((signal) => sources.has(signal.source));
}

export function usesTempoSwing(template: SceneTemplate) {
  return template.scene.elements.some((element) => (element.tempo?.amount ?? 0) > 0);
}

/** One or two honest sentences about a template, read off its scene. */
export function describeTemplate(template: SceneTemplate): string {
  const elements = templateElements(template);
  const names = elements.map((element) =>
    element.count > 1 ? `${element.count} x ${element.label}` : element.label,
  );
  const total = template.scene.elements.length;
  const parts = [
    total === 1
      ? `${template.label} is a single element: ${names[0]}.`
      : `${template.label} is made of ${total} elements: ${list(names)}.`,
  ];
  const signals = templateSignals(template).map((signal) => signal.label.toLowerCase());
  if (signals.length > 0) parts.push(`It comes with ${list(signals)} already plugged in.`);
  if (usesTempoSwing(template)) parts.push("Its motion slows down and speeds up with a tempo swing.");
  parts.push("Open it and change anything.");
  return parts.join(" ");
}

export function findTemplate(id: string) {
  return TEMPLATES.find((template) => template.id === id);
}

/** Other templates on the same main shelf, then the rest of its shelves. */
export function relatedTemplates(id: string, limit = 4): TemplateSummary[] {
  const own = templateCategories(id);
  const others = TEMPLATE_SUMMARIES.filter((template) => template.id !== id);
  const main = others.filter((template) => template.categories.includes(own[0]));
  const more = others.filter(
    (template) => !main.includes(template) && template.categories.some((c) => own.includes(c)),
  );
  return [...main, ...more].slice(0, limit);
}
