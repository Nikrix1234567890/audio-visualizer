import Link from "next/link";
import { HeroScene } from "@/components/landing/HeroScene";
import { PlanCards } from "@/components/PlanCards";
import { Reveal } from "@/components/Reveal";
import { TemplateGrid } from "@/components/TemplateGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { ELEMENT_TYPES } from "../../remotion/scene/definitions";
import { TEMPLATES } from "../../remotion/scene/templates";

const STEPS = [
  {
    label: "01",
    title: "Load a track",
    text: "Drop in any song. It is analysed once - bass, mids, highs and every beat - right in your browser.",
  },
  {
    label: "02",
    title: "Build the scene",
    text: "Start from a template or an empty stage. Add elements, move them in the picture and wire any setting to the music.",
  },
  {
    label: "03",
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
    title: "Animate over time",
    text: "Set a value at one moment and another later on, and it travels between them. Keyframes sit on the timeline, right above the waveform.",
  },
  {
    title: "Slow down, speed up",
    text: "Give an element a tempo swing and its motion breathes: into slow motion and out again, in a wave or on the beat.",
  },
  {
    title: "Bring your own",
    text: "Your logo, your cover art, your 3D model (.glb) - placed in the scene like any other element.",
  },
  {
    title: "What you see is the video",
    text: "No separate export engine. The preview and the final render run the same code, frame for frame.",
  },
];

/** Portrait loops shown in phone frames (rendered by `pnpm previews`). */
const PORTRAIT = [
  { id: "galaxy", label: "Galaxy" },
  { id: "pulseRing", label: "Pulse Ring" },
  { id: "jellyfish", label: "Jellyfish" },
  { id: "helix", label: "Helix" },
];

const STATS = [
  { value: String(TEMPLATES.length), label: "templates" },
  { value: String(ELEMENT_TYPES.length), label: "elements" },
  { value: "4K", label: "at 60 fps" },
  { value: "3", label: "formats" },
];

const primaryButton =
  "rounded-xl bg-brand px-6 py-3 text-sm font-semibold tracking-wide text-canvas outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink";
const secondaryButton =
  "glass rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-ink outline-none hover:text-accent focus-visible:border-accent";
const sectionLabel =
  "font-mono text-[11px] tracking-[0.12em] text-accent uppercase";
const sectionTitle =
  "max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl";

/** The landing page: what the app is, what it makes, what it costs. */
export default function LandingPage() {
  return (
    <div className="relative flex flex-col overflow-hidden">
      {/* The glow behind the top of the page. */}
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-16 pb-12 lg:grid-cols-[5fr_6fr] lg:pt-24">
          <div className="flex flex-col gap-6">
            <span className="glass w-fit rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
              Audio-reactive 3D video
            </span>
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-tight text-ink sm:text-6xl">
              Make your music <span className="text-brand">visible</span>.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted">
              Build a 3D scene from elements, wire it to your track and render
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

          <HeroScene />
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-16">
          <dl className="glass grid grid-cols-2 gap-y-6 rounded-2xl px-6 py-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <dd className="text-brand text-3xl font-semibold tracking-tight">
                  {stat.value}
                </dd>
                <dt className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <Reveal className="flex flex-col gap-3">
            <h2 className={sectionLabel}>How it works</h2>
            <p className={sectionTitle}>From a song to a video in three steps.</p>
          </Reveal>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.label}>
                <Reveal
                  delay={i * 120}
                  className="glass flex h-full flex-col gap-3 rounded-2xl p-6"
                >
                  <span className="text-brand text-4xl font-semibold tracking-tight">
                    {step.label}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="relative scroll-mt-4 border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <Reveal className="flex flex-col gap-3">
            <h2 className={sectionLabel}>Templates</h2>
            <p className={sectionTitle}>
              {TEMPLATES.length} starting points. Hover to see one move, click
              to open it.
            </p>
          </Reveal>
          <Reveal>
            <TemplateGrid />
          </Reveal>
        </div>
      </section>

      {/* Formats */}
      <section className="relative border-t border-line">
        <div
          aria-hidden
          className="aurora pointer-events-none absolute inset-0 opacity-60"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[4fr_7fr]">
          <Reveal className="flex flex-col gap-4">
            <h2 className={sectionLabel}>Made for where it goes</h2>
            <p className={sectionTitle}>Portrait, square or landscape.</p>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              One scene, three formats. Switch to 9:16 for Reels, Shorts and
              TikTok, to 1:1 for feeds or stay in 16:9 for YouTube - the
              camera adapts so your scene stays in the picture.
            </p>
          </Reveal>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PORTRAIT.map((item, i) => (
              <li key={item.id}>
                <Reveal delay={i * 100}>
                  <Link
                    href={`/editor?template=${item.id}`}
                    className="group block overflow-hidden rounded-[22px] border border-line bg-surface p-1.5 outline-none hover:border-accent-dim focus-visible:border-accent"
                    aria-label={`Open the ${item.label} template`}
                  >
                    <video
                      className="aspect-[9/16] w-full rounded-[16px] bg-canvas object-cover"
                      src={`/previews/portrait/${item.id}.mp4`}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <Reveal className="flex flex-col gap-3">
            <h2 className={sectionLabel}>What you can do</h2>
            <p className={sectionTitle}>An editor, not a preset picker.</p>
          </Reveal>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <li key={feature.title}>
                <Reveal
                  delay={(i % 3) * 100}
                  className="glass flex h-full flex-col gap-2 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {feature.text}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Plans */}
      <section className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <Reveal className="flex flex-col gap-3">
            <h2 className={sectionLabel}>Plans</h2>
            <p className={sectionTitle}>
              Free to make videos. Premium when you want them bigger and
              unmarked.
            </p>
          </Reveal>
          <Reveal>
            <PlanCards />
          </Reveal>
        </div>
      </section>

      {/* Closing call */}
      <section className="relative border-t border-line">
        <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
        <Reveal className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <p className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">
            Your track is the only thing <span className="text-brand">missing</span>.
          </p>
          <Link href="/editor" className={primaryButton}>
            Open the editor
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
