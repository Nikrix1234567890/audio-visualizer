import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import {
  EXPORT_CHOICES,
  FREE_TOP,
  PLAN_QUESTIONS,
  PREMIUM_TOP,
  PRODUCT_QUESTIONS,
  TEMPLATE_COUNT,
} from "@/components/site/content";
import {
  ExportDemo,
  KeyframeDemo,
  ReactDemo,
  StepBuild,
  StepExport,
  StepLoad,
} from "@/components/site/demos";
import { Faq } from "@/components/site/Faq";
import { Stagger, StaggerItem } from "@/components/site/kit";
import { NoScript } from "@/components/site/NoScript";
import { ArrowLink, ClosingCall, CompareTable, PageHero } from "@/components/site/sections";
import { SIGNALS } from "@/components/site/templateData";
import { Toc } from "@/components/site/Toc";

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to turn a song into a video: load a track, build a scene, make it react, animate it over time and export it.",
};

const CONTENTS = [
  { id: "start", label: "Getting started" },
  { id: "reactions", label: "Audio reactions" },
  { id: "keyframes", label: "Animating over time" },
  { id: "export", label: "Export and formats" },
  { id: "plans", label: "Plans" },
  { id: "shortcuts", label: "Keyboard shortcuts" },
  { id: "questions", label: "Questions" },
];

// The same list the editor shows under "?" (src/components/editor/EditorHelp.tsx).
// Keep the two in step.
const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: "Space", does: "Play / pause" },
  { keys: "← / →", does: "Jump 5 seconds back / ahead" },
  { keys: "Ctrl + Z", does: "Undo" },
  { keys: "Ctrl + Shift + Z", does: "Redo" },
  { keys: "Ctrl + S", does: "Save the project" },
  { keys: "Ctrl + D", does: "Duplicate the selected element" },
  { keys: "Delete", does: "Remove the selected element" },
  { keys: "Alt + ← → ↑ ↓", does: "Nudge the selected element (with Shift: forwards / back)" },
  { keys: "?", does: "Show the list of shortcuts" },
];

const STEPS = [
  {
    title: "Load a track",
    demo: <StepLoad />,
    text: [
      "Open the editor and drop an audio file on the stage, or choose one. MP3, WAV, M4A, AAC, OGG and FLAC work. No track at hand? The demo track is one click away.",
      "The track is analysed once: bass, mids, highs, loudness and every beat. Everything in the scene listens to that.",
    ],
  },
  {
    title: "Build the scene",
    demo: <StepBuild />,
    text: [
      `Pick one of the ${TEMPLATE_COUNT} templates, or start with an empty stage and add elements one by one. A template is only a starting point: every element in it can be changed, hidden, duplicated or removed.`,
      "Click an element in the picture to select it, then move, turn and scale it right there. Its settings appear next to the picture.",
    ],
  },
  {
    title: "Export the video",
    demo: <StepExport />,
    text: [
      "Choose a format (16:9, 9:16 or 1:1), a resolution and a frame rate, then press Export. The video is drawn on the server; you see the progress and can download the MP4 when it is done.",
      "With an account, finished videos also wait in your dashboard.",
    ],
  },
];

/** A shortcut as keys: words between the keys ("+", "/") stay plain text. */
function Keys({ keys }: { keys: string }) {
  return (
    <span className="keys">
      {keys.split(" ").map((part, i) =>
        part === "+" || part === "/" ? (
          <span key={i} className="keys__join">
            {part === "/" ? "or" : "+"}
          </span>
        ) : (
          <kbd key={i} className="pf-kbd">
            {part}
          </kbd>
        ),
      )}
    </span>
  );
}

function Chapter({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="help__chapter">
      <Reveal>
        <h2 className="help__h2">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}

/** How the editor works, from the first track to the finished video. */
export default function HelpPage() {
  return (
    <div className="lp site">
      <NoScript />
      <PageHero
        eyebrow="Help"
        title="From a song to a video, step by step."
        lead="Everything you need to know to make your first video, and where to look when you want more."
      >
        <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--lg">
          Open the editor
        </Link>
        <ArrowLink href="/features">See what the editor can do</ArrowLink>
      </PageHero>

      <div className="lp-wrap help">
        <aside className="help__side">
          <Toc items={CONTENTS} />
        </aside>

        <div className="help__body">
          <Chapter id="start" title="Getting started">
            <Stagger as="ol" className="help__steps" gap={0.1}>
              {STEPS.map((step, i) => (
                <StaggerItem as="li" key={step.title} className="help__step">
                  <div className="help__step-text">
                    <span className="pf-step__num">Step {i + 1}</span>
                    <h3 className="help__h3">{step.title}</h3>
                    {step.text.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="help__step-demo">{step.demo}</div>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal>
              <p className="help__p">
                You do not need an account for any of this. An account keeps your projects, your
                own templates and your videos.{" "}
                <Link href="/register" className="pf-link">
                  Create an account
                </Link>
              </p>
            </Reveal>
          </Chapter>

          <Chapter id="reactions" title="Audio reactions">
            <Reveal>
              <p className="help__p">
                Next to every setting that can move there is a small round jack. Click it and
                choose what the setting reacts to. The jack lights up in the colour of that
                signal, and a line in the same colour shows how far the music pushes the value.
                You decide how strongly it reacts, and you can unplug it again at any time.
              </p>
            </Reveal>
            <Reveal>
              <dl className="help__signals">
                {SIGNALS.map((signal) => (
                  <div key={signal.sig} data-sig={signal.sig}>
                    <dt>
                      <span className="pf-dot" />
                      {signal.label}
                    </dt>
                    <dd>{signal.text}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal className="help__demo">
              <ReactDemo />
            </Reveal>
            <Reveal>
              <p className="help__p">
                Counts and speeds cannot react: changing how many bars there are sixty times a
                second would only flicker. Everything else can, including position, rotation and
                scale of an element, the camera and the look of the whole scene.
              </p>
            </Reveal>
          </Chapter>

          <Chapter id="keyframes" title="Animating over time">
            <Reveal>
              <p className="help__p">
                The diamond next to a setting lets it change over the course of the song. Switch
                it on, move the playhead to a moment, and set the value: that is a keyframe. Move
                the playhead somewhere else and set another value. Between the two the value
                travels on its own, straight, smoothly, or holding until the next keyframe.
              </p>
            </Reveal>
            <Reveal className="help__demo">
              <KeyframeDemo />
            </Reveal>
            <Reveal>
              <ul className="help__list">
                <li>Keyframes show as diamonds in the timeline, one row per animated setting.</li>
                <li>Click a diamond to jump there, drag it to move it, Alt-drag to copy it.</li>
                <li>Zoom the timeline in, up to 16 times, to place keyframes exactly.</li>
                <li>
                  The camera moves (push in, pull out, crane, zoom punch, dolly zoom, impact) are
                  buttons that write such keyframes for you, starting at the playhead.
                </li>
                <li>A setting can be animated and react to the music at once: the reaction is added on top.</li>
              </ul>
            </Reveal>
          </Chapter>

          <Chapter id="export" title="Export and formats">
            <Reveal>
              <p className="help__p">
                A video can be landscape (16:9, for YouTube), portrait (9:16, for Reels, Shorts
                and TikTok) or square (1:1, for feeds). Switch at any time: the camera opens up
                so a scene built in one format stays in the picture in the others. The
                resolution names the short side, so 1080p is 1920 x 1080 in landscape and
                1080 x 1920 in portrait.
              </p>
            </Reveal>
            <Reveal className="help__demo">
              <ExportDemo {...EXPORT_CHOICES} />
            </Reveal>
            <Reveal>
              <ul className="help__list">
                <li>
                  60 fps matches the preview. 30 fps is done in roughly half the time.
                </li>
                <li>
                  Export the whole track, or a section: 15, 30 or 60 seconds from the playhead,
                  or any start and end of at least one second. The section shows on the timeline,
                  where its edges can be dragged.
                </li>
                <li>
                  Videos are drawn one after another. While yours waits, you see its place in
                  the queue; while it is drawn, the progress.
                </li>
                <li>What you get is an MP4 with your track as its sound.</li>
              </ul>
            </Reveal>
          </Chapter>

          <Chapter id="plans" title="Plans">
            <Reveal>
              <p className="help__p">
                Free exports up to {FREE_TOP} with a small watermark in the bottom right corner.
                Premium exports up to {PREMIUM_TOP} without one. Everything else is the same on
                both plans.
              </p>
            </Reveal>
            <CompareTable />
            <Reveal>
              <p className="help__p">
                <ArrowLink href="/pricing">See the plans</ArrowLink>
              </p>
            </Reveal>
          </Chapter>

          <Chapter id="shortcuts" title="Keyboard shortcuts">
            <Reveal>
              <p className="help__p">
                These work in the editor. Press <kbd className="pf-kbd">?</kbd> there to see the
                list. On a Mac, use Cmd where the list says Ctrl.
              </p>
            </Reveal>
            <Reveal className="lp-tablebox help__keys">
              <table className="pf-table">
                <caption className="sr-only">Keyboard shortcuts of the editor</caption>
                <thead>
                  <tr>
                    <th scope="col">Keys</th>
                    <th scope="col">What happens</th>
                  </tr>
                </thead>
                <tbody>
                  {SHORTCUTS.map((shortcut) => (
                    <tr key={shortcut.keys}>
                      <th scope="row">
                        <Keys keys={shortcut.keys} />
                      </th>
                      <td>{shortcut.does}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </Chapter>

          <Chapter id="questions" title="Questions">
            <Reveal>
              <Faq items={[...PRODUCT_QUESTIONS, ...PLAN_QUESTIONS]} />
            </Reveal>
          </Chapter>
        </div>
      </div>

      <ClosingCall />
      <SiteFooter />
    </div>
  );
}
