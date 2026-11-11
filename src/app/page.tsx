import Link from "next/link";
import { TemplateGrid } from "@/components/TemplateGrid";
import { PlanCards } from "@/components/PlanCards";
import { Wordmark } from "@/components/Wordmark";
import { ELEMENT_TYPES } from "../../remotion/scene/definitions";
import { TEMPLATES } from "../../remotion/scene/templates";

const STEPS = [
  {
    label: "01 Input",
    title: "Load a track",
    text: "Drop in any song. It is analysed once - bass, mids, highs and every beat - right in your browser.",
  },
  {
    label: "02 Patch",
    title: "Build the scene",
    text: "Start from a template or an empty stage. Add elements, move them in the picture and wire any setting to the music.",
  },
  {
    label: "03 Output",
    title: "Render the video",
    text: "Pick a format and press Render. The video is drawn by the same code as the preview, so it looks exactly like what you built.",
  },
];

const FEATURES = [
  {
    title: "Every scene is yours",
    text: `${ELEMENT_TYPES.length} elements - rings, particle clouds, tunnels, terrain, text - that you add, remove, duplicate and arrange freely. Templates are only a starting point.`,
  },
  {
    title: "Anything can react",
    text: "Plug a setting into bass, mids, highs, loudness or the beat with one click: size, glow, position, camera shake, bloom.",
  },
  {
    title: "Bring your own",
    text: "Your logo, your cover art, your 3D model (.glb) - placed in the scene like any other element.",
  },
  {
    title: "Made for where it goes",
    text: "Landscape for YouTube, portrait for Reels, Shorts and TikTok, square for feeds. Up to 4K at 60 frames per second.",
  },
];

const primaryButton =
  "rounded-xl bg-brand px-6 py-3 text-sm font-semibold tracking-wide text-canvas outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink";
const secondaryButton =
  "rounded-xl border border-line bg-surface-raised px-6 py-3 text-sm font-semibold tracking-wide text-ink shadow-control-raised outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent";
const sectionLabel =
  "font-mono text-[11px] tracking-[0.12em] text-muted uppercase";

/** The landing page: what the app is, what it makes, what it costs. */
export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="surface-texture border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[5fr_6fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <span className={sectionLabel}>Audio-reactive 3D video</span>
            <h1 className="font-sans text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl">
              Turn a song into a video that{" "}
              <span className="text-accent">moves with it</span>.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted">
              Build a 3D scene from elements, wire it to the music and render
              it - all in the browser. No software to install, no timeline to
              learn.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/editor" className={primaryButton}>
                Open the editor
              </Link>
              <a href="#templates" className={secondaryButton}>
                See the templates
              </a>
            </div>
            <p className="text-xs text-muted">
              Free to use, no account needed to try it.
            </p>
          </div>

          <div className="relative rounded-2xl border border-line bg-surface p-2 shadow-scope-recessed">
            <video
              className="aspect-video w-full rounded-md bg-canvas object-cover"
              src="/landing/hero.mp4"
              poster="/landing/hero-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              aria-label="A galaxy of particles moving to music, made with the Galaxy template"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <h2 className={sectionLabel}>How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.label}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
              >
                <span className="font-mono text-[11px] tracking-[0.12em] text-accent uppercase">
                  {step.label}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="scroll-mt-4 border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <div className="flex flex-col gap-3">
            <h2 className={sectionLabel}>Templates</h2>
            <p className="max-w-xl text-2xl font-semibold tracking-tight text-ink">
              {TEMPLATES.length} starting points. Click one to open it in the
              editor.
            </p>
          </div>
          <TemplateGrid />
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <h2 className={sectionLabel}>What you can do</h2>
          <ul className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex flex-col gap-2 border-t border-line pt-5">
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  {feature.title}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-muted">
                  {feature.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Plans */}
      <section className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <div className="flex flex-col gap-3">
            <h2 className={sectionLabel}>Plans</h2>
            <p className="max-w-xl text-2xl font-semibold tracking-tight text-ink">
              Free to make videos. Premium when you want them bigger and
              unmarked.
            </p>
          </div>
          <PlanCards />
        </div>
      </section>

      {/* Closing call */}
      <section className="surface-texture">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16">
          <p className="max-w-xl text-3xl font-semibold tracking-tight text-ink">
            Your track is the only thing missing.
          </p>
          <Link href="/editor" className={primaryButton}>
            Open the editor
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-muted">
          <Wordmark />
          <nav className="flex gap-5">
            <Link href="/editor" className="hover:text-ink">
              Editor
            </Link>
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-ink">
              Log in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
