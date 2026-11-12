import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ELEMENT_COUNT,
  EXPORT_CHOICES,
  FREE_TOP,
  PREMIUM_TOP,
  TEMPLATE_COUNT,
} from "@/components/site/content";
import {
  CameraDemo,
  ExportDemo,
  FormatMorph,
  KeyframeDemo,
  LayersDemo,
  LyricsDemo,
  ParityDemo,
  ReactDemo,
  SignalBars,
  TempoDemo,
} from "@/components/site/demos";
import { CountUp, Stagger, StaggerItem } from "@/components/site/kit";
import { NoScript } from "@/components/site/NoScript";
import { ClosingCall, PageHero } from "@/components/site/sections";
import { SIGNALS, usesTempoSwing } from "@/components/site/templateData";
import { ELEMENT_DEFS, ELEMENT_TYPES, FONTS } from "../../../remotion/scene/definitions";
import { PALETTES } from "../../../remotion/scene/palettes";
import { TEMPLATES } from "../../../remotion/scene/templates";

export const metadata: Metadata = {
  title: "Features",
  description: `${ELEMENT_COUNT} elements, five audio signals, keyframes, camera moves and three formats. A tour of what the editor can do.`,
};

const hasPicture = (type: string) =>
  existsSync(path.join(process.cwd(), "public", "thumbnails", "elements", `${type}.jpg`));

/** One stop of the tour: words on one side, a working piece of the editor on the other. */
function Stop({
  id,
  eyebrow,
  title,
  lead,
  points,
  children,
  isFlipped = false,
  extra,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
  children: ReactNode;
  isFlipped?: boolean;
  /** Shown under the points, on the words' side. */
  extra?: ReactNode;
}) {
  return (
    <section id={id} className="lp-rule">
      <div className={`lp-wrap lp-section ft ${isFlipped ? "ft--flip" : ""}`}>
        <Reveal className="ft__text">
          <p className="lp-eyebrow">{eyebrow}</p>
          <h2 className="lp-h2 ft__h2">{title}</h2>
          <p className="lp-lead">{lead}</p>
          <ul className="ft__list">
            {points.map((point) => (
              <li key={point}>
                <Check className="pf-i text-accent" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
          {extra}
        </Reveal>
        <Reveal className="ft__demo" delay={140}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}

const MORE = [
  {
    title: "Colour palettes",
    text: `${PALETTES.length} palettes recolour a whole scene in one click.`,
  },
  {
    title: "Click it in the picture",
    text: "Select an element by clicking it in the preview, then move, turn and scale it right there.",
  },
  {
    title: "Undo and redo",
    text: "Every change can be taken back, including loading a template by mistake.",
  },
  {
    title: "Your own templates",
    text: "Save a scene as your own template and share it by link. The link carries the scene, not your track or private files.",
  },
  {
    title: "Projects and videos",
    text: "With an account, projects are saved with a picture and finished videos wait in the dashboard.",
  },
  {
    title: "Keyboard shortcuts",
    text: "Play, undo, save, duplicate and nudge from the keyboard. The list is one key away.",
  },
];

/** A deeper tour than the landing page: one stop per thing the editor can do. */
export default function FeaturesPage() {
  const swingCount = TEMPLATES.filter(usesTempoSwing).length;

  return (
    <div className="lp site">
      <NoScript />
      <PageHero
        eyebrow="Features"
        title="An editor, not a preset picker."
        lead="Build a 3D scene from elements, plug it into your track and export the video. Here is everything the editor can do, each with a piece of it to try."
      >
        <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--lg">
          Open the editor
          <ArrowRight className="pf-i" aria-hidden />
        </Link>
        <Link href="/templates" className="pf-btn pf-btn--secondary pf-btn--lg">
          Browse templates
        </Link>
      </PageHero>

      <div className="lp-wrap">
        <Reveal>
          <dl className="stats stats--wide">
            <div>
              <dd>
                <CountUp value={ELEMENT_COUNT} />
              </dd>
              <dt>elements</dt>
            </div>
            <div>
              <dd>
                <CountUp value={TEMPLATE_COUNT} />
              </dd>
              <dt>templates</dt>
            </div>
            <div>
              <dd>
                <CountUp value={SIGNALS.length} />
              </dd>
              <dt>audio signals</dt>
            </div>
            <div>
              <dd>
                <CountUp value={3} />
              </dd>
              <dt>formats</dt>
            </div>
          </dl>
        </Reveal>
      </div>

      <section id="elements" className="lp-wrap lp-section">
        <Reveal className="lp-head">
          <p className="lp-eyebrow">Elements</p>
          <h2 className="lp-h2">{ELEMENT_COUNT} elements to build with.</h2>
          <p className="lp-lead">
            A scene is a stack of elements: rings, particle clouds, tunnels,
            terrain, text, your own files. Add, hide, duplicate, reorder and
            tune each one. A template is nothing more than a few of them with
            chosen settings.
          </p>
        </Reveal>
        <Stagger as="ul" className="el-wall" gap={0.012}>
          {ELEMENT_TYPES.map((type) => (
            <StaggerItem as="li" key={type} className="pf-ecard el-tile">
              {hasPicture(type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="thumb thumb--sq"
                  src={`/thumbnails/elements/${type}.jpg`}
                  alt=""
                  width={160}
                  height={120}
                  loading="lazy"
                />
              ) : (
                <span className="thumb thumb--sq block" />
              )}
              <span className="pf-ecard__name" title={ELEMENT_DEFS[type].description}>
                {ELEMENT_DEFS[type].label}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Stop
        id="reactions"
        eyebrow="Audio reactions"
        title="Anything can react to the music."
        lead="Your track is analysed once, into five signals. Plug any setting into one of them with one click and set how strongly it reacts."
        points={[
          "Works on element settings, position, rotation and scale, the camera and the look",
          "Each signal keeps its colour everywhere, so you always see what drives what",
          "The amount is yours: a gentle breath or a hard kick",
        ]}
        extra={<SignalBars signals={SIGNALS.map(({ sig, label, text }) => ({ sig, label, text }))} />}
      >
        <div className="pf-card">
          <ReactDemo />
          <p className="pf-card__text">
            Choose a signal for bar height. The coloured line under a value shows how far the
            music pushes it.
          </p>
        </div>
      </Stop>

      <Stop
        id="keyframes"
        isFlipped
        eyebrow="Animate over time"
        title="Set a value now and another later."
        lead="The diamond next to a setting switches it on. From then on, changing the value sets a keyframe at the playhead, and the value travels between them."
        points={[
          "Three ways to travel: straight, smooth, or hold until the next keyframe",
          "Keyframes sit in the timeline under the waveform: click to go there, drag to move, Alt-drag to copy",
          "The timeline zooms in up to 16 times",
          "An audio reaction is added on top of the animated value",
        ]}
      >
        <div className="pf-card">
          <KeyframeDemo />
          <p className="pf-card__text">
            Glow travels from one diamond to the next while the playhead crosses the track.
          </p>
        </div>
      </Stop>

      <Stop
        id="camera"
        eyebrow="Camera moves"
        title="Direct the camera with one button."
        lead="Push in, pull out, crane, zoom punch, dolly zoom and impact. Each button writes ordinary camera keyframes starting at the playhead."
        points={[
          "Place a move on a drop, a break or the last chorus",
          "Drag its keyframes to make it longer or shorter",
          "The camera can also orbit, sway and shake with the bass on its own",
        ]}
      >
        <div className="pf-card">
          <CameraDemo />
          <p className="pf-card__text">
            A flat sketch of each move. In the editor the real camera flies through the scene.
          </p>
        </div>
      </Stop>

      <Stop
        id="tempo"
        isFlipped
        eyebrow="Tempo swing"
        title="Slow down, speed up."
        lead="Every element has its own clock. Let it swing in an even wave, or on the beat: the motion surges on every beat and falls into slow motion in between."
        points={[
          "Set how deep the swing goes and how long one wave lasts",
          "Each element swings on its own, so layers can drift against each other",
          `${swingCount} of the ${TEMPLATE_COUNT} templates use it out of the box`,
        ]}
      >
        <div className="pf-card">
          <TempoDemo />
          <p className="pf-card__text">Pick a mode and watch the dot change its pace.</p>
        </div>
      </Stop>

      <Stop
        id="own"
        eyebrow="Your own material"
        title="Bring your logo, your cover, your words."
        lead="Your own files are elements like any other: place them, scale them, let them react."
        points={[
          "Pictures as PNG, JPG or WebP up to 10 MB, rectangular or cropped to a circle",
          "3D models as .glb up to 50 MB, fitted to size and slowly turning",
          `Text in ${FONTS.length} typefaces, and a track title with the artist underneath`,
          "Lyrics: one timed line per row, .lrc times work too",
        ]}
      >
        <div className="ft__stack">
          <div className="pf-card">
            <LayersDemo />
            <p className="pf-card__text">Your picture lands in the layer list, on top of the scene.</p>
          </div>
          <div className="pf-card">
            <LyricsDemo />
            <p className="pf-card__text">Each line fades in at its time and out again.</p>
          </div>
        </div>
      </Stop>

      <Stop
        id="export"
        isFlipped
        eyebrow="Formats and export"
        title="One scene, three formats."
        lead="Landscape for YouTube, portrait for Reels, Shorts and TikTok, square for feeds. Switch format and the camera adapts, so the scene stays in the picture."
        points={[
          `Free exports up to ${FREE_TOP} with a small watermark, Premium up to ${PREMIUM_TOP} without one`,
          "The resolution names the short side: 1080p is 1920 x 1080, 1080 x 1920 or 1080 x 1080",
          "Export the whole track, 15, 30 or 60 seconds from the playhead, or any section you mark",
          "Videos are drawn one after another; you see your place in the queue and the progress",
        ]}
      >
        <div className="ft__stack">
          <div className="pf-card">
            <FormatMorph />
          </div>
          <div className="pf-card">
            <ExportDemo {...EXPORT_CHOICES} />
          </div>
        </div>
      </Stop>

      <Stop
        id="parity"
        eyebrow="Preview is export"
        title="What you see is the video."
        lead="There is no separate export engine. The preview in the editor and the final video are drawn by the same code, frame for frame."
        points={[
          "The preview always plays at 60 fps; the export runs at the frame rate you choose",
          "The watermark of the free plan is shown in the preview, exactly where the video has it",
          "Nothing to guess, nothing to re-export",
        ]}
      >
        <div className="pf-card">
          <ParityDemo templateId="galaxy" />
          <p className="pf-card__text">The same loop twice, held in step.</p>
        </div>
      </Stop>

      <section className="lp-rule">
        <div className="lp-wrap lp-section">
          <Reveal className="lp-head">
            <p className="lp-eyebrow">And the rest</p>
            <h2 className="lp-h2">The small things that make it an editor.</h2>
          </Reveal>
          <Stagger className="lp-grid" gap={0.06}>
            {MORE.map((item) => (
              <StaggerItem key={item.title} className="pf-card s4">
                <h3 className="pf-card__title">{item.title}</h3>
                <p className="pf-card__text">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <ClosingCall />
      <SiteFooter />
    </div>
  );
}
